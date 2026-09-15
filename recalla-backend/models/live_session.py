"""
Live meeting pipeline.

Instead of waiting until the recording stops, the browser streams fixed audio
windows while the meeting is still running. Each window is transcribed with the
BASE model (0.35x real-time on this hardware, so it keeps up comfortably) and
its speaker features are extracted immediately.

When the user stops, the only work left is global speaker clustering plus
tagging — both milliseconds — so results are effectively instant.

Windows overlap slightly so words spanning a boundary are not clipped; the
duplicated head of each window is discarded after transcription.

An optional refinement pass then re-transcribes the full recording with the
SMALL model in the background and upgrades the text in place.
"""

import os
import time
import uuid
import threading
import traceback

from models.transcription import (
    get_model, free_model, LIVE_MODEL, REFINE_MODEL,
)

# Window geometry, in seconds. STEP < WINDOW gives us the overlap.
#
# Measured on this hardware (base model, whisper pads every input to its
# internal 30s frame):
#     10s window -> 3.61s   15s -> 4.48s   20s -> 5.03s   30s -> 30.30s
# The cliff at 30s is Whisper's frame boundary: crossing it costs a second
# decode pass. 20s sits just under it and gives ~3.6x headroom against the
# 18s step, which is the margin that keeps us ahead of a live meeting.
WINDOW  = 20.0
OVERLAP = 2.0
STEP    = WINDOW - OVERLAP

SESSIONS = {}
_LOCK = threading.Lock()

SESSION_DIR = "uploads/sessions"
os.makedirs(SESSION_DIR, exist_ok=True)


def create_session(hint_speakers=None):
    sid = str(uuid.uuid4())
    with _LOCK:
        SESSIONS[sid] = {
            "id": sid,
            "created": time.time(),
            "status": "recording",      # recording | finalizing | done | error
            "segments": [],             # absolute-timestamped, speaker filled in at finalize
            "features": [],             # [(segment_index, vector)]
            "chunk_count": 0,
            "audio_seconds": 0.0,
            "next_offset": 0.0,         # absolute start of the next window
            "covered_until": 0.0,       # absolute time already emitted
            "hint_speakers": hint_speakers,
            "full_text": "",
            "tagging": None,
            "error": None,
            "refine": {"status": "idle", "progress": 0},
            "chunk_paths": [],
            "busy": False,
            "lag": 0.0,                 # processing time / audio time for last chunk
        }
    return sid


def get_session(sid):
    return SESSIONS.get(sid)


def delete_session(sid):
    with _LOCK:
        s = SESSIONS.pop(sid, None)
    if s:
        for p in s.get("chunk_paths", []):
            try:
                os.remove(p)
            except Exception:
                pass


def _public(s):
    """Trimmed view safe to serialise to the client."""
    return {
        "session_id":    s["id"],
        "status":        s["status"],
        "segments":      s["segments"],
        "full_text":     s["full_text"],
        "chunk_count":   s["chunk_count"],
        "audio_seconds": round(s["audio_seconds"], 1),
        "num_speakers":  len({x.get("speaker") for x in s["segments"] if x.get("speaker")}) or 1,
        "tagging":       s["tagging"],
        "refine":        s["refine"],
        "lag":           round(s["lag"], 2),
        "error":         s["error"],
    }


