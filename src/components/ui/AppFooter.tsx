import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'home-outline', iconActive: 'home', label: 'Início', route: '/dashboard' },
  { icon: 'documents-outline', iconActive: 'documents', label: 'Redações', route: '/redacoes' },
  { icon: 'people-outline', iconActive: 'people', label: 'Alunos', route: '/alunos' },
  { icon: 'library-outline', iconActive: 'library', label: 'Temas', route: '/temas' },
  { icon: 'bar-chart-outline', iconActive: 'bar-chart', label: 'Análise', route: '/analytics' },
];
const ANDROID_BOTTOM_GUARD = 34;

export function AppFooter() {
  const { colors } = useAppTheme();
  const pathname = usePathname();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const retryQueue = useAppStore((state) => state.retryQueue);
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_BOTTOM_GUARD : 8);

  const isMainScreen = NAV_ITEMS.some((item) => pathname === item.route);

  if (isMainScreen) {
    return (
      <View
        style={[
          styles.navContainer,
          {
            backgroundColor: colors.surface,
            paddingBottom: safeBottom,
            shadowColor: '#3157D5',
          },
        ]}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route;
          const showBadge = item.route === '/redacoes' && retryQueue.length > 0;

          return (
            <Pressable
              key={item.route}
              onPress={() => router.replace(item.route as any)}
              style={styles.navItem}
            >
              <View
                style={[
                  styles.navIconWrap,
                  isActive && { backgroundColor: colors.accent + '18' },
                ]}
              >
                <Ionicons
                  name={isActive ? item.iconActive : item.icon}
                  size={21}
                  color={isActive ? colors.accent : colors.mutedText}
                />
                {showBadge ? (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>{retryQueue.length}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? colors.accent : colors.mutedText },
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingBottom: safeBottom,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.border }]}>enem ia · v{version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0,
    shadowColor: '#3157D5',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 6,
  },
  text: {
    fontSize: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
  },
  navIconWrap: {
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  navLabelActive: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
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
    fontWeight: '800',
  },
});
