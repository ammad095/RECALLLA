// ============================================================
// FILE PATH:  recalla/src/workers/sttWorker.js
// PURPOSE:    Whisper in the browser, off the main thread.
// ============================================================

/**
 * Speech-to-text that never leaves the machine.
 *
 * The server carries no speech model — transcription belongs to whoever
 * recorded the audio. On a phone that is whisper.cpp through the native app;
 * in a browser it is this: Whisper compiled to WebAssembly, running in a
 * worker so a 25-second slice does not freeze the page while it decodes.
 *
 * The model is fetched from the Hugging Face CDN on first use and then lives
 * in the browser cache, so it is downloaded once per device rather than
 * shipped with the app.
 */

import { pipeline, env } from "@huggingface/transformers";
import { voiceFingerprint } from "../diarize";

// Only the remote CDN is used; there are no model files bundled with the app.
env.allowLocalModels = false;

const MODEL = "onnx-community/whisper-base.en";

let asr = null;
let loading = null;

async function getPipeline() {
  if (asr) return asr;
  if (!loading) {
    loading = pipeline("automatic-speech-recognition", MODEL, {
      // q8 keeps the download near 40 MB rather than 150 MB, which matters
      // when it is fetched over a phone connection the first time.
      dtype: "q8",
      // No explicit device: transformers.js picks WebGPU where the browser
      // supports it and falls back to WASM otherwise. Naming a backend here
      // meant an "Unsupported device" throw on anything that did not have
      // exactly that one, which is the kind of failure that looks like the
      // model is broken rather than the config.
      progress_callback: (p) => {
        if (p.status === "progress" && p.total) {
          self.postMessage({
            type: "model-progress",
            pct: Math.round((p.loaded / p.total) * 100),
          });
        }
      },
    }).then((p) => {
      asr = p;
      self.postMessage({ type: "model-ready" });
      return p;
    });
  }
  return loading;
}

self.onmessage = async (event) => {
  const { type, id, audio, offset = 0 } = event.data || {};

  if (type === "preload") {
    try { await getPipeline(); }
    catch (e) { self.postMessage({ type: "error", error: String(e?.message || e) }); }
    return;
  }

  if (type !== "transcribe") return;

  try {
    const pipe = await getPipeline();

    // audio arrives as Float32Array PCM at 16 kHz — the only format Whisper
    // accepts. Decoding happens on the main thread, which already has an
    // AudioContext for the microphone.
    const out = await pipe(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      // No `language` or `task`: base.en is an English-only checkpoint and
      // rejects both outright. They are only meaningful for the multilingual
      // models, which are several times larger.
    });

    // Speaker fingerprints are computed here because this is the only place
    // that has both the audio and the timestamps: the PCM is transferred to
    // this worker and detached from the page, and the timestamps only exist
    // once Whisper has run.
    const segments = (out.chunks || [])
      .map((c) => {
        const t0 = c.timestamp?.[0] ?? 0;
        const t1 = c.timestamp?.[1] ?? t0;
        const from = Math.max(0, Math.floor(t0 * 16000));
        const to = Math.min(audio.length, Math.ceil(t1 * 16000));
        return {
          start: offset + t0,
          end: offset + t1,
          text: (c.text || "").trim(),
          features: to - from > 4000 ? voiceFingerprint(audio.subarray(from, to)) : null,
        };
      })
      .filter((s) => s.text);

    // A slice with no timestamps still has text worth keeping.
    if (!segments.length && (out.text || "").trim()) {
      segments.push({
        start: offset, end: offset, text: out.text.trim(),
        features: voiceFingerprint(audio),
      });
    }

    self.postMessage({ type: "result", id, segments, text: (out.text || "").trim() });
  } catch (e) {
    self.postMessage({ type: "error", id, error: String(e?.message || e) });
  }
};
