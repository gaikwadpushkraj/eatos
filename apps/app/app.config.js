// Dynamic part of the Expo config. app.json holds the static settings.
// EXPO_BASE_URL lets the web build live under a sub-path, for example
// GitHub Pages project sites: EXPO_BASE_URL=/eatos
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});
