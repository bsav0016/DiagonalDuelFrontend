import { Stack } from 'expo-router';
import { RouteProvider } from '@/contexts/RouteContext';
import { Routes } from '@/enums/Routes';

export default function PagesLayout() {
  return (
    <RouteProvider>
      <Stack>
        <Stack.Screen name={Routes.Homepage} options={{ headerShown: false }} />
        <Stack.Screen name={Routes.PlayComputer} options={{ headerShown: false }} />
        <Stack.Screen name={Routes.Support} options={{ headerShown: false }} />
      </Stack>
    </RouteProvider>
  );
}
