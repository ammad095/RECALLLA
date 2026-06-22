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

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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


# ── 5. Tag text only ─────────────────────────────────────────────────────────
@router.post("/tag-text")
async def tag_text(payload: dict):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    tags = extract_tags_and_entities(text)
    return JSONResponse({"success": True, "tagging": tags})