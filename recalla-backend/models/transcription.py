import os
import glob
import shutil
import sys
import uuid

# Speech-to-text is optional on the server.
#
# Transcription now runs on the user's device — the mobile app sends finished
# text, so a deployed server never loads Whisper and should not carry torch
# (roughly 2 GB of wheels, and more resident memory than a 1 GB instance has).
# Developer machines still have it, so import it when present and degrade
# cleanly when not, rather than making the whole API refuse to start.
try:
    import whisper
    TRANSCRIPTION_AVAILABLE = True
except ImportError:
    whisper = None
    TRANSCRIPTION_AVAILABLE = False


class TranscriptionUnavailable(RuntimeError):
    """Raised when audio is sent to a server that has no speech model."""


def _require_whisper():
    if not TRANSCRIPTION_AVAILABLE:
        raise TranscriptionUnavailable(
            "This server does not transcribe audio. Recording and "
            "speech-to-text happen in the Recalla app on your device; the "
            "server receives the finished transcript."
        )

# Use every core — this box is CPU-only, so threading is the whole ballgame.
try:
    import torch
    torch.set_num_threads(max(1, os.cpu_count() or 1))
except Exception:
    pass

# ── Dynamic ffmpeg path detection ─────────────────────────────────────────────
def find_ffmpeg():
    # Already on PATH (any OS)? Use it.
    found = shutil.which("ffmpeg")
    if found:
        return os.path.dirname(found)

    # POSIX: common install locations, incl. pip/user-local installs
    if os.name != "nt":
        for path in (
            os.path.expanduser("~/.local/bin"),
            "/usr/local/bin",
            "/usr/bin",
            "/snap/bin",
            "/opt/homebrew/bin",
        ):
            if os.path.exists(os.path.join(path, "ffmpeg")):
                return path
        return None

    # Windows
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
elif os.name == "nt":
    print("[Recalla] WARNING: ffmpeg not found. Install via: winget install \"FFmpeg (Essentials Build)\"")
else:
    print("[Recalla] WARNING: ffmpeg not found. Install via: sudo apt install ffmpeg")


# ── Whisper models ───────────────────────────────────────────────────────────
# Measured on this machine (i5-8250U, 8 threads, CPU only), real-time factor:
#   tiny 0.23x | base 0.35x | small 1.06x
# Anything at/above 1.0x cannot keep up with a live stream, so the live pass
# uses BASE and the optional refinement pass uses SMALL.
LIVE_MODEL   = "base"
REFINE_MODEL = "small"

_models = {}

def get_model(name: str = REFINE_MODEL):
    """Load (and cache) a Whisper model by name."""
    if name not in _models:
        print(f"[Recalla] Loading Whisper model ({name})...")
        _require_whisper()
        _models[name] = whisper.load_model(name)
        print(f"[Recalla] Model '{name}' loaded.")
    return _models[name]

def is_model_loaded(name: str = REFINE_MODEL):
    return name in _models

def free_model(name: str):
    """Drop a model to reclaim RAM (this box only has ~4GB free)."""
    if name in _models:
        del _models[name]
        import gc; gc.collect()
        print(f"[Recalla] Model '{name}' unloaded.")


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
def transcribe_audio(file_path: str, job_id: str = None, hint_speakers: int = None,
                     model_name: str = REFINE_MODEL) -> dict:
    """
    Transcribe audio + detect speakers.
    hint_speakers: optional expected number of speakers (forces diarization to this count)
    model_name:    which Whisper model to use (see LIVE_MODEL / REFINE_MODEL)
    """



class EmptyAudio(Exception):
    """Raised when a file contains no usable audio to transcribe."""


# Whisper needs roughly this much sound to produce anything. Below it, the
# encoder is handed a zero-length tensor and torch fails with "cannot reshape
# tensor of 0 elements into shape [1, 0, 12, -1]" — an error that says nothing
# to a user whose microphone simply was not capturing.
MIN_AUDIO_SECONDS = 0.35


def check_audio(file_path: str) -> float:
    """
    Return the duration in seconds, or raise EmptyAudio.

    Called before every transcribe(). A silent or zero-length recording is a
    normal thing to happen — a denied microphone permission, a muted input,
    a stop pressed too quickly — so it deserves a sentence the user can act
    on rather than a tensor shape.
    """
    import os

    if not file_path or not os.path.exists(file_path):
        raise EmptyAudio("That recording could not be found on the server.")

    if os.path.getsize(file_path) < 1024:
        raise EmptyAudio(
            "The recording is empty. Check that the microphone is not muted "
            "and that the browser is allowed to use it, then try again."
        )

    try:
        _require_whisper()
        audio = whisper.load_audio(file_path)
        seconds = len(audio) / 16000.0
    except EmptyAudio:
        raise
    except Exception as e:
        raise EmptyAudio(f"That audio could not be read ({type(e).__name__}).")

    if seconds < MIN_AUDIO_SECONDS:
        raise EmptyAudio(
            "The recording contains no audio. Check that the right microphone "
            "is selected and that it is not muted, then try again."
        )
    return seconds

    # Step 0 — Load Whisper
    if job_id:
        if not is_model_loaded(model_name):
            update_job(job_id, status="loading_model", step=0, progress=8)
        else:
            update_job(job_id, status="loading_model", step=0, progress=15)

    _require_whisper()

    # Fail with something readable before torch fails with a tensor shape.
    check_audio(file_path)

    model = get_model(model_name)

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