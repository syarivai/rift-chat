import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/core/api/query-client';
import { initI18n } from '@/core/i18n';
import { useTheme } from '@/core/theme/use-theme';

initI18n();

export default function RootLayout() {
  // A single client for the app's lifetime. useState, not useMemo: useMemo is a performance
  // hint and may be discarded, which would throw the cache away.
  const [queryClient] = useState(createQueryClient);
  const { colors, scheme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
