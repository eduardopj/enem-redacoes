import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type StatusType = 'pendente' | 'processando' | 'corrigida';

type StatusBadgeProps = {
  status: StatusType;
};

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const config = {
    pendente: {
      label: 'Pendente',
      color: colors.warning,
      backgroundColor: colors.warningSoft,
      dot: '#F59E0B',
    },
    processando: {
      label: 'Processando',
      color: colors.info,
      backgroundColor: colors.infoSoft,
      dot: '#3B82F6',
    },
    corrigida: {
      label: 'Corrigida',
      color: colors.success,
      backgroundColor: colors.successSoft,
      dot: '#22C55E',
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      {status === 'processando' ? (
        <PulsingDot color={config.dot} />
      ) : (
        <View style={[styles.dot, { backgroundColor: config.dot }]} />
      )}
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRing: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
