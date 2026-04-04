import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppFooter } from './AppFooter';
import { NoiseLayer } from './NoiseLayer';
import { TopBar } from './TopBar';

type ScreenContainerProps = PropsWithChildren<{
  noScroll?: boolean;
  showBack?: boolean;
  showHomeButton?: boolean;
}>;

export function ScreenContainer({
  children,
  noScroll = false,
  showBack = false,
  showHomeButton = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  if (noScroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <NoiseLayer />
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
      <NoiseLayer />
      <TopBar showBack={showBack} showHomeButton={showHomeButton} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {children}
      </ScrollView>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
});
