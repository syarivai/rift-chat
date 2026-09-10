// Reanimated's own Jest hook. Must be in setupFilesAfterEnv (setupFiles is the pre-Jest-28 form).
require('react-native-reanimated').setUpTests();

// react-native-mmkv ships its own Jest mock, so there is nothing to write here for storage.
