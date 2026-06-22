import os
import glob
import whisper
import uuid

# ── Dynamic ffmpeg path detection ─────────────────────────────────────────────
def find_ffmpeg():
    user = os.environ.get("USERNAME", "")
    winget_pattern = rf"C:\Users\{user}\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials*\ffmpeg-*-essentials_build\bin"
    matches = glob.glob(winget_pattern)
    if matches:
        return matches[0]
    common_paths = [
        r"C:\ffmpeg\bin",
        r"C:\Program Files\ffmpeg\bin",
        r"C:\Program Files (x86)\ffmpeg\bin",
        rf"C:\Users\{user}\ffmpeg\bin",
        rf"C:\Users\{user}\Downloads\ffmpeg\bin",
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
    path_env = os.environ.get("PATH", "")
    for p in path_env.split(os.pathsep):
        if p and os.path.exists(os.path.join(p, "ffmpeg.exe")):
            return p
    return None


ffmpeg_dir = find_ffmpeg()
if ffmpeg_dir:
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    print(f"[Recalla] ffmpeg found at: {ffmpeg_dir}")
else:
    print("[Recalla] WARNING: ffmpeg not found. Install via: winget install \"FFmpeg (Essentials Build)\"")


# ── Lazy-loaded Whisper model ────────────────────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        print("[Recalla] Loading Whisper model (small)... ~30s on first run")
        _model = whisper.load_model("small")
        print("[Recalla] Model loaded successfully.")
    return _model

def is_model_loaded():
    return _model is not None


# ── Job tracking ─────────────────────────────────────────────────────────────
JOBS = {}

def create_job():
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "progress": 0, "step": 0, "status": "pending",
        "result": None, "error": None,
    }
    return job_id

def update_job(job_id, **kwargs):
    if job_id in JOBS:
        JOBS[job_id].update(kwargs)

def get_job(job_id):
    return JOBS.get(job_id)

def delete_job(job_id):
    if job_id in JOBS:
        del JOBS[job_id]


# ── Main transcription pipeline ──────────────────────────────────────────────
def transcribe_audio(file_path: str, job_id: str = None, hint_speakers: int = None) -> dict:
    """
    Transcribe audio + detect speakers.
    hint_speakers: optional expected number of speakers (forces diarization to this count)
    """

    # Step 0 — Load Whisper
    if job_id:
        if not is_model_loaded():
            update_job(job_id, status="loading_model", step=0, progress=8)
        else:
            update_job(job_id, status="loading_model", step=0, progress=15)

    model = get_model()

    # Step 1 — Whisper transcription
    if job_id:
        update_job(job_id, status="transcribing", step=1, progress=25)

    result = model.transcribe(
        file_path,
        verbose=False,
        word_timestamps=True,
        task="transcribe",
    )

    if job_id:
        update_job(job_id, step=2, progress=60)

    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start":   round(seg["start"], 2),
            "end":     round(seg["end"],   2),
            "text":    seg["text"].strip(),
            "speaker": "Speaker 1",
        })

    # Step 2 — Speaker diarization
    if job_id:
        update_job(job_id, status="diarizing", step=2, progress=65)

    try:
        from models.diarization import diarize_segments
        segments = diarize_segments(file_path, segments, hint_speakers=hint_speakers)
    except ImportError:
        print("[Recalla] Diarization module not available — install: pip install librosa scikit-learn")
    except Exception as e:
        print(f"[Recalla] Diarization failed (continuing without): {e}")

    if job_id:
        update_job(job_id, step=3, progress=88)

    num_speakers = len(set(seg.get("speaker", "Speaker 1") for seg in segments))

    return {
        "full_text":    result["text"].strip(),
        "language":     result.get("language", "en"),
        "segments":     segments,
        "duration":     segments[-1]["end"] if segments else 0,
        "word_count":   len(result["text"].split()),
        "num_speakers": num_speakers,
    }