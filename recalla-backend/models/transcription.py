import whisper
import os

# Tell Whisper exactly where ffmpeg is — bypasses PATH issues
FFMPEG_DIR = r"C:\Users\dell\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-essentials_build\bin"
os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading Whisper model (small)... this may take 30 seconds on first run")
        _model = whisper.load_model("small")
        print("Model loaded successfully")
    return _model

def transcribe_audio(file_path: str) -> dict:
    model = get_model()
    result = model.transcribe(
        file_path,
        verbose=False,
        word_timestamps=True,
        task="transcribe",
    )

    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start":   round(seg["start"], 2),
            "end":     round(seg["end"],   2),
            "text":    seg["text"].strip(),
            "speaker": "Speaker 1",
        })

    return {
        "full_text":  result["text"].strip(),
        "language":   result.get("language", "en"),
        "segments":   segments,
        "duration":   segments[-1]["end"] if segments else 0,
        "word_count": len(result["text"].split()),
    }