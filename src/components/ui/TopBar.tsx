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
    <View style={[styles.bar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.softText} />
          </Pressable>
        ) : null}

        {showBack && showHomeButton ? (
          <Pressable onPress={() => router.replace('/dashboard')} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="home-outline" size={20} color={colors.softText} />
          </Pressable>
        ) : null}

        {showHomeButton && !showBack ? (
          <Pressable onPress={() => router.replace('/dashboard')} style={styles.logoBtn} hitSlop={8}>
            <Ionicons name="school-outline" size={18} color={colors.accent} />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
  logoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1.8 },
  pageTitle: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
});
