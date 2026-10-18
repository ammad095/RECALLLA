// ============================================================
// FILE PATH:  recalla/src/localStt.js
// PURPOSE:    Record and transcribe in the browser, slice by slice.
// ============================================================

/**
 * Live transcription on the laptop, mirroring what the phone does.
 *
 * The microphone is captured through an AudioContext rather than
 * MediaRecorder, because Whisper needs raw 16 kHz mono PCM and MediaRecorder
 * produces compressed WebM/Opus that would have to be decoded back anyway.
 * Taking the samples directly skips an encode/decode round trip and keeps
 * the slice boundaries exact.
 *
 * Audio is cut every 25 seconds and each slice is handed to the worker as it
 * closes, so by the time someone stops recording nearly all of the
 * transcript already exists. Nothing is uploaded: the server has no speech
 * model and never receives the audio.
 */

const SAMPLE_RATE = 16000;
const SLICE_SEC = 25;

export function browserSttSupported() {
  return (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.AudioContext || window.webkitAudioContext)
  );
}

/**
 * Transcribe an uploaded audio file, in the browser.
 *
 * The file is decoded and resampled to the 16 kHz mono Whisper expects, then
 * fed through the same worker as live recording — so an upload and a
 * recording produce identical output and neither sends audio anywhere.
 *
 * Long files are split into slices like a live meeting, so a 40-minute
 * recording reports progress instead of appearing frozen.
 */
export async function transcribeFile(file, { onProgress, onSegments } = {}) {
  const Ctx = window.AudioContext || window.webkitAudioContext;

  // Decode at the file's own rate first; decodeAudioData refuses to resample
  // on the fly, and an OfflineAudioContext does the conversion properly.
  const raw = await file.arrayBuffer();
  const probe = new Ctx();
  const decoded = await probe.decodeAudioData(raw);
  probe.close();

  const offline = new OfflineAudioContext(
    1,
    Math.ceil((decoded.duration * SAMPLE_RATE)),
    SAMPLE_RATE
  );
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const resampled = await offline.startRendering();
  const pcm = resampled.getChannelData(0);

  const worker = new Worker(new URL("./workers/sttWorker.js", import.meta.url), {
    type: "module",
  });

  const perSlice = SAMPLE_RATE * SLICE_SEC;
  const sliceCount = Math.max(1, Math.ceil(pcm.length / perSlice));
  const all = [];

  try {
    for (let i = 0; i < sliceCount; i++) {
      const slice = pcm.slice(i * perSlice, (i + 1) * perSlice);
      const offset = i * SLICE_SEC;

      const segs = await new Promise((resolve, reject) => {
        const onMsg = (e) => {
          const m = e.data || {};
          if (m.type === "model-progress") onProgress?.({ stage: "model", pct: m.pct });
          if (m.type === "result") { worker.removeEventListener("message", onMsg); resolve(m.segments || []); }
          if (m.type === "error") { worker.removeEventListener("message", onMsg); reject(new Error(m.error)); }
        };
        worker.addEventListener("message", onMsg);
        worker.postMessage({ type: "transcribe", id: i, audio: slice, offset }, [slice.buffer]);
      });

      all.push(...segs);
      onSegments?.(segs);
      onProgress?.({
        stage: "transcribe",
        pct: Math.round(((i + 1) / sliceCount) * 100),
        done: i + 1,
        total: sliceCount,
      });
    }
  } finally {
    worker.terminate();
  }

  return { segments: all.sort((a, b) => a.start - b.start), durationMs: decoded.duration * 1000 };
}


export class BrowserTranscription {
  /**
   * @param {object} handlers
   *   onSegments(segments) — a finished slice
   *   onPending(count)     — slices still being transcribed
   *   onModelProgress(pct) — first-run model download
   *   onError(err)
   */
  constructor(handlers = {}) {
    this.h = handlers;
    this.worker = null;
    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.buffer = [];
    this.sliceIndex = 0;
    this.pending = 0;
    this.startedAt = 0;
  }

  /** Start the worker and let it fetch the model before recording begins. */
  preload() {
    this._ensureWorker();
    this.worker.postMessage({ type: "preload" });
  }

  _ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL("./workers/sttWorker.js", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === "model-progress") this.h.onModelProgress?.(m.pct);
      if (m.type === "model-ready") this.h.onModelProgress?.(100);
      if (m.type === "result") {
        this.pending = Math.max(0, this.pending - 1);
        this.h.onPending?.(this.pending);
        if (m.segments?.length) this.h.onSegments?.(m.segments);
      }
      if (m.type === "error") {
        this.pending = Math.max(0, this.pending - 1);
        this.h.onPending?.(this.pending);
        this.h.onError?.(new Error(m.error));
      }
    };
  }

  async start() {
    this._ensureWorker();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });

    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx({ sampleRate: SAMPLE_RATE });
    const source = this.ctx.createMediaStreamSource(this.stream);

    // ScriptProcessor is deprecated in favour of AudioWorklet, but it needs
    // no separate module file and is supported everywhere including iOS
    // Safari. The work it does here is a buffer copy, not DSP.
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    const perSlice = SAMPLE_RATE * SLICE_SEC;

    this.node.onaudioprocess = (ev) => {
      this.buffer.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
      const total = this.buffer.reduce((n, b) => n + b.length, 0);
      if (total >= perSlice) this._flush();
    };

    source.connect(this.node);
    // Routed to a muted gain node: ScriptProcessor only runs when connected
    // to a destination, but the user should not hear themselves.
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.node.connect(sink);
    sink.connect(this.ctx.destination);

    this.startedAt = Date.now();
    return this;
  }

  _flush() {
    if (!this.buffer.length) return;

    const total = this.buffer.reduce((n, b) => n + b.length, 0);
    const pcm = new Float32Array(total);
    let at = 0;
    for (const b of this.buffer) { pcm.set(b, at); at += b.length; }
    this.buffer = [];

    const offset = this.sliceIndex * SLICE_SEC;
    this.sliceIndex += 1;
    this.pending += 1;
    this.h.onPending?.(this.pending);

    // Transferred, not copied — a 25-second slice is 1.6 MB and cloning it
    // for every slice would show up as jank on a long meeting.
    this.worker.postMessage(
      { type: "transcribe", id: offset, audio: pcm, offset },
      [pcm.buffer]
    );
  }

  /**
   * Stop capturing and queue whatever is left. Slices already sent keep
   * running; the caller should show the transcript immediately rather than
   * waiting for them.
   */
  async stop() {
    const durationMs = Date.now() - this.startedAt;
    this._flush();

    try { this.node?.disconnect(); } catch { /* already gone */ }
    try { await this.ctx?.close(); } catch { /* already closed */ }
    this.stream?.getTracks().forEach((t) => t.stop());

    this.node = null;
    this.ctx = null;
    this.stream = null;
    return { durationMs, pending: this.pending };
  }

  /** Slices handed to the worker that have not come back yet. */
  pendingCount() {
    return this.pending;
  }

  release() {
    this.worker?.terminate();
    this.worker = null;
  }
}
