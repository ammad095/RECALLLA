# Recalla — Android app

A thin native shell around the Recalla web app, plus speech-to-text that runs
on the phone.

## Why a shell rather than a rewrite

The UI is the same React app the browser loads, served from the backend. One
codebase, one place to fix a bug, and the app updates when the server does —
no new APK for a UI change.

What a browser *cannot* do is run a speech model locally. The shell adds that:
`window.RecallaNative.transcribe()` is injected into the page, and the web app
uses it when present and falls back to the server when not. So the same build
works on a laptop and gains on-device transcription on a phone.

## Speech-to-text

`ggml-base.en-q5_1` — about 60 MB, downloaded once on first launch rather than
bundled, because Google Play caps a base APK at 150 MB.

Chosen over Parakeet TDT 0.6B deliberately. Parakeet int8 is ~630 MB (622 MB
encoder alone) and measured *worse* on accuracy in our benchmark — 7.5% WER
against Whisper's 5.9% on the same clips and hardware. Switching later is a
one-line change in `whisper.js`.

**Audio never leaves the device.** The clip is written to cache, transcribed,
and deleted; only text is sent to the server. That is also why the backend
runs on a 1 GB instance — it carries no ML libraries at all.

## Building

Requires an Expo account. `whisper.rn` is a native module, so Expo Go cannot
run this — it needs a development or preview build.

```bash
npm install
npx eas login
npx eas build --platform android --profile preview   # produces an APK
```

For a local build instead, you need the JDK and Android SDK installed, then:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## Pointing at a different backend

`APP_URL` in `App.js`.
