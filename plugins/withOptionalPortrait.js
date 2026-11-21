// Google Play adds a hardware requirement for each thing it can infer from the manifest. The app is locked to portrait
// (`orientation` in app.json), so Play infers `android.hardware.screen.portrait` and hides the app from devices that
// cannot show portrait (some landscape-only TVs and Chromebooks, Google Play Games on PC, Android XR). The app runs
// fine on them, so declare it "not required" to keep the app available.
const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = ['android.hardware.screen.portrait'];

function withOptionalPortrait(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const existing = (manifest['uses-feature'] || []).filter((f) => !OPTIONAL_FEATURES.includes(f.$['android:name']));
    manifest['uses-feature'] = [
      ...existing,
      ...OPTIONAL_FEATURES.map((name) => ({ $: { 'android:name': name, 'android:required': 'false' } })),
    ];
    return cfg;
  });
}

module.exports = withOptionalPortrait;
module.exports.OPTIONAL_FEATURES = OPTIONAL_FEATURES;
