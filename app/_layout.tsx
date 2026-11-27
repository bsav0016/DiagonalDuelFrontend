import { DarkTheme, DefaultTheme, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ErrorScreen } from '@/components/ErrorScreen';
import { useColorScheme } from '@/hooks/useColorScheme';
import { installGlobalErrorHandler } from '@/lib/errorReporting';
import { initErrorReporting } from '@/lib/sentry';

SplashScreen.preventAutoHideAsync();
// Sentry brings its own handler for uncaught errors; without it (no DSN, development) ours reports to the console.
if (!initErrorReporting()) {
  installGlobalErrorHandler();
}

// expo-router shows this instead of a blank screen when any screen fails to draw.
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen error={props.error} retry={props.retry} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (loaded) {
        await SplashScreen.hideAsync();
      }
    };

    hideSplashScreen();

  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(screens)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
