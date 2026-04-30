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
  const currentTeacher = useAppStore((state) => state.currentTeacher);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const initials = currentTeacher?.name
    ? currentTeacher.name
        .replace(/^Professor\s+/i, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'P';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Avatar with subtle ring */}
        <View style={[styles.avatarRing, { borderColor: colors.accent + '30' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.textGroup}>
          {eyebrow ? (
            <View style={[styles.eyebrowBadge, { backgroundColor: colors.accent + '12' }]}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Actions */}
        {showLogout ? (
          <Pressable
            onPress={handleLogout}
            style={[styles.actionBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
            hitSlop={8}
          >
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
    paddingBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
