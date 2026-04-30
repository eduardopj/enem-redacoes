import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
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
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.35, duration: 320, useNativeDriver: true }),
        ])
      );

    bar.setValue(0);
    const loops = [
      animateDot(dot1, 0),
      animateDot(dot2, 160),
      animateDot(dot3, 320),
      Animated.loop(
        Animated.timing(bar, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [bar, dot1, dot2, dot3]);

  const barTranslate = bar.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 260],
  });

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
          <Animated.View
            style={[
              styles.progressBeam,
              { backgroundColor: colors.accent, transform: [{ translateX: barTranslate }] },
            ]}
          />
        </View>

        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot3 }]} />
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
