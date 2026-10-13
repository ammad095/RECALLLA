// ============================================================
// FILE PATH:  recalla-mobile/App.js
// PURPOSE:    Recalla on Android — the web UI in a shell, with
//             speech-to-text running on this device.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator, Alert, BackHandler, StatusBar,
  StyleSheet, Text, View, Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";

import { transcribe, prepareModel, modelState } from "./whisper";

const APP_URL = "https://141-145-152-202.sslip.io";

/**
 * Injected into the page so the web app can reach the microphone and the
 * on-device model.
 *
 * The UI is the same React app served from the server, which means one
 * codebase for web and phone. What it cannot do from a browser is run a
 * speech model locally — so the shell exposes window.RecallaNative, and the
 * web app uses it when present and falls back to the server when not.
 */
const BRIDGE = `
(function () {
  if (window.RecallaNative) return;
  const pending = {};
  let seq = 0;

  window.RecallaNative = {
    platform: 'android',
    hasOnDeviceSTT: true,

    // Returns a promise resolving to { text, segments, durationMs }.
    transcribe(base64Wav) {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending[id] = { resolve, reject };
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'transcribe', id, audio: base64Wav })
        );
      });
    },

    modelStatus() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modelStatus' }));
    },
  };

  // Native replies arrive here.
  window.__recallaNativeReply = function (msg) {
    const p = pending[msg.id];
    if (!p) return;
    delete pending[msg.id];
    msg.error ? p.reject(new Error(msg.error)) : p.resolve(msg.result);
  };

  window.dispatchEvent(new Event('recalla-native-ready'));
  true;
})();
`;

export default function App() {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Starting…");

  // Android's hardware back button should navigate the web app, not close it.
  useEffect(() => {
    const onBack = () => {
      webRef.current?.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, []);

  // Fetch the speech model once, in the background. 150 MB is too much to
  // ship inside the APK, and too much to make someone wait for on first use.
  useEffect(() => {
    let alive = true;
    prepareModel((pct) => alive && setStatus(`Preparing speech model… ${pct}%`))
      .then(() => alive && setStatus(""))
      .catch((e) => alive && setStatus(`Speech model unavailable: ${e.message}`));
    return () => { alive = false; };
  }, []);

  const onMessage = useCallback(async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    const reply = (payload) =>
      webRef.current?.injectJavaScript(
        `window.__recallaNativeReply(${JSON.stringify(payload)}); true;`
      );

    if (msg.type === "transcribe") {
      try {
        const result = await transcribe(msg.audio);
        reply({ id: msg.id, result });
      } catch (e) {
        reply({ id: msg.id, error: String(e.message || e) });
      }
    }

    if (msg.type === "modelStatus") {
      reply({ id: msg.id, result: modelState() });
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />

      <WebView
        ref={webRef}
        source={{ uri: APP_URL }}
        injectedJavaScriptBeforeContentLoaded={BRIDGE}
        onMessage={onMessage}
        onLoadEnd={() => setReady(true)}
        // The web app records audio and may ask for notification permission.
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        // Keep the session across app restarts so people are not asked to
        // sign in every time they open it.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onPermissionRequest={(req) => req.grant?.()}
        style={styles.web}
        onError={({ nativeEvent }) =>
          Alert.alert("Cannot reach Recalla", nativeEvent.description ?? "Check your connection.")
        }
      />

      {!ready && (
        <View style={styles.splash}>
          <Text style={styles.brand}>RECALLA</Text>
          <ActivityIndicator color="#10B981" style={{ marginTop: 18 }} />
        </View>
      )}

      {Boolean(status) && ready && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{status}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#0B0E14" },
  web:    { flex: 1, backgroundColor: "#0B0E14" },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0E14",
    alignItems: "center", justifyContent: "center",
  },
  brand:  { color: "#10B981", fontSize: 28, fontWeight: "700", letterSpacing: 4 },
  toast: {
    position: "absolute", bottom: 24, left: 16, right: 16,
    backgroundColor: "#12161F", borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: "#1F2733",
  },
  toastText: { color: "#A9B4C9", fontSize: 12.5, textAlign: "center" },
});
