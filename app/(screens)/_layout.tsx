import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { RouteProvider } from '@/contexts/RouteContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Routes } from '@/app/(screens)/Routes';
import { ThemedView } from '@/components/ThemedView';

export default function PagesLayout() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AuthProvider>
          <RouteProvider>
            <ThemedView style={styles.fullScreenArea}>
              <SafeAreaView style={styles.safeArea}>
                <Stack>
                  <Stack.Screen name={Routes.HomeScreen} options={{ headerShown: false }} />
                  <Stack.Screen name={Routes.PlayComputer} options={{ headerShown: false }} />
                  <Stack.Screen name={Routes.PlayOnline} options={{ headerShown: false }} />
                  <Stack.Screen name={Routes.Support} options={{ headerShown: false }} />
                  <Stack.Screen name={Routes.Game} options={{ headerShown: false }} />
                </Stack>
              </SafeAreaView>
            </ThemedView>
          </RouteProvider>
        </AuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}

const styles = StyleSheet.create({
  fullScreenArea: {
    flex: 1
  },
  
  safeArea: {
      flex: 1
  },
});