import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeToggle } from './ThemeToggle';

type TopBarProps = {
  showHomeButton?: boolean;
  showBack?: boolean;
  title?: string;
};

export function TopBar({ showHomeButton = true, showBack = false, title }: TopBarProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.background }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}

        {showBack && showHomeButton ? (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            hitSlop={10}
          >
            <Ionicons name="home-outline" size={20} color={colors.softText} />
          </Pressable>
        ) : null}

        {showHomeButton && !showBack ? (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={styles.logoBtn}
            hitSlop={8}
          >
            <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="school" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>ENEM IA</Text>
          </Pressable>
        ) : title && !showBack ? (
          <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 56,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  pageTitle: { fontSize: 17, fontWeight: '600', marginLeft: 4 },
});
