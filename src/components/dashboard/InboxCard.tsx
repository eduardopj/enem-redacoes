import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  inboxEssays: Essay[];
  getStudentName: (studentId: string) => string;
};

export function InboxCard({ inboxEssays, getStudentName }: Props) {
  const { colors } = useAppTheme();

  if (inboxEssays.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push('/correcoes')}
      style={[styles.inboxCard, { backgroundColor: colors.surface, borderColor: colors.warning + '55' }]}
    >
      {/* Header */}
      <View style={styles.inboxHeader}>
        <View style={[styles.inboxIconWrap, { backgroundColor: colors.warning + '18' }]}>
          <Ionicons name="mail-unread-outline" size={18} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inboxTitle, { color: colors.text }]}>Para revisar</Text>
          <Text style={[styles.inboxSub, { color: colors.mutedText }]}>Redações corrigidas pela IA</Text>
        </View>
        <View style={[styles.inboxBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.inboxBadgeText}>{inboxEssays.length}</Text>
        </View>
      </View>

      {/* Essay rows */}
      <View style={[styles.inboxDivider, { backgroundColor: colors.border }]} />
      {inboxEssays.slice(0, 3).map((essay, i) => (
        <Pressable
          key={essay.id}
          onPress={() => router.push(`/resultado/${essay.id}`)}
          style={[
            styles.inboxRow,
            i < Math.min(inboxEssays.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}
        >
          <View style={[styles.inboxRowDot, { backgroundColor: colors.warning }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.inboxRowStudent, { color: colors.text }]} numberOfLines={1}>
              {getStudentName(essay.studentId)}
            </Text>
            <Text style={[styles.inboxRowTheme, { color: colors.mutedText }]} numberOfLines={1}>
              {essay.themeTitle}
            </Text>
          </View>
          {essay.totalScore != null ? (
            <Text style={[styles.inboxRowScore, { color: getScoreColor(essay.totalScore, colors) }]}>
              {essay.totalScore}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
        </Pressable>
      ))}

      {inboxEssays.length > 3 ? (
        <View style={styles.inboxMoreRow}>
          <Text style={[styles.inboxMoreText, { color: colors.accent }]}>
            +{inboxEssays.length - 3} mais — Ver todas
          </Text>
          <Ionicons name="arrow-forward" size={13} color={colors.accent} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inboxCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inboxIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inboxTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  inboxSub: { fontSize: 14, lineHeight: 20 },
  inboxBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inboxBadgeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  inboxDivider: { height: 1, marginHorizontal: 0 },
  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inboxRowDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  inboxRowStudent: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  inboxRowTheme: { fontSize: 13, lineHeight: 19 },
  inboxRowScore: { fontSize: 15, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  inboxMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  inboxMoreText: { fontSize: 14, fontWeight: '600' },
});
