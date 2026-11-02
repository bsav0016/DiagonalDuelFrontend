// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    // eslint-config-expo 58 turned on the React Compiler rules. The app was written
    // before them (Date.now() in render, state set in effects), so those are warnings
    // until the screens are reworked. Refs are no longer read during render, so that
    // rule is an error to keep it that way: show state, and use a ref only in callbacks.
    'react-hooks/refs': 'error',
    'react-hooks/purity': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
  },
};
