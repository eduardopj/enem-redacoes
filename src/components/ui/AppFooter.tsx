import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavItem = {
  icon: 'home-outline' | 'documents-outline' | 'people-outline' | 'library-outline' | 'bar-chart-outline';
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'home-outline', label: 'Início', route: '/dashboard' },
  { icon: 'documents-outline', label: 'Redações', route: '/redacoes' },
  { icon: 'people-outline', label: 'Alunos', route: '/alunos' },
  { icon: 'library-outline', label: 'Temas', route: '/temas' },
  { icon: 'bar-chart-outline', label: 'Análise', route: '/analytics' },
];

export function AppFooter() {
  const { colors } = useAppTheme();
  const pathname = usePathname();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const retryQueue = useAppStore((state) => state.retryQueue);
  const insets = useSafeAreaInsets();

  // Show nav only on main screens
  const isMainScreen = NAV_ITEMS.some((item) => pathname === item.route);

  if (isMainScreen) {
    return (
      <View style={[styles.navContainer, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route;
          const showBadge = item.route === '/redacoes' && retryQueue.length > 0;
          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route as any)}
              style={styles.navItem}
            >
              <View style={styles.navIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isActive ? colors.accent : colors.mutedText}
                />
                {showBadge ? (
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.badgeText}>{retryQueue.length}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.navLabel, { color: isActive ? colors.accent : colors.mutedText }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Text style={[styles.text, { color: colors.border }]}>
        enem ia · v{version} · correção com ia
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  navIconWrap: {
    position: 'relative',
  },
  navLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
