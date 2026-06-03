import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
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
import * as SplashScreen from 'expo-splash-screen';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Alert, LogBox, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.82);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSpring(1, { damping: 14, stiffness: 120 });
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    containerOpacity.value = withDelay(700, withTiming(0, { duration: 320, easing: Easing.out(Easing.ease) }));
    // 700ms hold + 320ms fade-out
    const t = setTimeout(onFinish, 1020);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      <Animated.View style={[splashStyles.inner, logoStyle]}>
        <View style={splashStyles.iconBox}>
          <Text style={splashStyles.iconEmoji}>✏️</Text>
        </View>
        <Text style={splashStyles.title}>ENEM IA</Text>
        <Text style={splashStyles.subtitle}>Correção inteligente de redações</Text>
      </Animated.View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inner: { alignItems: 'center', gap: 16 },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 48 },
  title: {
    fontFamily: 'Nunito_900Black',
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.1,
  },
});

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

// Show notifications as banners even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function ThemedStack() {
  const { colors, isDark } = useAppTheme();
  const { isOnline } = useOfflineSync();
  const currentTeacher = useAppStore((s) => s.currentTeacher);

  // Register home screen shortcuts once the teacher is logged in
  useEffect(() => {
    if (!currentTeacher) return;
    QuickActions.setItems([
      {
        id: 'nova-redacao',
        title: 'Nova Redação',
        subtitle: 'Corrigir com IA',
        icon: 'compose',
        params: { href: '/nova-redacao' },
      },
      {
        id: 'redacoes',
        title: 'Últimas Correções',
        subtitle: 'Ver histórico',
        icon: 'search',
        params: { href: '/redacoes' },
      },
    ]);
  }, [currentTeacher]);

  // Navigate when app is opened via a shortcut
  useQuickActionCallback((action) => {
    const href = action?.params?.href as string | undefined;
    if (href) router.push(href as any);
  });

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
      <OfflineBanner visible={!isOnline} />
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
  const [splashDone, setSplashDone] = useState(false);
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

  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

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

  // Hide native splash once fonts are ready, then our animated splash takes over
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#7C3AED' }} />;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <ThemedStack />
            {!splashDone && <AnimatedSplash onFinish={handleSplashFinish} />}
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
