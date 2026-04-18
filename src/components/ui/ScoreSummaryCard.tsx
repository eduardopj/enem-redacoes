import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

type ScoreSummaryCardProps = {
  totalScore?: number;
  status: string;
  reliabilityLevel?: 'alta' | 'media' | 'baixa';
  reliabilityObservation?: string;
};

function getScoreColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  return '#EF4444';
}

const RELIABILITY_CONFIG = {
  alta: { label: 'Alta confiabilidade', color: '#22C55E', bg: '#DCFCE7' },
  media: { label: 'Confiabilidade média', color: '#F59E0B', bg: '#FEF3C7' },
  baixa: { label: 'Baixa confiabilidade', color: '#EF4444', bg: '#FEE2E2' },
};

export function ScoreSummaryCard({
  totalScore,
  status,
  reliabilityLevel,
  reliabilityObservation,
}: ScoreSummaryCardProps) {
  const { colors } = useAppTheme();

  const normalizedStatus =
    status === 'corrigida' || status === 'processando' || status === 'pendente'
      ? status
      : 'pendente';

  const scoreColor = typeof totalScore === 'number' ? getScoreColor(totalScore) : colors.mutedText;
  const reliability = reliabilityLevel ? RELIABILITY_CONFIG[reliabilityLevel] : null;

  return (
    <Card>
      <Text style={[styles.kicker, { color: colors.mutedText }]}>Resultado da correção</Text>

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.score, { color: scoreColor }]}>
            {typeof totalScore === 'number' ? totalScore : '--'}
          </Text>
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

      {reliabilityObservation ? (
        <View style={[styles.reliabilityBox, { borderTopColor: colors.border }]}>
          <Text style={[styles.reliabilityText, { color: colors.mutedText }]}>
            {reliabilityObservation}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 12,
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
    gap: 6,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  score: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  reliabilityPill: {
    paddingHorizontal: 10,
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
});
