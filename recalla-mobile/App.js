// ============================================================
// FILE PATH:  recalla-mobile/App.js
// PURPOSE:    Recalla on Android — web UI, native recording.
// ============================================================

/**
 * The app is the web UI in a WebView, with two native screens in front of it
 * for recording and reading a fresh transcript.
 *
 * Everything that is just interface — dashboard, meetings, Ask Recalla,
 * settings — stays web, so there is one codebase and a fix ships by
 * redeploying the server. Recording is native because it needs a microphone
 * stream, a speech model and chunked background work, none of which a page
 * in a WebView can do.
 */

import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, StatusBar, StyleSheet, Text, View,
} from "react-native";
import { WebView } from "react-native-webview";

import RecordScreen from "./RecordScreen";
import TranscriptScreen from "./TranscriptScreen";
import { prepareModel, nativeSpeechAvailable } from "./whisper";
import { C } from "./theme";

const APP_URL = "https://141-145-152-202.sslip.io";

/**
 * Injected before the page loads.
 *
 * The web app checks for window.RecallaNative: when it exists, the Record
 * button hands off to the native screen; when it does not — a laptop browser
 * — it keeps its own behaviour. One build, two capabilities.
 */
const bridgeSource = (hasStt) => `
(function () {
  if (window.RecallaNative) return;
  const waiting = {};
  let seq = 0;

  window.RecallaNative = {
    platform: 'android',
    hasOnDeviceSTT: __HAS_STT__,

    /** Open the native recorder. */
    record() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'record' }));
    },

    ask(type) {
      const id = ++seq;
      return new Promise((resolve) => {
        waiting[id] = resolve;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, id }));
      });
    },
  };

  window.__recallaReply = function (msg) {
    const f = waiting[msg.id];
    if (f) { delete waiting[msg.id]; f(msg.result); }
  };

  // The native side needs the session token to upload a meeting. Reading it
  // from the page keeps one source of truth for auth instead of a second
  // login inside the shell.
  window.__recallaToken = function () {
    try { return localStorage.getItem('recalla_access_token') || ''; }
    catch (e) { return ''; }
  };

  window.dispatchEvent(new Event('recalla-native-ready'));
  true;
})();
`.replace('__HAS_STT__', hasStt ? 'true' : 'false');

export default function App() {
  const webRef = useRef(null);
  const liveRef = useRef(null);
  const tokenWaiters = useRef([]);

  const [screen, setScreen] = useState("web");     // web | record | transcript
  const [meetingId, setMeetingId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Android back should move through the web app, not close it.
  useState(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen !== "web") { setScreen("web"); return true; }
      webRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  });

  /** Read the session token out of the page's localStorage. */
  const getToken = useCallback(
    () =>
      new Promise((resolve) => {
        tokenWaiters.current.push(resolve);
        webRef.current?.injectJavaScript(`
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'token', value: window.__recallaToken()
          })); true;
        `);
        // Never hang the upload on a WebView that is not answering.
        setTimeout(() => resolve(""), 4000);
      }),
    []
  );

  const onMessage = useCallback((event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === "record") {
      // Start fetching the model now rather than when they press record.
      prepareModel().catch(() => {});
      setScreen("record");
    }

    if (msg.type === "token") {
      const waiters = tokenWaiters.current;
      tokenWaiters.current = [];
      waiters.forEach((f) => f(msg.value || ""));
    }
  }, []);

  if (screen === "record") {
    return (
      <RecordScreen
        onCancel={() => setScreen("web")}
        onDone={(id, live) => {
          liveRef.current = live;
          setMeetingId(id);
          setScreen("transcript");
        }}
      />
    );
  }

  if (screen === "transcript") {
    return (
      <TranscriptScreen
        meetingId={meetingId}
        live={liveRef.current}
        getToken={getToken}
        onBack={() => {
          liveRef.current = null;
          setScreen("web");
          // The meetings list is stale now that one more exists.
          webRef.current?.reload();
        }}
      />
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <WebView
        ref={webRef}
        source={{ uri: APP_URL }}
        injectedJavaScriptBeforeContentLoaded={bridgeSource(nativeSpeechAvailable())}
        onMessage={onMessage}
        onLoadEnd={() => setLoaded(true)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onPermissionRequest={(r) => r.grant?.()}
        style={s.web}
        onError={({ nativeEvent }) =>
          Alert.alert("Cannot reach Recalla", nativeEvent.description ?? "Check your connection.")
        }
      />
      {!loaded && (
        <View style={s.splash}>
          <Text style={s.brand}>RECALLA</Text>
          <ActivityIndicator color={C.emerald} style={{ marginTop: 18 }} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  web: { flex: 1, backgroundColor: C.bg },
  splash: {
    ...StyleSheet.absoluteFillObject, backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center",
  },
  brand: { color: C.emerald, fontSize: 28, fontWeight: "700", letterSpacing: 4 },
});
