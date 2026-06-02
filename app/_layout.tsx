import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { setUnauthorizedHandler } from '@/services/api';
import { useAppStore } from '@/store/app-store';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeContext';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentryInitialized = false;

function initSentryIfNeeded() {
  if (!SENTRY_DSN || sentryInitialized) return;
  sentryInitialized = true;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version,
    tracesSampleRate: __DEV__ ? 0 : 0.15,
    profilesSampleRate: __DEV__ ? 0 : 0.1,
    sendDefaultPii: false,
  });
}

LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'ExpoKeepAwake',
]);

function ThemedStack() {
  const { colors, isDark } = useAppTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </>
  );
}

function RootLayout() {
  const logout = useAppStore((state) => state.logout);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const sentryConsent = useAppStore((state) => state.sentryConsent);
  const setSentryConsent = useAppStore((state) => state.setSentryConsent);
  const recoverStuckEssays = useAppStore((state) => state.recoverStuckEssays);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace('/');
    });
  }, [logout]);

  // Recover essays stuck in 'processando' from a previous session that was killed.
  useEffect(() => {
    if (hasHydrated) recoverStuckEssays();
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Init Sentry as soon as the user grants consent
  useEffect(() => {
    if (sentryConsent === true) initSentryIfNeeded();
  }, [sentryConsent]);

  // Show one-time consent dialog after hydration, when the teacher is logged in
  useEffect(() => {
    if (!hasHydrated || !currentTeacher || sentryConsent !== null) return;
    Alert.alert(
      'Melhore o app conosco',
      'Posso enviar relatórios de erro anônimos para nos ajudar a corrigir falhas? Nenhum dado pessoal é coletado.',
      [
        { text: 'Não', style: 'cancel', onPress: () => setSentryConsent(false) },
        { text: 'Sim, aceito', onPress: () => setSentryConsent(true) },
      ],
      { cancelable: false }
    );
  }, [hasHydrated, currentTeacher, sentryConsent, setSentryConsent]);

  useEffect(() => {
    // Navigate to the essay result when teacher taps a push notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.essayId) {
        router.push(`/resultado/${data.essayId}` as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1 }} />;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <ThemedStack />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Init synchronously on module load if user already granted consent in a previous session.
// This ensures Sentry.wrap below has a live instance to attach the native crash handler to.
import { useAppStore as _store } from '@/store/app-store';
try {
  if (_store.getState().sentryConsent === true) initSentryIfNeeded();
} catch (_) { /* store not ready yet — deferred init via useEffect will handle it */ }

// Sentry.wrap adds the native crash handler; is a no-op when Sentry is not initialized
export default Sentry.wrap(RootLayout);
