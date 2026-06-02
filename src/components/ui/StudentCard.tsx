import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type StudentCardProps = {
  name: string;
  className: string;
  avgScore?: number | null;
  essayCount?: number;
  trend?: 'up' | 'down' | 'stable' | null;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function StudentCard({
  name,
  className,
  avgScore,
  essayCount,
  trend,
  onPress,
  onEdit,
  onDelete,
}: StudentCardProps) {
  const { colors } = useAppTheme();

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const hasStats = avgScore !== undefined && avgScore !== null;

  const sColor = hasStats
    ? avgScore! >= 700 ? colors.success
      : avgScore! >= 500 ? colors.warning
      : colors.danger
    : colors.mutedText;

  const trendIcon: keyof typeof Ionicons.glyphMap | null =
    trend === 'up' ? 'trending-up' :
    trend === 'down' ? 'trending-down' :
    trend === 'stable' ? 'remove-outline' : null;

  const trendColor =
    trend === 'up' ? colors.success :
    trend === 'down' ? colors.danger :
    colors.mutedText;

  return (
    <Card>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: hasStats ? sColor + '16' : colors.accentSoft }]}>
          <Text style={[styles.avatarText, { color: hasStats ? sColor : colors.accent }]}>{initials}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.classPill, { backgroundColor: colors.input }]}>
              <Ionicons name="school-outline" size={10} color={colors.mutedText} />
              <Text style={[styles.classText, { color: colors.mutedText }]} numberOfLines={1}>{className}</Text>
            </View>
            {essayCount !== undefined && (
              <View style={[styles.classPill, { backgroundColor: colors.input }]}>
                <Ionicons name="document-text-outline" size={10} color={colors.mutedText} />
                <Text style={[styles.classText, { color: colors.mutedText }]}>
                  {essayCount} {essayCount === 1 ? 'redação' : 'redações'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.scoreWrap}>
          {hasStats ? (
            <>
              <Text style={[styles.scoreNum, { color: sColor }]}>{avgScore}</Text>
              <Text style={[styles.scoreSub, { color: colors.mutedText }]}>pts</Text>
              {trendIcon ? (
                <Ionicons name={trendIcon} size={13} color={trendColor} />
              ) : null}
            </>
          ) : essayCount === 0 ? (
            <Text style={[styles.noScore, { color: colors.mutedText }]}>sem notas</Text>
          ) : (
            <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
              <Ionicons name="chevron-forward" size={15} color={colors.softText} />
            </View>
          )}
        </View>
      </Pressable>

      {(onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {onEdit && (
            <Pressable onPress={onEdit} style={[styles.actionBtn, { backgroundColor: colors.accentSoft }]} hitSlop={4}>
              <Ionicons name="pencil-outline" size={13} color={colors.accent} />
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>Editar</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={[styles.actionBtn, { backgroundColor: colors.dangerSoft }]} hitSlop={4}>
              <Ionicons name="trash-outline" size={13} color={colors.danger} />
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  content: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 21, fontFamily: 'Inter_700Bold' },
  metaRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  classText: { fontSize: 12, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  scoreWrap: { alignItems: 'flex-end', gap: 2 },
  scoreNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, lineHeight: 22, fontFamily: 'Nunito_800ExtraBold' },
  scoreSub: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  noScore: { fontSize: 13, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
