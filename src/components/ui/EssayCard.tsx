import { formatDateTime, formatRelativeDate } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
const COMP_LABELS = ['C1', 'C2', 'C3', 'C4', 'C5'];

function scoreColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  return '#EF4444';
}

function statusAccentColor(status: EssayStatus, score?: number, colors?: any): string {
  if (status === 'corrigida' && typeof score === 'number') return scoreColor(score);
  if (status === 'processando') return '#3B82F6';
  return colors?.warning ?? '#F59E0B';
}

function MiniCompBars({ competencies }: { competencies: Competencies }) {
  const vals = [competencies.c1, competencies.c2, competencies.c3, competencies.c4, competencies.c5];
  return (
    <View style={barStyles.wrap}>
      {vals.map((v, i) => (
        <View key={i} style={barStyles.col}>
          <Text style={[barStyles.scoreLabel, { color: COMP_COLORS[i] }]}>{v}</Text>
          <View style={[barStyles.track, { backgroundColor: COMP_COLORS[i] + '18' }]}>
            <View style={[barStyles.fill, { height: `${(v / 200) * 100}%`, backgroundColor: COMP_COLORS[i] }]} />
          </View>
          <Text style={[barStyles.label, { color: COMP_COLORS[i] }]}>{COMP_LABELS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 52, marginTop: 4 },
  col: { flex: 1, alignItems: 'center', gap: 3 },
  track: { width: '100%', height: 28, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 4 },
  label: { fontSize: 8, fontWeight: '800', letterSpacing: 0.2 },
  scoreLabel: { fontSize: 9, fontWeight: '700', lineHeight: 11 },
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

  const accentColor = statusAccentColor(status, totalScore, colors);

  const displayDate = correctedAt ?? createdAt;
  const relDate = displayDate ? formatRelativeDate(displayDate) : null;
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
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Status accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

      <Pressable onPress={onPress} style={styles.inner}>
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.avatarText, { color: accentColor }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.topInfo}>
            <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
            <Text style={[styles.themeTitle, { color: colors.mutedText }]} numberOfLines={1}>
              {themeTitle}
            </Text>
          </View>

          {/* Score pill or status indicator */}
          {status === 'corrigida' && typeof totalScore === 'number' ? (
            <View style={[styles.scorePill, { backgroundColor: accentColor + '14' }]}>
              <Text style={[styles.scoreValue, { color: accentColor }]}>{totalScore}</Text>
              <Text style={[styles.scoreLabel, { color: accentColor + 'AA' }]}>pts</Text>
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

          {relDate ? (
            <Text style={[styles.dateRelative, { color: colors.mutedText }]}>
              {dateLabel} {relDate}
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  accentStrip: {
    height: 3,
    width: '100%',
  },
  inner: {
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontWeight: '700',
    lineHeight: 20,
  },
  themeTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  scorePill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 62,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    margin: theme.spacing.xs,
    marginTop: 0,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
