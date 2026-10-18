// ============================================================
// FILE PATH:  recalla/src/diarize.js
// PURPOSE:    Tell speakers apart, in the browser.
// ============================================================

/**
 * Speaker diarization without a server.
 *
 * This used to run on the backend with librosa and scikit-learn. Audio no
 * longer goes there, so the same idea is reimplemented here: describe each
 * spoken segment by the timbre of the voice, then group segments whose
 * voices resemble each other.
 *
 * The description is MFCCs — a compact summary of the shape of the vocal
 * tract, which differs between people far more than it does between two
 * sentences from the same person. Mean and standard deviation across the
 * segment's frames give a fixed-length vector regardless of how long the
 * segment is.
 *
 * This is a heuristic, not a trained speaker model: it separates two clearly
 * different voices well, and struggles with similar voices, crosstalk, or
 * someone who changes how they are speaking. The server version had exactly
 * the same limitation.
 */

const FFT_SIZE = 512;
const HOP = 160;          // 10 ms at 16 kHz
const WIN = 400;          // 25 ms
const N_MEL = 26;
const N_MFCC = 13;

// ── FFT ─────────────────────────────────────────────────────────────────────

/** In-place iterative radix-2 Cooley–Tukey. Returns magnitudes. */
function fftMagnitude(re) {
  const n = re.length;
  const im = new Float32Array(n);

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }

  const half = n / 2 + 1;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

// ── Mel filterbank ──────────────────────────────────────────────────────────

const hzToMel = (f) => 2595 * Math.log10(1 + f / 700);
const melToHz = (m) => 700 * (10 ** (m / 2595) - 1);

function melFilterbank(sr) {
  const bins = FFT_SIZE / 2 + 1;
  const low = hzToMel(20), high = hzToMel(sr / 2);
  const points = Array.from({ length: N_MEL + 2 }, (_, i) =>
    Math.floor(((FFT_SIZE + 1) * melToHz(low + ((high - low) * i) / (N_MEL + 1))) / sr)
  );

  const fb = [];
  for (let m = 1; m <= N_MEL; m++) {
    const f = new Float32Array(bins);
    for (let k = points[m - 1]; k < points[m]; k++) {
      f[k] = (k - points[m - 1]) / (points[m] - points[m - 1] || 1);
    }
    for (let k = points[m]; k < points[m + 1]; k++) {
      f[k] = (points[m + 1] - k) / (points[m + 1] - points[m] || 1);
    }
    fb.push(f);
  }
  return fb;
}

let _fb = null;
const filterbank = (sr) => (_fb ||= melFilterbank(sr));

// ── MFCC ────────────────────────────────────────────────────────────────────

/**
 * Describe one stretch of audio as a fixed-length vector.
 *
 * Mean and standard deviation of each coefficient: the mean captures the
 * average timbre of the voice, the deviation how much it moves. Both differ
 * between people, and neither depends on how long they spoke.
 */
export function voiceFingerprint(pcm, sr = 16000) {
  if (!pcm || pcm.length < WIN) return null;

  const fb = filterbank(sr);
  const frames = [];

  for (let start = 0; start + WIN <= pcm.length; start += HOP) {
    const buf = new Float32Array(FFT_SIZE);
    for (let i = 0; i < WIN; i++) {
      // Hamming window, and pre-emphasis to lift the higher formants that
      // carry most of the speaker-specific information.
      const s = pcm[start + i] - 0.97 * (pcm[start + i - 1] || 0);
      buf[i] = s * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (WIN - 1)));
    }

    const mag = fftMagnitude(buf);
    const energies = fb.map((f) => {
      let e = 0;
      for (let k = 0; k < f.length; k++) e += f[k] * mag[k] * mag[k];
      return Math.log(e + 1e-10);
    });

    // DCT-II → cepstral coefficients. Coefficient 0 is loudness, which says
    // more about microphone distance than about who is talking, so it is
    // dropped.
    const c = new Float32Array(N_MFCC);
    for (let i = 1; i <= N_MFCC; i++) {
      let sum = 0;
      for (let m = 0; m < N_MEL; m++) {
        sum += energies[m] * Math.cos((Math.PI * i * (m + 0.5)) / N_MEL);
      }
      c[i - 1] = sum;
    }
    frames.push(c);
  }

  if (frames.length < 3) return null;

  const out = new Float32Array(N_MFCC * 2);
  for (let i = 0; i < N_MFCC; i++) {
    let mean = 0;
    for (const f of frames) mean += f[i];
    mean /= frames.length;
    let variance = 0;
    for (const f of frames) variance += (f[i] - mean) ** 2;
    out[i] = mean;
    out[N_MFCC + i] = Math.sqrt(variance / frames.length);
  }
  return Array.from(out);
}

