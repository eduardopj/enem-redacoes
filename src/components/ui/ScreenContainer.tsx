import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppFooter } from './AppFooter';
import { TopBar } from './TopBar';

type ScreenContainerProps = PropsWithChildren<{
  noScroll?: boolean;
  showBack?: boolean;
  showHomeButton?: boolean;
  showFooter?: boolean;
}>;

export function ScreenContainer({
  children,
  noScroll = false,
  showBack = false,
  showHomeButton = true,
  showFooter = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  if (noScroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <TopBar showBack={showBack} showHomeButton={showHomeButton} />
        <View
          style={[
            styles.staticContent,
            { paddingBottom: Math.max(theme.spacing.xl, insets.bottom + 20) },
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <TopBar showBack={showBack} showHomeButton={showHomeButton} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(28, insets.bottom + 16) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {showFooter && <AppFooter />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
