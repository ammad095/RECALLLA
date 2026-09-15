// ============================================================
// FILE PATH:  recalla/src/liveRecorder.js
// PURPOSE:    Taps a MediaStream and emits fixed, slightly overlapping
//             WAV windows while recording, so the backend can transcribe
//             in step with the meeting instead of after it.
//
// NOTES:      The AudioContext is opened at 16 kHz, which is what Whisper
//             wants, so the browser does the resampling for us.
//             Capture runs in an AudioWorklet (off the main thread) with a
//             ScriptProcessor fallback for older browsers.
// ============================================================

const TARGET_SR = 16000;

// Worklet is injected as a blob so there's no extra asset to serve.
const WORKLET_SRC = `
class TapProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch && ch.length) this.port.postMessage(new Float32Array(ch));
    return true;
  }
}
registerProcessor('recalla-tap', TapProcessor);
`;

/** Encode mono Float32 samples as a 16-bit PCM WAV blob. */
export function encodeWav(samples, sampleRate = TARGET_SR) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);         // PCM chunk size
  v.setUint16(20, 1, true);          // format = PCM
  v.setUint16(22, 1, true);          // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);          // block align
  v.setUint16(34, 16, true);         // bits per sample
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);

  let o = 44;
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

/**
 * @param stream      MediaStream from getUserMedia
 * @param windowSec   window length (backend default 20)
 * @param stepSec     advance per window (backend default 18 → 2s overlap)
 * @param onWindow    async ({ blob, offset, isFirst, index }) => void
 *                    Awaited, so slow uploads apply natural backpressure.
 * @param onLevel     optional (rms 0..1) for a live meter
 */
export function createLiveRecorder({ stream, windowSec = 20, stepSec = 18, onWindow, onLevel }) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_SR });
  const sr = ctx.sampleRate;
  const winSamples  = Math.round(windowSec * sr);
  const stepSamples = Math.round(stepSec * sr);

  const source = ctx.createMediaStreamSource(stream);
  let node = null;

  // Rolling buffer of everything not yet retired.
  let buffer = new Float32Array(0);
  let bufferStart = 0;      // absolute sample index of buffer[0]
  let totalSamples = 0;     // absolute samples captured
  let nextWindowStart = 0;  // absolute sample index of the next window
  let index = 0;
  let stopped = false;

  // Serialise uploads: one in flight, the rest queued.
  const queue = [];
  let draining = false;
  let pending = 0;

  const drain = async () => {
    if (draining) return;
    draining = true;
    while (queue.length) {
      const job = queue.shift();
      pending = queue.length;
      try { await onWindow(job); } catch (e) { console.error("[live] window failed", e); }
    }
    pending = 0;
    draining = false;
  };

  const emit = (startAbs, endAbs, isFirst) => {
    const from = startAbs - bufferStart;
    const to   = endAbs   - bufferStart;
    if (from < 0 || to > buffer.length) return;
    queue.push({
      blob: encodeWav(buffer.slice(from, to), sr),
      offset: startAbs / sr,
      isFirst,
      index: index++,
    });
    drain();
  };

  const onSamples = (chunk) => {
    if (stopped) return;

    if (onLevel) {
      let sum = 0;
      for (let i = 0; i < chunk.length; i += 8) sum += chunk[i] * chunk[i];
      onLevel(Math.min(1, Math.sqrt(sum / (chunk.length / 8)) * 4));
    }

    const merged = new Float32Array(buffer.length + chunk.length);
    merged.set(buffer, 0);
    merged.set(chunk, buffer.length);
    buffer = merged;
    totalSamples += chunk.length;

    // Emit every window whose audio has fully arrived.
    while (totalSamples >= nextWindowStart + winSamples) {
      emit(nextWindowStart, nextWindowStart + winSamples, index === 0);
      nextWindowStart += stepSamples;
    }

    // Retire audio no future window can need.
    if (nextWindowStart > bufferStart) {
      const drop = nextWindowStart - bufferStart;
      if (drop > 0 && drop <= buffer.length) {
        buffer = buffer.slice(drop);
        bufferStart += drop;
      }
    }
  };

  const setup = async () => {
    try {
      const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      node = new AudioWorkletNode(ctx, "recalla-tap");
      node.port.onmessage = (e) => onSamples(e.data);
      source.connect(node);
      // Worklets need a sink to be pulled; a muted gain keeps it silent.
      const sink = ctx.createGain();
      sink.gain.value = 0;
      node.connect(sink).connect(ctx.destination);
    } catch {
      // Fallback for browsers without AudioWorklet.
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (e) => onSamples(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      const sink = ctx.createGain();
      sink.gain.value = 0;
      node.connect(sink).connect(ctx.destination);
    }
  };

  const stop = async () => {
    if (stopped) return;
    stopped = true;

    // Flush the tail so the last words are not lost.
    const tailStart = nextWindowStart;
    if (totalSamples > tailStart + sr * 0.5) {
      emit(tailStart, totalSamples, index === 0);
    }

    try { source.disconnect(); } catch { /* already gone */ }
    try { node && node.disconnect(); } catch { /* already gone */ }

    // Let queued uploads finish before the caller finalises.
    while (draining || queue.length) await new Promise((r) => setTimeout(r, 120));
    try { await ctx.close(); } catch { /* already closed */ }
  };

  return {
    start: setup,
    stop,
    get pendingWindows() { return pending; },
    get seconds() { return totalSamples / sr; },
  };
}
