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
        <Pressable
          onPress={() => router.push('/profile' as any)}
          hitSlop={8}
          accessibilityLabel="Abrir perfil da conta"
          accessibilityRole="button"
        >
          <View style={[styles.avatarRing, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.textGroup}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
          ) : null}
        </View>

        {showLogout ? (
          <Pressable
            onPress={handleLogout}
            style={[styles.actionBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
            hitSlop={8}
            accessibilityLabel="Sair da conta"
            accessibilityRole="button"
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
    paddingTop: theme.spacing.xxs,
    paddingBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'Inter_700Bold',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'Inter_500Medium',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 30,
    fontFamily: 'Nunito_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
