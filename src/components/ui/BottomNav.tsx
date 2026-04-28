import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BOTTOM_NAV_HEIGHT = 64;

type Tab = {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS: Tab[] = [
  { route: '/dashboard', icon: 'home-outline', iconActive: 'home', label: 'Início' },
  { route: '/redacoes', icon: 'document-text-outline', iconActive: 'document-text', label: 'Redações' },
  { route: '/nova-redacao', icon: 'add', iconActive: 'add', label: '' },
  { route: '/alunos', icon: 'people-outline', iconActive: 'people', label: 'Alunos' },
  { route: '/analytics', icon: 'bar-chart-outline', iconActive: 'bar-chart', label: 'Análises' },
];

function NavItem({ tab, isActive, isFab }: { tab: Tab; isActive: boolean; isFab: boolean }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const pillScale = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;
  const pillOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale, {
        toValue: isActive ? 1 : 0.7,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
      Animated.timing(pillOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    router.push(tab.route as any);
  }

  if (isFab) {
    return (
      <Pressable onPress={handlePress} style={styles.fabWrap}>
        <Animated.View
          style={[styles.fab, { backgroundColor: colors.accent, transform: [{ scale }] }]}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabIconWrap, { transform: [{ scale }] }]}>
        {/* Active pill background */}
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: colors.accent + '18',
              opacity: pillOpacity,
              transform: [{ scaleX: pillScale }, { scaleY: pillScale }],
            },
          ]}
        />
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={22}
          color={isActive ? colors.accent : colors.mutedText}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? colors.accent : colors.mutedText },
          isActive && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export function BottomNav() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          height: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isFab = tab.icon === 'add';
        const isActive = !isFab && (
          pathname === tab.route ||
          (tab.route === '/dashboard' && pathname === '/') ||
          pathname.startsWith(tab.route + '/')
        );
        return (
          <NavItem key={tab.route} tab={tab} isActive={isActive} isFab={isFab} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 6,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 30,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: -20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
});
