// Sentry's Expo config adds the debug ids that match crashes to uploaded source maps. Everything else is Expo's default.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
