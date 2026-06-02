import { formatRelativeDate, getScoreColor } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
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
  hasError?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
};

export function EssayCard({
  studentName,
  themeTitle,
  status,
  totalScore,
  createdAt,
  correctedAt,
  hasError,
  onPress,
  onDelete,
}: EssayCardProps) {
  const { colors } = useAppTheme();

  const scoreColor = typeof totalScore === 'number'
    ? getScoreColor(totalScore, colors)
    : colors.mutedText;

  const accentColor =
    hasError ? colors.danger
    : status === 'corrigida' && typeof totalScore === 'number' ? scoreColor
    : status === 'processando' ? colors.info
    : colors.warning;

  const displayDate = correctedAt ?? createdAt;
  const relDate = displayDate ? formatRelativeDate(displayDate) : null;

  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View>
      <Pressable onPress={onPress} style={styles.row}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.themeTitle, { color: colors.text }]} numberOfLines={1}>
            {themeTitle}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedText }]} numberOfLines={1}>
            {studentName}{relDate ? ` · ${relDate}` : ''}
          </Text>
        </View>

        {/* Right side */}
        {hasError ? (
          <View style={[styles.errorPill, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons name="alert-circle" size={12} color={colors.danger} />
            <Text style={[styles.errorPillText, { color: colors.danger }]}>Erro</Text>
          </View>
        ) : status === 'corrigida' && typeof totalScore === 'number' ? (
          <View style={[styles.scorePill, { backgroundColor: scoreColor + '14' }]}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{totalScore}</Text>
          </View>
        ) : (
          <StatusBadge status={status} />
        )}

        <Ionicons name="chevron-forward" size={14} color={colors.mutedText} style={styles.chevron} />
      </Pressable>

      {onDelete ? (
        <View style={styles.deleteWrap}>
          <Pressable
            onPress={onDelete}
            style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}
          >
            <Ionicons name="trash-outline" size={12} color={colors.danger} />
            <Text style={[styles.deleteText, { color: colors.danger }]}>Excluir</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
  },
  scorePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
    flexShrink: 0,
  },
  scoreNum: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  errorPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    flexShrink: 0,
  },
  deleteWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
