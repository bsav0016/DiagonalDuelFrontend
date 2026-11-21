// withAndroidManifest only registers a mod; call the mod the plugin registers against a fake manifest.
jest.mock('expo/config-plugins', () => ({
  withAndroidManifest: (config, action) => action({ ...config, modResults: config.__manifest }),
}));
const withOptionalPortrait = require('../plugins/withOptionalPortrait');

const run = (manifest) => withOptionalPortrait({ __manifest: { manifest } }).modResults.manifest['uses-feature'];

describe('withOptionalPortrait', () => {
  test('declares the portrait screen as not required', () => {
    const features = run({});
    expect(features).toHaveLength(1);
    expect(features[0].$).toEqual({ 'android:name': 'android.hardware.screen.portrait', 'android:required': 'false' });
  });

  test('keeps other features and replaces a stricter declaration of the same one', () => {
    const features = run({
      'uses-feature': [
        { $: { 'android:name': 'android.hardware.camera', 'android:required': 'false' } },
        { $: { 'android:name': 'android.hardware.screen.portrait', 'android:required': 'true' } },
      ],
    });
    const byName = Object.fromEntries(features.map((f) => [f.$['android:name'], f.$['android:required']]));
    expect(byName['android.hardware.camera']).toBe('false');
    expect(byName['android.hardware.screen.portrait']).toBe('false');
    expect(features.filter((f) => f.$['android:name'] === 'android.hardware.screen.portrait')).toHaveLength(1);
  });
});
