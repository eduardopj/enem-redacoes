import { COMP_COLORS, formatRelativeDate } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from './StatusBadge';

type EssayStatus = 'pendente' | 'processando' | 'corrigida' | 'precisa_revisao' | 'baixa_confiabilidade';

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

const COMP_LABELS = ['C1', 'C2', 'C3', 'C4', 'C5'];

function MiniCompBars({ competencies }: { competencies: Competencies }) {
  const compColors = [COMP_COLORS.c1, COMP_COLORS.c2, COMP_COLORS.c3, COMP_COLORS.c4, COMP_COLORS.c5];
  const vals = [competencies.c1, competencies.c2, competencies.c3, competencies.c4, competencies.c5];
  return (
    <View style={barStyles.wrap}>
      {vals.map((v, i) => (
        <View key={i} style={barStyles.col}>
          <Text style={[barStyles.scoreLabel, { color: compColors[i] }]}>{v}</Text>
          <View style={[barStyles.track, { backgroundColor: compColors[i] + '18' }]}>
            <View style={[barStyles.fill, { height: `${(v / 200) * 100}%`, backgroundColor: compColors[i] }]} />
          </View>
          <Text style={[barStyles.label, { color: compColors[i] }]}>{COMP_LABELS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 48, marginTop: 4 },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  track: { width: '100%', height: 24, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 4 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  scoreLabel: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
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

  const scoreColor =
    typeof totalScore === 'number'
      ? totalScore >= 900 ? colors.success
        : totalScore >= 550 ? colors.accent
        : totalScore >= 380 ? colors.warning
        : colors.danger
      : colors.mutedText;

  const accentColor =
    status === 'corrigida' && typeof totalScore === 'number' ? scoreColor
    : status === 'processando' ? colors.info
    : colors.warning;

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
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

      <Pressable onPress={onPress} style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: accentColor + '14' }]}>
            <Text style={[styles.avatarText, { color: accentColor }]}>{initials}</Text>
          </View>

          <View style={styles.topInfo}>
            <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
            <Text style={[styles.themeTitle, { color: colors.mutedText }]} numberOfLines={1}>
              {themeTitle}
            </Text>
          </View>

          {status === 'corrigida' && typeof totalScore === 'number' ? (
            <View style={[styles.scorePill, { backgroundColor: scoreColor + '12' }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{totalScore}</Text>
              <Text style={[styles.scoreLabel, { color: scoreColor + 'AA' }]}>pts</Text>
            </View>
          ) : (
            <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
              <Ionicons name="chevron-forward" size={15} color={colors.softText} />
            </View>
          )}
        </View>

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
          <Ionicons name="trash-outline" size={13} color={colors.danger} />
          <Text style={[styles.deleteLabel, { color: colors.danger }]}>Excluir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...theme.shadows.card,
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
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  themeTitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  scorePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 54,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
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
    paddingTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderTopWidth: 1,
  },
  metaRow: {
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateRelative: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    margin: theme.spacing.xs,
    marginTop: 0,
  },
  deleteLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
