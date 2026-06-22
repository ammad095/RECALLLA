"""
Lightweight speaker diarization — auto-detects speaker count.
Uses MFCC + pitch + spectral features with weighted importance.
"""

import os
import numpy as np
import subprocess
import tempfile


def _convert_to_wav(input_path):
    """Convert audio to 16kHz mono WAV via ffmpeg."""
    wav_path = tempfile.mktemp(suffix='.wav', prefix='recalla_diar_')
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', input_path,
             '-ar', '16000', '-ac', '1',
             '-loglevel', 'error', wav_path],
            check=True, capture_output=True
        )
        return wav_path
    except subprocess.CalledProcessError as e:
        print(f"[Recalla] ffmpeg conversion failed: {e.stderr.decode() if e.stderr else e}")
        return None
    except FileNotFoundError:
        print("[Recalla] ffmpeg not found in PATH")
        return None


def _extract_features(audio_segment, sr=16000):
    """Extract a feature vector. Pitch and spectral features are weighted
    higher than MFCC since they're more speaker-specific."""
    import librosa

    if len(audio_segment) < sr * 0.3:
        return None

    # MFCC (vocal tract — base features)
    mfcc = librosa.feature.mfcc(y=audio_segment, sr=sr, n_mfcc=13)
    delta = librosa.feature.delta(mfcc)

    # Spectral contrast (voice texture)
    try:
        contrast = librosa.feature.spectral_contrast(y=audio_segment, sr=sr)
        contrast_stats = np.concatenate([contrast.mean(axis=1), contrast.std(axis=1)])
    except Exception:
        contrast_stats = np.zeros(14)

    # Pitch / F0 — MOST speaker-discriminative
    try:
        pitches, magnitudes = librosa.piptrack(y=audio_segment, sr=sr, fmin=80, fmax=400)
        pitch_values = []
        for t in range(pitches.shape[1]):
            idx = magnitudes[:, t].argmax()
            p = pitches[idx, t]
            if p > 0:
                pitch_values.append(p)
        if pitch_values:
            pitch_arr = np.array(pitch_values)
            pitch_stats = np.array([
                pitch_arr.mean(),
                pitch_arr.std(),
                np.median(pitch_arr),
                np.percentile(pitch_arr, 25),
                np.percentile(pitch_arr, 75),
            ])
        else:
            pitch_stats = np.zeros(5)
    except Exception:
        pitch_stats = np.zeros(5)

    # Spectral centroid — voice brightness
    try:
        centroid = librosa.feature.spectral_centroid(y=audio_segment, sr=sr)
        centroid_stats = np.array([centroid.mean(), centroid.std()])
    except Exception:
        centroid_stats = np.zeros(2)

    # Zero-crossing rate — voice quality
    try:
        zcr = librosa.feature.zero_crossing_rate(audio_segment)
        zcr_stats = np.array([zcr.mean(), zcr.std()])
    except Exception:
        zcr_stats = np.zeros(2)

    # MFCC base — keep moderate weight
    mfcc_part = np.concatenate([mfcc.mean(axis=1), mfcc.std(axis=1),
                                 delta.mean(axis=1), delta.std(axis=1)])

    # Apply weighting — pitch gets the most influence (×3),
    # spectral contrast and centroid medium (×2), MFCC normal (×1)
    features = np.concatenate([
        mfcc_part,               # 52 dims, weight ×1
        contrast_stats * 2.0,    # 14 dims, weight ×2
        centroid_stats * 2.0,    # 2 dims,  weight ×2
        zcr_stats * 1.5,         # 2 dims,  weight ×1.5
        pitch_stats * 3.0,       # 5 dims,  weight ×3 (most speaker-specific)
    ])

    return features


