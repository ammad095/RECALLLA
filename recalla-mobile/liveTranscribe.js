// ============================================================
// FILE PATH:  recalla-mobile/liveTranscribe.js
// PURPOSE:    Transcribe while the meeting is still happening.
// ============================================================

/**
 * Chunked live transcription on the device.
 *
 * Recording a whole meeting and then transcribing it means a 20-minute
 * meeting ends with a progress bar. Instead the audio is cut into slices
 * while it is being captured and each slice is transcribed as it closes, so
 * by the time someone presses stop most of the transcript already exists.
 *
 * whisper.rn's RealtimeTranscriber does the hard parts — a ring buffer, voice
 * activity detection so silence is not transcribed, and carrying the previous
 * slice's text forward as a prompt so words are not mangled at boundaries.
 *
 * 25-second slices: long enough for Whisper to have context (accuracy drops
 * sharply on very short clips), short enough that the tail left running when
 * someone stops is measured in seconds.
 */

import { prepareModel, nativeSpeechAvailable } from "./whisper";

// Same reasoning as whisper.js: these are native modules, absent in Expo Go.
// Requiring them lazily keeps the app loadable there so everything other
// than recording can still be tested.
function nativeParts() {
  const { RealtimeTranscriber } = require("whisper.rn/src/realtime-transcription");
  const {
    AudioPcmStreamAdapter,
  } = require("whisper.rn/src/realtime-transcription/adapters/AudioPcmStreamAdapter");
  return { RealtimeTranscriber, AudioPcmStreamAdapter };
}

const SLICE_SEC = 25;

export class LiveTranscription {
  /**
   * @param {object} handlers
   *   onSegments(segments)  — fired each time a slice finishes
   *   onPartial(text)       — in-progress text for the current slice
   *   onPending(count)      — slices still being transcribed
   *   onError(err)
   */
  constructor(handlers = {}) {
    this.h = handlers;
    this.transcriber = null;
    this.startedAt = 0;
    this.pending = 0;
    // Slice timestamps are relative to the slice, so carry an offset to make
    // them absolute within the meeting.
    this.sliceOffsets = new Map();
  }

  async start() {
    if (!nativeSpeechAvailable()) {
      throw new Error(
        "Recording needs the full Recalla app — Expo Go cannot load the " +
        "speech model or the microphone stream."
      );
    }
    const { RealtimeTranscriber, AudioPcmStreamAdapter } = nativeParts();
    const ctx = await prepareModel();

    this.startedAt = Date.now();
    this.transcriber = new RealtimeTranscriber(
      { whisperContext: ctx, audioStream: new AudioPcmStreamAdapter() },
      {
        audioSliceSec: SLICE_SEC,
        audioMinSec: 1,
        // Three slices in memory is ~75s of PCM. More would buy nothing on a
        // phone and risks being killed for memory while in the background.
        maxSlicesInMemory: 3,
        promptPreviousSlices: true,
        transcribeOptions: { language: "en", maxThreads: 4, translate: false },
        audioStreamConfig: { sampleRate: 16000, channels: 1, bitsPerSample: 16 },
      },
      {
        onTranscribe: (event) => this._onSlice(event),
        onStatsUpdate: (s) => this.h.onPending?.(s?.slicesInProgress ?? this.pending),
        onError: (e) => this.h.onError?.(e),
      }
    );

    await this.transcriber.start();
    return this;
  }

  _onSlice(event) {
    try {
      const { sliceIndex, data, isCapturing } = event || {};
      const base = (sliceIndex ?? 0) * SLICE_SEC;

      const segs = (data?.segments || [])
        .map((s) => ({
          start: base + s.t0 / 100,       // whisper.cpp reports centiseconds
          end: base + s.t1 / 100,
          text: (s.text || "").trim(),
          speaker: null,                   // diarization happens server-side
        }))
        .filter((s) => s.text);

      // A slice still being captured produces provisional text; only commit
      // once it is final, or the transcript rewrites itself as you watch.
      if (isCapturing) {
        this.h.onPartial?.((data?.result || "").trim());
        return;
      }

      if (segs.length) this.h.onSegments?.(segs);
      this.h.onPartial?.("");
    } catch (e) {
      this.h.onError?.(e);
    }
  }

  /**
   * Stop capturing. Slices already queued keep transcribing — the caller is
   * expected to navigate away immediately and let them land.
   */
  async stop() {
    if (!this.transcriber) return { durationMs: 0 };
    const durationMs = Date.now() - this.startedAt;
    try {
      await this.transcriber.stop();
    } catch (e) {
      this.h.onError?.(e);
    }
    return { durationMs };
  }

  async release() {
    try { await this.transcriber?.release(); } catch { /* already gone */ }
    this.transcriber = null;
  }

  stats() {
    return this.transcriber?.getStatistics?.() ?? null;
  }
}
