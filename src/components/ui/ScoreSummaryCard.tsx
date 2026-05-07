import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

type ScoreSummaryCardProps = {
  totalScore?: number;
  status: string;
  reliabilityLevel?: 'alta' | 'media' | 'baixa';
  reliabilityObservation?: string;
};

function ScoreCounter({ target, color }: { target: number; color: string }) {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animVal.setValue(0);
    setDisplay(0);
    const id = animVal.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(animVal, {
      toValue: target,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplay(target);
      animVal.removeListener(id);
    });
    return () => {
      animVal.stopAnimation();
      animVal.removeListener(id);
    };
  }, [animVal, target]);

  return <Text style={[styles.score, { color }]}>{display}</Text>;
}

export function ScoreSummaryCard({
  totalScore,
  status,
  reliabilityLevel,
  reliabilityObservation,
}: ScoreSummaryCardProps) {
  const { colors } = useAppTheme();

  const normalizedStatus =
    status === 'corrigida' || status === 'processando' || status === 'pendente' || status === 'precisa_revisao' || status === 'baixa_confiabilidade'
      ? status
      : 'pendente';

  const scoreColor =
    typeof totalScore === 'number'
      ? totalScore >= 700 ? colors.success
        : totalScore >= 500 ? colors.warning
        : colors.danger
      : colors.mutedText;

  const reliability = reliabilityLevel ? {
    alta:  { label: 'Alta confiabilidade',  color: colors.success, bg: colors.successSoft },
    media: { label: 'Confiabilidade média', color: colors.warning, bg: colors.warningSoft },
    baixa: { label: 'Baixa confiabilidade', color: colors.danger,  bg: colors.dangerSoft  },
  }[reliabilityLevel] : null;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 16, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <Card>
        <Text style={[styles.kicker, { color: colors.mutedText }]}>Resultado da correção</Text>

        <View style={styles.row}>
          <View style={styles.left}>
            {typeof totalScore === 'number' ? (
              <ScoreCounter target={totalScore} color={scoreColor} />
            ) : (
              <Text style={[styles.score, { color: colors.mutedText }]}>--</Text>
            )}
            <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>pontos</Text>
          </View>

          <View style={styles.right}>
            <StatusBadge status={normalizedStatus} />
            {reliability ? (
              <View style={[styles.reliabilityPill, { backgroundColor: reliability.bg }]}>
                <Text style={[styles.reliabilityPillText, { color: reliability.color }]}>
                  {reliability.label}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {typeof totalScore === 'number' && (
          <ProgressBar score={totalScore} color={scoreColor} colors={colors} />
        )}

        {reliabilityObservation ? (
          <View style={[styles.reliabilityBox, { borderTopColor: colors.border }]}>
            <Text style={[styles.reliabilityText, { color: colors.softText }]}>
              {reliabilityObservation}
            </Text>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

function ProgressBar({ score, color, colors }: { score: number; color: string; colors: any }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: (score / 1000) * 100,
      duration: 1100,
      delay: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabelText, { color: colors.mutedText }]}>0</Text>
        <Text style={[styles.progressLabelText, { color: colors.mutedText }]}>500</Text>
        <Text style={[styles.progressLabelText, { color: colors.mutedText }]}>1000</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
        <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressHint, { color: colors.mutedText }]}>
        {1000 - score} pontos para a nota máxima
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
    marginBottom: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  score: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 56,
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  reliabilityPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reliabilityPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reliabilityBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  reliabilityText: {
    fontSize: 13,
    lineHeight: 20,
  },
  progressSection: {
    gap: 5,
    marginTop: 8,
    marginBottom: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: { fontSize: 10, fontWeight: '500' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressHint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
});