// ── Clustering ──────────────────────────────────────────────────────────────

function zscore(vectors) {
  const d = vectors[0].length;
  const mean = new Array(d).fill(0);
  const sd = new Array(d).fill(0);
  for (const v of vectors) for (let i = 0; i < d; i++) mean[i] += v[i] / vectors.length;
  for (const v of vectors) for (let i = 0; i < d; i++) sd[i] += (v[i] - mean[i]) ** 2 / vectors.length;
  // Without this, the coefficients with the largest raw range dominate the
  // distance and the smaller ones contribute nothing.
  return vectors.map((v) => v.map((x, i) => (x - mean[i]) / (Math.sqrt(sd[i]) || 1)));
}

const dist = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
};

/** Agglomerative clustering, average linkage. */
function agglomerate(vectors, k) {
  let clusters = vectors.map((_, i) => [i]);

  while (clusters.length > k) {
    let best = Infinity, bi = 0, bj = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let sum = 0, n = 0;
        for (const a of clusters[i]) for (const b of clusters[j]) { sum += dist(vectors[a], vectors[b]); n++; }
        const d = sum / n;
        if (d < best) { best = d; bi = i; bj = j; }
      }
    }
    clusters[bi] = clusters[bi].concat(clusters[bj]);
    clusters.splice(bj, 1);
  }

  const labels = new Array(vectors.length).fill(0);
  clusters.forEach((c, idx) => c.forEach((i) => { labels[i] = idx; }));
  return labels;
}

/** Mean silhouette: how much better each point fits its own cluster. */
function silhouette(vectors, labels) {
  const k = Math.max(...labels) + 1;
  if (k < 2) return -1;

  let total = 0;
  for (let i = 0; i < vectors.length; i++) {
    const same = [], other = new Map();
    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      const d = dist(vectors[i], vectors[j]);
      if (labels[j] === labels[i]) same.push(d);
      else {
        if (!other.has(labels[j])) other.set(labels[j], []);
        other.get(labels[j]).push(d);
      }
    }
    if (!same.length || !other.size) continue;
    const a = same.reduce((x, y) => x + y, 0) / same.length;
    const b = Math.min(...[...other.values()].map((ds) => ds.reduce((x, y) => x + y, 0) / ds.length));
    total += (b - a) / Math.max(a, b);
  }
  return total / vectors.length;
}

/**
 * Label each segment with a speaker.
 *
 * `hint` is the number of participants the user listed. When given it is
 * trusted, because a person who says there were two people in the room is
 * better evidence than a clustering score computed from 36 seconds of audio.
 */
export function assignSpeakers(segments, hint = null, maxSpeakers = 4) {
  const usable = segments
    .map((s, i) => ({ i, f: s.features }))
    .filter((x) => Array.isArray(x.f) && x.f.length);

  // Too little to tell voices apart; one speaker is the honest answer.
  if (usable.length < 2) return segments.map((s) => ({ ...s, speaker: "Speaker 1" }));

  const vectors = zscore(usable.map((x) => x.f));

  let best = null;
  const upper = Math.min(maxSpeakers, usable.length);
  const candidates = hint ? [Math.min(hint, upper)] : Array.from({ length: upper - 1 }, (_, i) => i + 2);

  for (const k of candidates) {
    if (k < 2) continue;
    const labels = agglomerate(vectors, k);
    const score = hint ? 1 : silhouette(vectors, labels);
    if (!best || score > best.score) best = { labels, score, k };
  }

  // A weak best split means the voices are not actually distinguishable;
  // inventing speakers would be worse than admitting one.
  if (!best || (!hint && best.score < 0.12)) {
    return segments.map((s) => ({ ...s, speaker: "Speaker 1" }));
  }

  // Number speakers in the order they first talk, so "Speaker 1" is whoever
  // opened the meeting rather than an arbitrary cluster index.
  const order = new Map();
  usable.forEach((x, idx) => {
    const l = best.labels[idx];
    if (!order.has(l)) order.set(l, order.size + 1);
  });

  const byIndex = new Map();
  usable.forEach((x, idx) => byIndex.set(x.i, order.get(best.labels[idx])));

  let last = 1;
  return segments.map((s, i) => {
    const n = byIndex.get(i) ?? last;
    last = n;
    const { features, ...rest } = s;
    return { ...rest, speaker: `Speaker ${n}` };
  });
}