def _auto_detect_speakers(features, hint_speakers=None, max_speakers=5):
    """
    Auto-detect optimal speaker count using silhouette score.
    hint_speakers acts as a LOWER BOUND, not a force.
    """
    from sklearn.cluster import AgglomerativeClustering
    from sklearn.metrics import silhouette_score

    n = len(features)
    if n < 3:
        return 1

    # Determine the search range
    min_k = 2
    max_k = min(max_speakers, n - 1)

    # If hint provided, expand the range to include it (but don't force)
    if hint_speakers and hint_speakers >= 2:
        max_k = max(max_k, min(hint_speakers + 1, n - 1))

    best_score = -2
    best_n = 1
    scores = {}

    for k in range(min_k, max_k + 1):
        try:
            clustering = AgglomerativeClustering(
                n_clusters=k,
                metric='euclidean',
                linkage='ward'
            )
            labels = clustering.fit_predict(features)
            if len(set(labels)) < 2:
                continue
            score = silhouette_score(features, labels)
            scores[k] = score
            if score > best_score:
                best_score = score
                best_n = k
        except Exception:
            continue

    if not scores:
        return 1

    # Print scores for debugging — helpful when tuning
    score_str = ", ".join(f"k={k}: {s:.3f}" for k, s in scores.items())
    print(f"[Recalla] Silhouette scores → {score_str} | best: k={best_n} ({best_score:.3f})")

    # Very low threshold — if there's ANY real separation, accept multi-speaker
    if best_score < 0.02:
        # All voices are essentially identical — single speaker
        # BUT if hint says multi-speaker, trust it
        if hint_speakers and hint_speakers >= 2:
            print(f"[Recalla] Score below 0.02 but hint={hint_speakers}, using hint")
            return hint_speakers
        return 1

    return best_n


def diarize_segments(audio_path, segments, hint_speakers=None):
    """
    Add speaker labels using auto-detection. hint_speakers is treated as a soft
    suggestion when acoustic features are ambiguous — NOT a forced count.
    """
    if not segments:
        return segments
    if len(segments) == 1:
        segments[0]["speaker"] = "Speaker 1"
        return segments

    try:
        import librosa
        from sklearn.cluster import AgglomerativeClustering
        from sklearn.preprocessing import StandardScaler

        wav_path = _convert_to_wav(audio_path)
        if not wav_path:
            print("[Recalla] Diarization skipped — audio conversion failed")
            for seg in segments:
                seg["speaker"] = "Speaker 1"
            return segments

        wav, sr = librosa.load(wav_path, sr=16000, mono=True)

        valid_indices = []
        features_list = []

        for i, seg in enumerate(segments):
            duration = seg["end"] - seg["start"]
            if duration < 0.5:
                continue
            start_sample = int(seg["start"] * sr)
            end_sample = min(int(seg["end"] * sr), len(wav))
            if end_sample - start_sample < sr * 0.4:
                continue
            seg_audio = wav[start_sample:end_sample]
            features = _extract_features(seg_audio, sr)
            if features is not None:
                features_list.append(features)
                valid_indices.append(i)

        try:
            os.remove(wav_path)
        except Exception:
            pass

        if len(features_list) < 2:
            for seg in segments:
                seg["speaker"] = "Speaker 1"
            return segments

        features_array = np.array(features_list)
        scaler = StandardScaler()
        features_normalized = scaler.fit_transform(features_array)

        # Auto-detect — uses hint only as fallback if ambiguous
        n_speakers = _auto_detect_speakers(features_normalized, hint_speakers=hint_speakers)

        hint_note = f" (hint was: {hint_speakers})" if hint_speakers else ""
        print(f"[Recalla] Final decision: {n_speakers} speaker(s) from {len(features_list)} segments{hint_note}")

        if n_speakers == 1:
            for seg in segments:
                seg["speaker"] = "Speaker 1"
            return segments

        clustering = AgglomerativeClustering(
            n_clusters=n_speakers,
            metric='euclidean',
            linkage='ward'
        )
        labels = clustering.fit_predict(features_normalized)

        label_per_index = {valid_indices[i]: int(labels[i]) for i in range(len(valid_indices))}

        for i, seg in enumerate(segments):
            if i in label_per_index:
                seg["speaker"] = f"Speaker {label_per_index[i] + 1}"
            else:
                if valid_indices:
                    nearest_i = min(valid_indices, key=lambda x: abs(x - i))
                    seg["speaker"] = f"Speaker {label_per_index[nearest_i] + 1}"
                else:
                    seg["speaker"] = "Speaker 1"

        return segments

    except Exception as e:
        print(f"[Recalla] Diarization error: {e}")
        import traceback
        traceback.print_exc()
        for seg in segments:
            seg["speaker"] = "Speaker 1"
        return segments