def process_chunk(sid, file_path, is_first=False, offset=None):
    """
    Transcribe one audio window and fold it into the session.

    `offset` is the absolute time (s) at which this window starts, supplied by
    the recorder. The client is the only reliable source for this: Whisper trims
    trailing silence, so inferring position from transcribed length drifts
    backwards a little more with every window.

    Segments landing in territory already covered are dropped, since the
    previous window (which overlaps this one) already emitted them.
    """
    s = get_session(sid)
    if not s:
        raise KeyError("session not found")

    started = time.time()
    s["busy"] = True

    try:
        if offset is not None:
            window_start = max(0.0, float(offset))
        elif is_first:
            window_start = 0.0
        else:
            # Fallback only — assumes windows arrive back to back.
            window_start = max(0.0, s["chunk_count"] * STEP)

        model = get_model(LIVE_MODEL)
        result = model.transcribe(
            file_path,
            verbose=False,
            fp16=False,
            task="transcribe",
            # Feed the tail of what we already have so the model keeps context
            # across the window boundary.
            initial_prompt=s["full_text"][-220:] or None,
            condition_on_previous_text=False,
        )

        raw = result.get("segments", []) or []
        window_len = max((seg["end"] for seg in raw), default=0.0)

        # Everything up to here has already been emitted by earlier windows.
        cutoff = s["covered_until"]

        new_segments = []
        for seg in raw:
            abs_start = round(window_start + seg["start"], 2)
            abs_end   = round(window_start + seg["end"], 2)
            text = (seg.get("text") or "").strip()
            if not text:
                continue
            # Skip anything sitting inside the overlap the previous window
            # already covered. Midpoint test tolerates slightly shifted
            # segment boundaries between the two passes.
            midpoint = (abs_start + abs_end) / 2
            if midpoint <= cutoff:
                continue
            new_segments.append({
                "start": abs_start,
                "end": abs_end,
                "text": text,
                "speaker": "Speaker 1",   # provisional until finalize()
            })

        # Speaker features for the new segments — the expensive part, done now
        # rather than at the end.
        try:
            from models.diarization import load_window, extract_features_for_window
            wav, sr = load_window(file_path)
            if wav is not None and new_segments:
                base_index = len(s["segments"])
                for local_i, vec in extract_features_for_window(
                    wav, sr, new_segments, window_offset=window_start
                ):
                    s["features"].append((base_index + local_i, vec))
        except Exception as e:
            print(f"[Recalla] live feature extraction skipped: {e}")

        s["segments"].extend(new_segments)
        if new_segments:
            s["full_text"] = (s["full_text"] + " " + " ".join(x["text"] for x in new_segments)).strip()

        s["chunk_count"]   += 1
        s["audio_seconds"]  = max(s["audio_seconds"], window_start + window_len)
        # Track coverage in absolute time so the next window knows what to skip.
        if new_segments:
            s["covered_until"] = max(s["covered_until"], new_segments[-1]["end"])
        s["covered_until"] = max(s["covered_until"], window_start + window_len - OVERLAP)
        s["next_offset"]    = window_start + window_len

        elapsed = time.time() - started
        s["lag"] = elapsed / max(window_len, 0.1)

        # Keep the window on disk so the refinement pass can reuse it.
        s["chunk_paths"].append(file_path)

        return _public(s), new_segments

    finally:
        s["busy"] = False


def finalize_session(sid, do_tagging=True):
    """Global speaker clustering + tagging. This is the only post-stop work."""
    s = get_session(sid)
    if not s:
        raise KeyError("session not found")

    s["status"] = "finalizing"
    try:
        # Global clustering over every feature gathered during recording.
        if s["features"]:
            from models.diarization import cluster_speakers
            mapping = cluster_speakers(s["features"], hint_speakers=s["hint_speakers"])

            keyed = sorted(mapping.keys())
            for i, seg in enumerate(s["segments"]):
                if i in mapping:
                    seg["speaker"] = mapping[i]
                elif keyed:
                    nearest = min(keyed, key=lambda k: abs(k - i))
                    seg["speaker"] = mapping[nearest]

        if do_tagging and s["full_text"]:
            from models.tagging import extract_tags_and_entities
            s["tagging"] = extract_tags_and_entities(s["full_text"])

        s["status"] = "done"
        return _public(s)

    except Exception as e:
        traceback.print_exc()
        s["status"] = "error"
        s["error"] = str(e)
        return _public(s)


# ── Optional refinement pass ─────────────────────────────────────────────────

def start_refine(sid):
    """Re-transcribe the whole recording with SMALL, in the background."""
    s = get_session(sid)
    if not s:
        raise KeyError("session not found")
    if s["refine"]["status"] in ("running", "done"):
        return s["refine"]

    s["refine"] = {"status": "running", "progress": 0}
    threading.Thread(target=_refine_worker, args=(sid,), daemon=True).start()
    return s["refine"]


