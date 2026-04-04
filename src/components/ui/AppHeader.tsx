import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showLogout?: boolean;
};

export function AppHeader({ eyebrow, title, subtitle, showLogout }: AppHeaderProps) {
  const { colors } = useAppTheme();
  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textGroup}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
        </View>
        {showLogout ? (
          <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.border }]} hitSlop={8}>
            <Ionicons name="log-out-outline" size={18} color={colors.mutedText} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  textGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    ...theme.typography.monoLabel,
  },
  title: {
    ...theme.typography.h2,
  },
  subtitle: {
    ...theme.typography.body,
    lineHeight: 24,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});