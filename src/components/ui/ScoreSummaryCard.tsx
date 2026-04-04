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

  return (
    <Card>
      <Text style={[styles.kicker, { color: colors.softText }]}>RESULTADO DA CORREÇÃO</Text>

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.score, { color: colors.text }]}>{typeof totalScore === 'number' ? totalScore : '--'}</Text>
          <Text style={[styles.caption, { color: colors.mutedText }]}>NOTA TOTAL</Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.caption, { color: colors.mutedText }]}>STATUS</Text>
          <StatusBadge status={normalizedStatus} />
        </View>
      </View>

      <View style={[styles.reliabilityBox, { borderTopColor: colors.border }]}>
        <Text style={[styles.reliabilityLabel, { color: colors.softText }]}>
          CONFIABILIDADE: {reliabilityLevel ?? 'não informada'}
        </Text>
        <Text style={[styles.reliabilityText, { color: colors.mutedText }]}>
          {reliabilityObservation ?? 'Sem observação de confiabilidade.'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...theme.typography.monoLabel,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  score: {
    ...theme.typography.metric,
  },
  caption: {
    ...theme.typography.monoLabel,
    marginTop: theme.spacing.xs,
  },
  reliabilityBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
  },
  reliabilityLabel: {
    ...theme.typography.monoLabel,
  },
  reliabilityText: {
    ...theme.typography.bodySmall,
    lineHeight: 22,
  },
});