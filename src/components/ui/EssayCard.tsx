import { formatDateTime, formatRelativeDate } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

type EssayStatus = 'pendente' | 'processando' | 'corrigida';

type Competencies = {
  c1: number; c2: number; c3: number; c4: number; c5: number;
};

type EssayCardProps = {
  studentName: string;
  themeTitle: string;
  status: EssayStatus;
  totalScore?: number;
  competencies?: Competencies;
  createdAt?: string;
  correctedAt?: string;
  onPress?: () => void;
  onDelete?: () => void;
};

const COMP_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

function scoreColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  return '#EF4444';
}

function MiniCompBars({ competencies }: { competencies: Competencies }) {
  const vals = [competencies.c1, competencies.c2, competencies.c3, competencies.c4, competencies.c5];
  return (
    <View style={barStyles.wrap}>
      {vals.map((v, i) => (
        <View key={i} style={barStyles.col}>
          <View style={barStyles.track}>
            <View style={[barStyles.fill, { height: `${(v / 200) * 100}%`, backgroundColor: COMP_COLORS[i] }]} />
          </View>
          <Text style={[barStyles.label, { color: COMP_COLORS[i] }]}>C{i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 28 },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  track: { width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 3 },
  label: { fontSize: 8, fontWeight: '700' },
});

export function EssayCard({
  studentName,
  themeTitle,
  status,
  totalScore,
  competencies,
  createdAt,
  correctedAt,
  onPress,
  onDelete,
}: EssayCardProps) {
  const { colors } = useAppTheme();

  const color =
    status === 'corrigida' && typeof totalScore === 'number'
      ? scoreColor(totalScore)
      : colors.mutedText;

  const displayDate = correctedAt ?? createdAt;
  const relDate = displayDate ? formatRelativeDate(displayDate) : null;
  const fullDate = displayDate ? formatDateTime(displayDate) : null;
  const dateLabel = correctedAt ? 'Corrigida' : 'Enviada';

  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const showCompBars = status === 'corrigida' && competencies;

  return (
    <Card>
      <Pressable onPress={onPress}>
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: status === 'corrigida' ? color + '18' : colors.accent + '18' }]}>
            <Text style={[styles.avatarText, { color: status === 'corrigida' ? color : colors.accent }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.topInfo}>
            <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
            <Text style={[styles.themeTitle, { color: colors.mutedText }]} numberOfLines={1}>
              {themeTitle}
            </Text>
          </View>

          {/* Score or arrow */}
          {status === 'corrigida' && typeof totalScore === 'number' ? (
            <View style={[styles.scorePill, { backgroundColor: color + '18' }]}>
              <Text style={[styles.scoreValue, { color }]}>{totalScore}</Text>
              <Text style={[styles.scoreLabel, { color }]}>pts</Text>
            </View>
          ) : (
            <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
              <Ionicons name="chevron-forward" size={16} color={colors.softText} />
            </View>
          )}
        </View>

        {/* Mini competency bars */}
        {showCompBars ? (
          <View style={[styles.compSection, { borderTopColor: colors.border }]}>
            <MiniCompBars competencies={competencies!} />
          </View>
        ) : null}

        <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
          <StatusBadge status={status} />

          {relDate && fullDate ? (
            <View style={styles.dateBlock}>
              <Text style={[styles.dateRelative, { color: colors.softText }]}>
                {dateLabel} {relDate}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          style={[styles.deleteButton, { backgroundColor: colors.dangerSoft }]}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={[styles.deleteLabel, { color: colors.danger }]}>Excluir</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topInfo: {
    flex: 1,
    gap: 3,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  themeTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  scorePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 56,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compSection: {
    paddingTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderTopWidth: 1,
  },
  metaRow: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateBlock: {
    alignItems: 'flex-end',
  },
  dateRelative: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginTop: theme.spacing.sm,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