def _refine_worker(sid):
    s = get_session(sid)
    if not s:
        return
    merged = None
    try:
        paths = [p for p in s["chunk_paths"] if os.path.exists(p)]
        if not paths:
            s["refine"] = {"status": "error", "progress": 0, "error": "audio no longer available"}
            return

        merged = _concat_windows(paths, sid)
        if not merged:
            s["refine"] = {"status": "error", "progress": 0, "error": "could not assemble audio"}
            return

        # Only ~4GB free on this machine — drop the live model before loading
        # the bigger one, then restore it for the next recording.
        free_model(LIVE_MODEL)
        s["refine"]["progress"] = 15

        model = get_model(REFINE_MODEL)
        s["refine"]["progress"] = 30

        result = model.transcribe(merged, verbose=False, fp16=False, task="transcribe")
        s["refine"]["progress"] = 80

        refined = []
        for seg in result.get("segments", []):
            text = (seg.get("text") or "").strip()
            if text:
                refined.append({
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": text,
                    "speaker": "Speaker 1",
                })

        if refined:
            # Reuse the speaker timeline we already computed: assign each refined
            # segment the speaker of the live segment it overlaps most.
            for seg in refined:
                seg["speaker"] = _speaker_at(s["segments"], seg["start"], seg["end"])
            s["segments"]  = refined
            s["full_text"] = " ".join(x["text"] for x in refined).strip()

            try:
                from models.tagging import extract_tags_and_entities
                s["tagging"] = extract_tags_and_entities(s["full_text"])
            except Exception:
                pass

        s["refine"] = {"status": "done", "progress": 100, "model": REFINE_MODEL}

    except Exception as e:
        traceback.print_exc()
        s["refine"] = {"status": "error", "progress": 0, "error": str(e)}
    finally:
        free_model(REFINE_MODEL)
        if merged:
            try:
                os.remove(merged)
            except Exception:
                pass
        # The window files existed only for this pass. Holding them for the
        # full stale-session timeout would leak ~130MB per recorded hour.
        for p in s.get("chunk_paths", []):
            try:
                os.remove(p)
            except Exception:
                pass
        s["chunk_paths"] = []


def _speaker_at(live_segments, start, end):
    """Speaker of the live segment overlapping [start, end] the most."""
    best, best_ov = "Speaker 1", 0.0
    for seg in live_segments:
        ov = min(end, seg["end"]) - max(start, seg["start"])
        if ov > best_ov:
            best_ov, best = ov, seg.get("speaker", "Speaker 1")
    return best


def _concat_windows(paths, sid):
    """
    Rebuild continuous audio from the recorded windows.

    Windows overlap by OVERLAP seconds, so each one after the first is trimmed
    at the front before concatenation.
    """
    import subprocess
    list_path = os.path.join(SESSION_DIR, f"{sid}_concat.txt")
    out_path  = os.path.join(SESSION_DIR, f"{sid}_full.wav")
    trimmed   = []

    try:
        for i, p in enumerate(paths):
            t = os.path.join(SESSION_DIR, f"{sid}_t{i}.wav")
            cmd = ["ffmpeg", "-y", "-i", p]
            if i > 0:
                cmd += ["-ss", str(OVERLAP)]
            cmd += ["-ar", "16000", "-ac", "1", "-loglevel", "error", t]
            subprocess.run(cmd, check=True, capture_output=True)
            trimmed.append(t)

        with open(list_path, "w") as f:
            for t in trimmed:
                f.write(f"file '{os.path.abspath(t)}'\n")

        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
             "-ar", "16000", "-ac", "1", "-loglevel", "error", out_path],
            check=True, capture_output=True,
        )
        return out_path

    except Exception as e:
        print(f"[Recalla] window concat failed: {e}")
        return None
    finally:
        for t in trimmed:
            try: os.remove(t)
            except Exception: pass
        try: os.remove(list_path)
        except Exception: pass


def cleanup_stale(max_age_seconds=6 * 3600):
    """Drop sessions the client abandoned, plus any orphaned window files."""
    now = time.time()
    for sid in [k for k, v in SESSIONS.items() if now - v["created"] > max_age_seconds]:
        delete_session(sid)

    # Files can outlive their session if the backend restarted mid-recording.
    live_ids = set(SESSIONS.keys())
    try:
        for name in os.listdir(SESSION_DIR):
            path = os.path.join(SESSION_DIR, name)
            if name.split("_")[0] in live_ids:
                continue
            try:
                if now - os.path.getmtime(path) > max_age_seconds:
                    os.remove(path)
            except OSError:
                pass
    except OSError:
        pass
