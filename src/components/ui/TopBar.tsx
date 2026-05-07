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
    <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
        ) : null}

        {showBack && showHomeButton ? (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={10}
          >
            <Ionicons name="home-outline" size={18} color={colors.softText} />
          </Pressable>
        ) : null}

        {showHomeButton && !showBack ? (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={styles.logoBtn}
            hitSlop={8}
          >
            <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="school" size={13} color="#FFFFFF" />
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
    paddingTop: 10,
    paddingBottom: 12,
    minHeight: 64,
    borderBottomWidth: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoBtn: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pageTitle: { fontSize: 16, fontWeight: '700', marginLeft: 4, letterSpacing: -0.1 },
});
