import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Card } from './Card';

type GlobalLoadingProps = {
  title?: string;
  subtitle?: string;
};

export function GlobalLoading({
  title = 'Processando correção',
  subtitle = 'Aguarde enquanto a redação está sendo transcrita e avaliada.',
}: GlobalLoadingProps) {
  const { colors } = useAppTheme();
  const dot1 = useSharedValue(0.35);
  const dot2 = useSharedValue(0.35);
  const dot3 = useSharedValue(0.35);
  const bar = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(withTiming(1, { duration: 320 }), withTiming(0.35, { duration: 320 })),
      -1,
      false
    );
    dot2.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 160 }),
        withTiming(1, { duration: 320 }),
        withTiming(0.35, { duration: 320 })
      ),
      -1,
      false
    );
    dot3.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 320 }),
        withTiming(1, { duration: 320 }),
        withTiming(0.35, { duration: 320 })
      ),
      -1,
      false
    );
    bar.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
  }, [bar, dot1, dot2, dot3]);

  const dotStyle1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dotStyle2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dotStyle3 = useAnimatedStyle(() => ({ opacity: dot3.value }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -260 + bar.value * 520 }] }));

  return (
    <Card>
      <View style={styles.container}>
        <Text style={[styles.kicker, { color: colors.accent }]}>CORREÇÃO EM ANDAMENTO</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>

        <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.input }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.softText }]}>ETAPAS</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              TRANSCRIÇÃO • LEITURA • COMPETÊNCIAS • FEEDBACK
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.softText }]}>MOTOR</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              BACKEND LOCAL + OPENAI ESTRUTURADA
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { borderColor: colors.border, backgroundColor: colors.input }]}>
          <Animated.View style={[styles.progressBeam, { backgroundColor: colors.accent }, barStyle]} />
        </View>

        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent }, dotStyle1]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent }, dotStyle2]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent }, dotStyle3]} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  kicker: { ...theme.typography.monoLabel },
  title: { ...theme.typography.h3, textAlign: 'center' },
  subtitle: { ...theme.typography.body, textAlign: 'center', marginBottom: theme.spacing.sm },
  panel: { width: '100%', borderWidth: 1, padding: theme.spacing.md, gap: theme.spacing.md },
  row: { gap: theme.spacing.xs },
  rowLabel: { ...theme.typography.monoLabel },
  rowValue: { ...theme.typography.bodySmall, lineHeight: 20 },
  progressTrack: {
    width: '100%',
    height: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: theme.spacing.sm,
  },
  progressBeam: { width: 110, height: '100%', opacity: 0.9 },
  dots: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 999 },
});
