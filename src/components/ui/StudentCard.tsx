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
  onDelete?: () => void;
};

function scoreColor(score: number): string {
  if (score >= 800) return '#22C55E';
  if (score >= 600) return '#EAB308';
  if (score >= 400) return '#F97316';
  return '#EF4444';
}

function trendMeta(trend: 'up' | 'down' | 'stable'): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  if (trend === 'up') return { icon: 'trending-up', color: '#22C55E' };
  if (trend === 'down') return { icon: 'trending-down', color: '#EF4444' };
  return { icon: 'remove-outline', color: '#8E9AB8' };
}

export function StudentCard({
  name,
  className,
  avgScore,
  essayCount,
  trend,
  onPress,
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
  const sColor = hasStats ? scoreColor(avgScore!) : colors.mutedText;
  const tm = trend ? trendMeta(trend) : null;

  return (
    <Card>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.mainArea}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: hasStats ? sColor + '20' : colors.accent + '18' }]}>
            <Text style={[styles.avatarText, { color: hasStats ? sColor : colors.accent }]}>{initials}</Text>
          </View>

          {/* Info */}
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

          {/* Score + trend */}
          <View style={styles.scoreWrap}>
            {hasStats ? (
              <>
                <Text style={[styles.scoreNum, { color: sColor }]}>{avgScore}</Text>
                <Text style={[styles.scoreSub, { color: colors.mutedText }]}>pts</Text>
                {tm && (
                  <Ionicons name={tm.icon} size={14} color={tm.color} />
                )}
              </>
            ) : essayCount === 0 ? (
              <Text style={[styles.noScore, { color: colors.mutedText }]}>sem notas</Text>
            ) : (
              <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.softText} />
              </View>
            )}
          </View>
        </Pressable>

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.dangerSoft }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { gap: theme.spacing.sm },
  mainArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  content: { flex: 1, gap: 5 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20, letterSpacing: -0.1 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  classText: { fontSize: 11, fontWeight: '500' },
  scoreWrap: { alignItems: 'flex-end', gap: 2 },
  scoreNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 24 },
  scoreSub: { fontSize: 10, fontWeight: '600' },
  noScore: { fontSize: 11, fontWeight: '500' },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
