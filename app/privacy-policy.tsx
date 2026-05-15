import { ScreenContainer } from '@/components/ui';
import { APP_CONFIG } from '@/constants/config';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();

  useEffect(() => {
    async function open() {
      await WebBrowser.openBrowserAsync(APP_CONFIG.privacyPolicyUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
      router.back();
    }
    open();
  }, []);

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.accent} />
        </View>
        <Text style={[styles.label, { color: colors.mutedText }]}>
          Abrindo política de privacidade…
        </Text>
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '500' },
  spinner: { marginTop: theme.spacing.sm },
});
