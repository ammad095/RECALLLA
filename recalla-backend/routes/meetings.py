from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil
import threading
import traceback
import uuid

from models.transcription import (
    transcribe_audio,
    create_job,
    get_job,
    update_job,
    delete_job,
    is_model_loaded,
)
from models.tagging import extract_tags_and_entities
from models import live_session as live

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm"}


def process_audio_background(file_path: str, job_id: str, hint_speakers: int = None):
    """Run transcription + diarization + tagging in background."""
    try:
        transcript = transcribe_audio(file_path, job_id=job_id, hint_speakers=hint_speakers)

        update_job(job_id, status="tagging", step=4, progress=92)
        tags = extract_tags_and_entities(transcript["full_text"])

        update_job(
            job_id,
            status="done",
            step=5,
            progress=100,
            result={"transcript": transcript, "tagging": tags},
        )

        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        traceback.print_exc()
        update_job(job_id, status="error", error=str(e))
        if os.path.exists(file_path):
            os.remove(file_path)


# ── 1. Start async transcription ─────────────────────────────────────────────
@router.post("/transcribe-async")
async def transcribe_async(
    audio: UploadFile = File(...),
    expected_speakers: int = Form(None),
):
    """Start transcription asynchronously. Returns job_id for polling.

    Optional `expected_speakers` form field hints diarization to expect N speakers.
    """
    allowed = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm"}
    ext = os.path.splitext(audio.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported.")

    job_id = create_job()
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    # Convert expected_speakers to int safely
    hint = None
    if expected_speakers is not None:
        try:
            hint = int(expected_speakers)
            if hint < 1:
                hint = None
        except (ValueError, TypeError):
            hint = None

    thread = threading.Thread(
        target=process_audio_background,
        args=(file_path, job_id, hint),
        daemon=True,
    )
    thread.start()

    return JSONResponse({
        "success":      True,
        "job_id":       job_id,
        "model_loaded": is_model_loaded(),
        "hint_speakers": hint,
    })


# ── 2. Poll progress ─────────────────────────────────────────────────────────
@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    response = {
        "job_id":   job_id,
        "status":   job["status"],
        "progress": job["progress"],
        "step":     job["step"],
    }

    if job["status"] == "done":
        response["result"] = job["result"]
    elif job["status"] == "error":
        response["error"] = job["error"]

    return JSONResponse(response)


# ── 3. Cleanup ───────────────────────────────────────────────────────────────
@router.delete("/job/{job_id}")
async def cleanup_job(job_id: str):
    delete_job(job_id)
    return JSONResponse({"success": True})


# ── 4. Sync transcription (legacy) ───────────────────────────────────────────
@router.post("/transcribe")
async def transcribe_meeting(
    audio: UploadFile = File(...),
    expected_speakers: int = Form(None),
):
    allowed = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm"}
    ext = os.path.splitext(audio.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported.")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    hint = None
    if expected_speakers is not None:
        try:
            hint = int(expected_speakers)
            if hint < 1:
                hint = None
        except (ValueError, TypeError):
            hint = None

    try:
        transcript = transcribe_audio(file_path, hint_speakers=hint)
        tags = extract_tags_and_entities(transcript["full_text"])
        os.remove(file_path)
        return JSONResponse({"success": True, "transcript": transcript, "tagging": tags})
    except Exception as e:
        traceback.print_exc()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


# ── LIVE SESSION ─────────────────────────────────────────────────────────────
# Audio windows are streamed while the meeting is still recording, so the
# transcript is already built by the time the user stops. See
# models/live_session.py for the window geometry and reasoning.

@router.post("/session/start")
async def session_start(payload: dict = None):
    payload = payload or {}
    hint = payload.get("expected_speakers")
    try:
        hint = int(hint) if hint else None
        if hint is not None and hint < 1:
            hint = None
    except (TypeError, ValueError):
        hint = None

    live.cleanup_stale()
    sid = live.create_session(hint_speakers=hint)
    return JSONResponse({
        "success": True,
        "session_id": sid,
        "window_seconds": live.WINDOW,
        "step_seconds": live.STEP,
        "model": live.LIVE_MODEL,
    })


@router.post("/session/{session_id}/chunk")
async def session_chunk(
    session_id: str,
    audio: UploadFile = File(...),
    is_first: bool = Form(False),
    offset: float = Form(None),   # absolute start time of this window, from the recorder
):
    s = live.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s["status"] not in ("recording", "finalizing"):
        raise HTTPException(status_code=409, detail=f"Session is {s['status']}")

    ext = os.path.splitext(audio.filename or "")[1].lower() or ".wav"
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported.")

    path = os.path.join(live.SESSION_DIR, f"{session_id}_{s['chunk_count']:04d}{ext}")
    with open(path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    try:
        state, new_segments = live.process_chunk(
            session_id, path, is_first=bool(is_first), offset=offset
        )
        return JSONResponse({"success": True, "new_segments": new_segments, **state})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def session_state(session_id: str):
    s = live.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return JSONResponse(live._public(s))


@router.post("/session/{session_id}/finalize")
async def session_finalize(session_id: str, payload: dict = None):
    s = live.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    payload = payload or {}
    result = live.finalize_session(session_id)

    if payload.get("refine", True) and result.get("status") == "done":
        live.start_refine(session_id)
        result["refine"] = s["refine"]

    return JSONResponse({"success": result.get("status") == "done", **result})


@router.get("/session/{session_id}/refine")
async def session_refine_status(session_id: str):
    s = live.get_session(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return JSONResponse({
        "success": True,
        "refine": s["refine"],
        "segments": s["segments"],
        "full_text": s["full_text"],
        "tagging": s["tagging"],
    })


@router.delete("/session/{session_id}")
async def session_delete(session_id: str):
    live.delete_session(session_id)
    return JSONResponse({"success": True})


# ── 5. Tag text only ─────────────────────────────────────────────────────────
@router.post("/tag-text")
async def tag_text(payload: dict):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    tags = extract_tags_and_entities(text)
    return JSONResponse({"success": True, "tagging": tags})