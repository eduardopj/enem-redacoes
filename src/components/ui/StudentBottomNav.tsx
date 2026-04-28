import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const STUDENT_BOTTOM_NAV_HEIGHT = 64;

type Tab = {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS: Tab[] = [
  { route: '/student/home', icon: 'home-outline', iconActive: 'home', label: 'Início' },
  { route: '/student/redacoes', icon: 'document-text-outline', iconActive: 'document-text', label: 'Redações' },
  { route: '/student/nova', icon: 'add', iconActive: 'add', label: '' },
  { route: '/student/evolucao', icon: 'trending-up-outline', iconActive: 'trending-up', label: 'Evolução' },
  { route: '/student/ranking', icon: 'trophy-outline', iconActive: 'trophy', label: 'Ranking' },
];

function NavItem({ tab, isActive, isFab }: { tab: Tab; isActive: boolean; isFab: boolean }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(dotOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    router.push(tab.route as any);
  }

  if (isFab) {
    return (
      <Pressable onPress={handlePress} style={styles.fabWrap}>
        <Animated.View style={[styles.fab, { backgroundColor: colors.accent, transform: [{ scale }] }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabIconWrap, { transform: [{ scale }] }]}>
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={22}
          color={isActive ? colors.accent : colors.mutedText}
        />
        <Animated.View
          style={[styles.activeDot, { backgroundColor: colors.accent, opacity: dotOpacity }]}
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

export function StudentBottomNav() {
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
          height: STUDENT_BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isFab = tab.icon === 'add';
        const isActive = !isFab && (
          pathname === tab.route ||
          pathname.startsWith(tab.route + '/')
        );
        return <NavItem key={tab.route} tab={tab} isActive={isActive} isFab={isFab} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 4,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 4,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  tabLabelActive: { fontWeight: '700' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: -2,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: -18,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
