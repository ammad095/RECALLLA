#!/usr/bin/env python3
"""
Compare speech-to-text models on this machine, on this CPU.

Published leaderboards are measured on datacentre GPUs. Recalla runs on a
laptop with no GPU, where the ranking can invert entirely — a model that is
more accurate but five times slower is the wrong choice for live
transcription, and the only way to know is to measure here.

Reports word error rate against known transcripts, and real-time factor:
RTF 0.5 means a 60-second recording takes 30 seconds to transcribe. Anything
above 1.0 cannot keep up with a live meeting.

    ./venv/bin/python scripts/benchmark_asr.py              # default 8 clips
    ./venv/bin/python scripts/benchmark_asr.py --samples 20
    ./venv/bin/python scripts/benchmark_asr.py --only whisper-base,nemotron
"""

import argparse
import gc
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NEMOTRON_ID = "nvidia/nemotron-3.5-asr-streaming-0.6b"


def log(msg):
    print(msg, flush=True)


def load_samples(n):
    """
    LibriSpeech test-clean clips, which ship with reference transcripts.

    Audio is decoded with soundfile rather than letting `datasets` do it —
    recent versions delegate to torchcodec, which is a large dependency to
    add for reading a handful of flac files.
    """
    import io

    import numpy as np
    import soundfile as sf
    from datasets import Audio, load_dataset

    log(f"Loading {n} LibriSpeech test-clean clips…")
    ds = load_dataset("hf-internal-testing/librispeech_asr_dummy",
                      "clean", split="validation")
    ds = ds.cast_column("audio", Audio(decode=False))

    rows = []
    for i, r in enumerate(ds):
        if i >= n:
            break
        a = r["audio"]
        raw = a.get("bytes")
        data, sr = sf.read(io.BytesIO(raw) if raw else a["path"], dtype="float32")
        if data.ndim > 1:
            data = data.mean(axis=1)
        rows.append({"audio": np.asarray(data, dtype=np.float32),
                     "sr": sr, "text": r["text"]})
    secs = sum(len(r["audio"]) / r["sr"] for r in rows)
    log(f"  {len(rows)} clips, {secs:.1f}s of audio\n")
    return rows, secs


# The reference transcripts write "MISTER QUILTER"; every modern model
# outputs "Mr. Quilter". Naive normalisation scores that as an error and
# inflates every WER by several points. Whisper ships the normaliser the
# published leaderboards use — expanding abbreviations, numbers and
# contractions — so use it and compare against the same yardstick.
_NORM = None


def normalise(s):
    global _NORM
    if _NORM is None:
        try:
            from whisper.normalizers import EnglishTextNormalizer
            _NORM = EnglishTextNormalizer()
        except Exception:
            import re
            _NORM = lambda x: " ".join(re.sub(r"[^a-z0-9' ]", " ", x.lower()).split())
    return _NORM(s)


def run_whisper(name, rows):
    import whisper
    import numpy as np

    log(f"[whisper-{name}] loading…")
    t = time.time()
    model = whisper.load_model(name)
    load_s = time.time() - t
    log(f"[whisper-{name}] loaded in {load_s:.1f}s, transcribing…")

    out, t0 = [], time.time()
    for i, r in enumerate(rows):
        audio = np.asarray(r["audio"], dtype=np.float32)
        res = model.transcribe(audio, language="en", fp16=False, verbose=False)
        out.append(res["text"])
        log(f"   {i+1}/{len(rows)}")
    elapsed = time.time() - t0

    del model
    gc.collect()
    return out, elapsed, load_s


def run_nemotron(rows):
    import numpy as np
    import torch
    from transformers import AutoModel, AutoProcessor

    log("[nemotron] loading…")
    t = time.time()
    proc = AutoProcessor.from_pretrained(NEMOTRON_ID, trust_remote_code=True)
    model = AutoModel.from_pretrained(NEMOTRON_ID, trust_remote_code=True)
    model.eval()

    # Streaming models trade accuracy for latency. supported values are
    # [3, 0, 6, 13]; 13 is the most accurate, and a fair comparison should
    # give the model its best setting rather than the low-latency default.
    try:
        model.config.encoder_config.default_num_lookahead_tokens = 13
    except Exception:
        pass
    load_s = time.time() - t
    log(f"[nemotron] loaded in {load_s:.1f}s, transcribing…")

    out, t0 = [], time.time()
    for i, r in enumerate(rows):
        audio = np.asarray(r["audio"], dtype=np.float32)
        inputs = proc(audio, sampling_rate=r["sr"], return_tensors="pt")
        with torch.no_grad():
            # generate() returns a NemotronAsrStreamingGenerateOutput, not a
            # bare tensor — the token ids are on .sequences.
            gen = model.generate(**inputs, max_new_tokens=448)
        seqs = getattr(gen, "sequences", gen)
        text = proc.batch_decode(seqs, skip_special_tokens=True)[0]
        out.append(text)
        log(f"   {i+1}/{len(rows)}")
    elapsed = time.time() - t0

    del model
    gc.collect()
    return out, elapsed, load_s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--only", default="whisper-base,whisper-small,nemotron")
    args = ap.parse_args()

    wanted = [x.strip() for x in args.only.split(",") if x.strip()]
    rows, audio_secs = load_samples(args.samples)
    refs = [normalise(r["text"]) for r in rows]

    import jiwer

    results = []
    for key in wanted:
        try:
            if key.startswith("whisper-"):
                hyps, elapsed, load_s = run_whisper(key.split("-", 1)[1], rows)
            elif key == "nemotron":
                hyps, elapsed, load_s = run_nemotron(rows)
            else:
                log(f"unknown model: {key}")
                continue
        except Exception as e:
            import traceback
            traceback.print_exc()
            results.append({"model": key, "error": f"{type(e).__name__}: {e}"[:70]})
            continue

        hyps = [normalise(h) for h in hyps]
        wer = jiwer.wer(refs, hyps) * 100
        results.append({
            "model": key, "wer": wer, "secs": elapsed,
            "rtf": elapsed / audio_secs, "load": load_s,
            "sample": hyps[0][:70] if hyps else "",
        })
        log("")

    log("\n" + "=" * 74)
    log(f"{len(rows)} clips · {audio_secs:.0f}s audio · CPU only")
    log("=" * 74)
    log(f"{'model':16}{'WER':>8}{'time':>9}{'RTF':>8}{'load':>8}   verdict")
    log("-" * 74)
    for r in sorted(results, key=lambda x: x.get("wer", 999)):
        if "error" in r:
            log(f"{r['model']:16}{'FAILED':>8}   {r['error']}")
            continue
        verdict = "live-capable" if r["rtf"] < 0.5 else (
                  "keeps up" if r["rtf"] < 1.0 else "too slow for live")
        log(f"{r['model']:16}{r['wer']:>7.1f}%{r['secs']:>8.1f}s"
            f"{r['rtf']:>8.2f}{r['load']:>7.0f}s   {verdict}")
    log("")
    for r in results:
        if "sample" in r:
            log(f"  {r['model']:16} “{r['sample']}…”")
    log("")


if __name__ == "__main__":
    sys.exit(main() or 0)
