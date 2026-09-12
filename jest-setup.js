// Reanimated's own Jest hook. Must be in setupFilesAfterEnv (setupFiles is the pre-Jest-28 form).
require('react-native-reanimated').setUpTests();

// react-native-mmkv ships its own Jest mock, so there is nothing to write here for storage.

// react-native-safe-area-context ships its own mock; useSafeAreaInsets throws without a
// provider in the tree, and wrapping every render in one would be noise.
jest.mock(
  'react-native-safe-area-context',
  () =>
    // The shipped mock uses `export default`, so it arrives as { default } through Babel interop.
    require('react-native-safe-area-context/jest/mock').default,
);
