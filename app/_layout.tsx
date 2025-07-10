import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { NotificationBanner } from '../components/NotificationBanner';
import { TempWarning } from '../components/TempWarning';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/NotificationService';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SupabaseProvider } from '../contexts/SupabaseContext';
import { TaskRefreshProvider } from '../contexts/TaskRefreshContext';

export default function RootLayout() {
  useFrameworkReady();
  const notificationHook = useNotifications();

  useEffect(() => {
    // Initialiser le service de notifications
    notificationService.setNotificationHook(notificationHook);
    notificationService.initialize();
  }, []);

  return (
    <SupabaseProvider>
      <ThemeProvider>
        <TaskRefreshProvider>
          {/* {isTempMode && <TempWarning />} */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(manager-tabs)" />
            <Stack.Screen name="directeur" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <NotificationBanner />
        </TaskRefreshProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}