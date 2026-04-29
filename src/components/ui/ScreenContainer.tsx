import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppFooter } from './AppFooter';
import { BOTTOM_NAV_HEIGHT, BottomNav } from './BottomNav';
import { STUDENT_BOTTOM_NAV_HEIGHT, StudentBottomNav } from './StudentBottomNav';
import { TopBar } from './TopBar';

type ScreenContainerProps = PropsWithChildren<{
  noScroll?: boolean;
  showBack?: boolean;
  showHomeButton?: boolean;
  showFooter?: boolean;
  showNav?: boolean;
  showStudentNav?: boolean;
}>;

export function ScreenContainer({
  children,
  noScroll = false,
  showBack = false,
  showHomeButton = true,
  showFooter = true,
  showNav = false,
  showStudentNav = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const navHeight = showNav
    ? BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8)
    : showStudentNav
    ? STUDENT_BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8)
    : 0;

  const bottomPad = navHeight > 0
    ? navHeight + 4
    : Math.max(28, insets.bottom + 16);

  const NavBar = showNav ? <BottomNav /> : showStudentNav ? <StudentBottomNav /> : null;

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
        {NavBar}
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
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {NavBar ?? (showFooter ? <AppFooter /> : null)}
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
