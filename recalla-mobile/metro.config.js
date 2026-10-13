// ============================================================
// FILE PATH:  recalla-mobile/metro.config.js
// PURPOSE:    Let a Node-flavoured dependency resolve in React Native.
// ============================================================

// whisper.rn depends on safe-buffer, which imports Node's built-in "buffer".
// React Native has no Node core modules, so the bundler fails on it. Mapping
// the name to the npm "buffer" package — a faithful userland implementation —
// resolves it without patching the dependency.

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve("buffer"),
};

module.exports = config;
