// ============================================================
// FILE PATH:  recalla-mobile/whisper.js
// PURPOSE:    On-device speech-to-text with whisper.cpp.
// ============================================================

/**
 * Transcription that never leaves the phone.
 *
 * Audio is the most sensitive thing Recalla touches — a recording of a
 * private meeting. Running the model here means the recording is never
 * uploaded; only the finished text is, which is also why the server can be
 * a 1 GB instance instead of one carrying 2 GB of ML libraries.
 *
 * base.en is the model: 150 MB, and in the benchmark on comparable hardware
 * it beat the 630 MB Parakeet build on accuracy. ggml is swappable, so
 * moving to another model later is a URL change, not a rewrite.
 */

import * as FileSystem from "expo-file-system";

/**
 * whisper.rn is a native module, so it does not exist inside Expo Go — only
 * in a development or production build. Importing it at module load would
 * crash the app on launch there, taking the whole UI with it for the sake of
 * one feature. Resolve it lazily instead, and let callers ask whether
 * on-device speech is available.
 */
let _initWhisper = null;

export function nativeSpeechAvailable() {
  if (_initWhisper) return true;
  try {
    _initWhisper = require("whisper.rn").initWhisper;
    return Boolean(_initWhisper);
  } catch {
    return false;
  }
}

const MODEL_NAME = "ggml-base.en-q5_1.bin";
const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin";

// q5_1 rather than the f16 build: 60 MB instead of 150 MB, for a fraction of
// a point of accuracy. On a phone, download size and memory both matter more.
const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_PATH = `${MODEL_DIR}${MODEL_NAME}`;

let _ctx = null;
let _state = { downloaded: false, loaded: false, error: null };

export function modelState() {
  return { ..._state, model: MODEL_NAME };
}

async function ensureDownloaded(onProgress) {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  // A partial file from a killed download would load as corrupt, so require
  // a plausible size rather than mere existence.
  if (info.exists && info.size > 20 * 1024 * 1024) {
    _state.downloaded = true;
    return MODEL_PATH;
  }

  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true }).catch(() => {});

  const task = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (onProgress && totalBytesExpectedToWrite > 0) {
        onProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
      }
    }
  );

  const res = await task.downloadAsync();
  if (!res?.uri) throw new Error("Download failed");
  _state.downloaded = true;
  return MODEL_PATH;
}

/** Download (once) and load the model. Safe to call repeatedly. */
export async function prepareModel(onProgress) {
  if (_ctx) return _ctx;
  try {
    if (!nativeSpeechAvailable()) {
      throw new Error(
        "On-device transcription needs the full Recalla app. Expo Go cannot " +
        "load the speech model."
      );
    }
    const path = await ensureDownloaded(onProgress);
    _ctx = await _initWhisper({ filePath: path });
    _state.loaded = true;
    _state.error = null;
    return _ctx;
  } catch (e) {
    _state.error = String(e.message || e);
    throw e;
  }
}

/**
 * Transcribe a base64 WAV clip.
 *
 * Returns the same shape the backend's /api/data/meetings endpoint already
 * accepts — { text, segments:[{start,end,text}] } — so the web app posts the
 * result unchanged and no server code has to know where it came from.
 */
export async function transcribe(base64Wav) {
  const ctx = await prepareModel();

  const tmp = `${FileSystem.cacheDirectory}clip-${Date.now()}.wav`;
  await FileSystem.writeAsStringAsync(tmp, base64Wav, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const started = Date.now();
  try {
    const { promise } = ctx.transcribe(tmp, {
      language: "en",
      // Phones are thermally limited; more threads than cores makes it
      // slower, not faster, and drains the battery doing it.
      maxThreads: 4,
      translate: false,
    });
    const { result, segments } = await promise;

    return {
      text: (result || "").trim(),
      segments: (segments || []).map((s) => ({
        start: s.t0 / 100,          // whisper.cpp reports centiseconds
        end: s.t1 / 100,
        text: (s.text || "").trim(),
      })),
      durationMs: Date.now() - started,
      onDevice: true,
    };
  } finally {
    // The clip is the sensitive part. Delete it as soon as it is text.
    FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
  }
}
