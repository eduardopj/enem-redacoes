import { formatDateTime, formatRelativeDate } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

type EssayStatus = 'pendente' | 'processando' | 'corrigida';

type EssayCardProps = {
  studentName: string;
  themeTitle: string;
  status: EssayStatus;
  totalScore?: number;
  createdAt?: string;
  correctedAt?: string;
  onPress?: () => void;
  onDelete?: () => void;
};

function scoreGradientColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  return '#EF4444';
}

export function EssayCard({
  studentName,
  themeTitle,
  status,
  totalScore,
  createdAt,
  correctedAt,
  onPress,
  onDelete,
}: EssayCardProps) {
  const { colors } = useAppTheme();

  const scoreColor =
    status === 'corrigida' && typeof totalScore === 'number'
      ? scoreGradientColor(totalScore)
      : colors.mutedText;

  const displayDate = correctedAt ?? createdAt;
  const relDate = displayDate ? formatRelativeDate(displayDate) : null;
  const fullDate = displayDate ? formatDateTime(displayDate) : null;
  const dateLabel = correctedAt ? 'Corrigida' : 'Enviada';

  return (
    <Card>
      <Pressable onPress={onPress} style={styles.mainArea}>
        <View style={styles.topRow}>
          <View style={styles.topInfo}>
            <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
            <Text style={[styles.themeTitle, { color: colors.mutedText }]} numberOfLines={2}>
              {themeTitle}
            </Text>
          </View>

          {status === 'corrigida' && typeof totalScore === 'number' ? (
            <View style={styles.scoreBlock}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{totalScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>pts</Text>
            </View>
          ) : (
            <Ionicons name="arrow-forward" size={18} color={colors.softText} />
          )}
        </View>

        <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
          <StatusBadge status={status} />

          {relDate && fullDate ? (
            <View style={styles.dateBlock}>
              <Text style={[styles.dateRelative, { color: colors.softText }]}>
                {dateLabel} {relDate}
              </Text>
              <Text style={[styles.dateFull, { color: colors.mutedText }]}>{fullDate}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          style={[styles.deleteButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.deleteLabel, { color: colors.danger }]}>Excluir</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  mainArea: {
    gap: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  topInfo: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  studentName: {
    ...theme.typography.title,
  },
  themeTitle: {
    ...theme.typography.bodySmall,
    lineHeight: 20,
  },
  scoreBlock: {
    alignItems: 'flex-end',
    gap: 0,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  scoreLabel: {
    ...theme.typography.monoLabel,
    fontSize: 9,
  },
  metaRow: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  dateBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dateRelative: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  dateFull: {
    fontSize: 11,
    lineHeight: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
