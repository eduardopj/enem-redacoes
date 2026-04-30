import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppFooter } from './AppFooter';
import { BOTTOM_NAV_HEIGHT, BottomNav } from './BottomNav';
import { STUDENT_BOTTOM_NAV_HEIGHT, StudentBottomNav } from './StudentBottomNav';
import { TopBar } from './TopBar';

const ANDROID_BOTTOM_GUARD = 34;

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
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryY = useRef(new Animated.Value(10)).current;
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_BOTTOM_GUARD : 8);

  const navHeight = showNav
    ? BOTTOM_NAV_HEIGHT + safeBottom
    : showStudentNav
    ? STUDENT_BOTTOM_NAV_HEIGHT + safeBottom
    : 0;

  const bottomPad = navHeight > 0
    ? theme.spacing.md
    : Math.max(theme.spacing.md, safeBottom);

  const NavBar = showNav ? <BottomNav /> : showStudentNav ? <StudentBottomNav /> : null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(entryY, {
        toValue: 0,
        damping: 18,
        stiffness: 170,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryY]);

  if (noScroll) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <TopBar showBack={showBack} showHomeButton={showHomeButton} />
        <Animated.View
          style={[
            styles.staticContent,
            {
              paddingBottom: Math.max(theme.spacing.md, safeBottom),
              opacity: entryOpacity,
              transform: [{ translateY: entryY }],
            },
          ]}
        >
          {children}
        </Animated.View>
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
        <Animated.ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          contentInsetAdjustmentBehavior="never"
          scrollIndicatorInsets={{ bottom: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces
          style={[
            styles.scroll,
            {
              opacity: entryOpacity,
              transform: [{ translateY: entryY }],
            },
          ]}
        >
          {children}
        </Animated.ScrollView>
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
