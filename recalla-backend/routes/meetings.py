from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os, shutil, uuid

from models.transcription import transcribe_audio
from models.tagging import extract_tags_and_entities

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/transcribe")
async def transcribe_meeting(audio: UploadFile = File(...)):
    """
    Upload an audio file → get back transcript + tags + entities.
    Accepts: .mp3, .mp4, .wav, .m4a, .ogg, .webm
    """
    allowed = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm"}
    ext = os.path.splitext(audio.filename)[1].lower()

    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported. Use: {allowed}")

    # Save uploaded file
    file_id   = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    try:
        # Step 1 — Transcribe
        transcript = transcribe_audio(file_path)

        # Step 2 — Tag and extract entities
        tags = extract_tags_and_entities(transcript["full_text"])

        # Clean up file after processing
        os.remove(file_path)

        return JSONResponse({
            "success":    True,
            "transcript": transcript,
            "tagging":    tags,
        })

    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tag-text")
async def tag_text(payload: dict):
    """
    Send plain text → get back tags and entities.
    Useful for tagging manually entered notes.
    """
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    tags = extract_tags_and_entities(text)
    return JSONResponse({"success": True, "tagging": tags})