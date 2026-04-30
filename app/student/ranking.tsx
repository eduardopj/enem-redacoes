import { StudentRoute } from '@/components/auth/StudentRoute';
import { Card, EmptyState, ScreenContainer, StaggerItem } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay, Student } from '@/types/app';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RankEntry = {
  student: Student;
  avg: number | null;
  best: number | null;
  count: number;
  essays: Essay[];
};

function calcRankEntries(students: Student[], essays: Essay[], teacherId: string): RankEntry[] {
  const teacherStudents = students.filter(s => s.teacherId === teacherId);
  return teacherStudents.map(student => {
    const studentEssays = essays.filter(e => e.studentId === student.id && e.status === 'corrigida' && e.totalScore != null);
    const scores = studentEssays.map(e => e.totalScore!);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores) : null;
    return { student, avg, best, count: studentEssays.length, essays: studentEssays };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
}

function getMedalColor(rank: number): string {
  if (rank === 1) return '#F59E0B';
  if (rank === 2) return '#94A3B8';
  if (rank === 3) return '#CD7F32';
  return 'transparent';
}

function getMedalIcon(rank: number): 'trophy' | 'medal' | null {
  if (rank <= 3) return rank === 1 ? 'trophy' : 'medal';
  return null;
}

function getScoreLabel(score: number): string {
  if (score >= 900) return 'Excelente';
  if (score >= 750) return 'Muito bom';
  if (score >= 600) return 'Bom';
  if (score >= 450) return 'Regular';
  return 'Insuficiente';
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type SortKey = 'avg' | 'best' | 'count';

export default function StudentRankingScreen() {
  const { colors } = useAppTheme();
  const currentStudent = useAppStore(s => s.currentStudent);
  const students = useAppStore(s => s.students);
  const essays = useAppStore(s => s.essays);

  const [sortKey, setSortKey] = useState<SortKey>('avg');

  const teacherId = currentStudent?.teacherId ?? '';

  const rankEntries = useMemo(() => {
    const entries = calcRankEntries(students, essays, teacherId);
    if (sortKey === 'best') return [...entries].sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
    if (sortKey === 'count') return [...entries].sort((a, b) => b.count - a.count);
    return entries;
  }, [students, essays, teacherId, sortKey]);

  const myEntry = useMemo(
    () => rankEntries.find(e => e.student.id === currentStudent?.studentId),
    [rankEntries, currentStudent]
  );

  const myRank = useMemo(
    () => rankEntries.findIndex(e => e.student.id === currentStudent?.studentId) + 1,
    [rankEntries, currentStudent]
  );

  const participantsWithScore = rankEntries.filter(e => e.avg != null).length;

  if (rankEntries.length === 0) {
    return (
      <StudentRoute>
        <ScreenContainer showStudentNav>
          <View style={styles.titleRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Ranking</Text>
            <Text style={[styles.title, { color: colors.text }]}>Ranking</Text>
          </View>
          <EmptyState
            icon="trophy-outline"
            title="Ranking ainda vazio"
            description="Envie redações para aparecer no ranking com seus colegas."
            buttonLabel="Enviar redação"
            onPress={() => router.push('/student/nova' as any)}
          />
        </ScreenContainer>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <ScreenContainer showStudentNav>

        {/* Title */}
        <StaggerItem index={0}>
          <View style={styles.titleRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Ranking</Text>
            <Text style={[styles.title, { color: colors.text }]}>Ranking</Text>
          </View>
        </StaggerItem>

        {/* My position card */}
        {myEntry && myEntry.avg != null && (
          <StaggerItem index={1}>
            <View style={[styles.myCard, {
              backgroundColor: getScoreColor(myEntry.avg, colors) + '0C',
              borderColor: getScoreColor(myEntry.avg, colors) + '30',
            }]}>
              <View style={styles.myCardLeft}>
                <Text style={[styles.myRankNum, { color: getScoreColor(myEntry.avg, colors) }]}>#{myRank}</Text>
                <Text style={[styles.myRankLabel, { color: colors.mutedText }]}>sua posição</Text>
              </View>
              <View style={[styles.myCardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.myCardStats}>
                <View style={styles.myStatItem}>
                  <Text style={[styles.myStatNum, { color: getScoreColor(myEntry.avg, colors) }]}>{myEntry.avg}</Text>
                  <Text style={[styles.myStatLabel, { color: colors.mutedText }]}>média</Text>
                </View>
                <View style={styles.myStatItem}>
                  <Text style={[styles.myStatNum, { color: colors.text }]}>{myEntry.best ?? '--'}</Text>
                  <Text style={[styles.myStatLabel, { color: colors.mutedText }]}>melhor</Text>
                </View>
                <View style={styles.myStatItem}>
                  <Text style={[styles.myStatNum, { color: colors.text }]}>{myEntry.count}</Text>
                  <Text style={[styles.myStatLabel, { color: colors.mutedText }]}>redações</Text>
                </View>
              </View>
              {participantsWithScore > 1 && (
                <View style={[styles.myPercentile, { backgroundColor: getScoreColor(myEntry.avg, colors) + '14' }]}>
                  <Text style={[styles.myPercentileText, { color: getScoreColor(myEntry.avg, colors) }]}>
                    Top {Math.ceil((myRank / participantsWithScore) * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </StaggerItem>
        )}

        {/* Sort bar */}
        <StaggerItem index={2}>
          <View style={styles.sortRow}>
            <Text style={[styles.sortLabel, { color: colors.mutedText }]}>{participantsWithScore} participantes</Text>
            <View style={styles.sortBtns}>
              {([
                { key: 'avg', label: 'Média' },
                { key: 'best', label: 'Melhor nota' },
                { key: 'count', label: 'Redações' },
              ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setSortKey(key)}
                  style={[styles.sortBtn, {
                    backgroundColor: sortKey === key ? colors.accent : colors.input,
                    borderColor: sortKey === key ? colors.accent : colors.border,
                  }]}
                >
                  <Text style={[styles.sortBtnText, { color: sortKey === key ? '#fff' : colors.softText }]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </StaggerItem>

        {/* Podium — top 3 */}
        {participantsWithScore >= 3 && (
          <StaggerItem index={3}>
            <Card>
              <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                <Ionicons name="trophy-outline" size={14} color="#F59E0B" />
                <Text style={[styles.sectionLabel, { color: colors.softText }]}>Pódio</Text>
              </View>
              <View style={styles.podium}>
                {[1, 0, 2].map((idx) => {
                  const entry = rankEntries[idx];
                  if (!entry || entry.avg == null) return null;
                  const rank = idx + 1;
                  const isMe = entry.student.id === currentStudent?.studentId;
                  const medalColor = getMedalColor(rank);
                  const heights = [80, 60, 50];
                  return (
                    <View key={entry.student.id} style={[styles.podiumItem, { alignItems: 'center' }]}>
                      {rank === 1 && <Ionicons name="trophy" size={20} color={medalColor} style={{ marginBottom: 4 }} />}
                      <View style={[styles.podiumAvatar, {
                        backgroundColor: isMe ? colors.accent + '18' : colors.input,
                        borderColor: isMe ? colors.accent : medalColor !== 'transparent' ? medalColor : colors.border,
                        borderWidth: isMe ? 2.5 : 1.5,
                      }]}>
                        <Text style={[styles.podiumInitials, { color: isMe ? colors.accent : colors.softText }]}>
                          {getInitials(entry.student.name)}
                        </Text>
                        {isMe && (
                          <View style={[styles.youBadge, { backgroundColor: colors.accent }]}>
                            <Text style={styles.youBadgeText}>você</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                        {entry.student.name.split(' ')[0]}
                      </Text>
                      <View style={[styles.podiumBase, {
                        height: heights[idx === 0 ? 1 : idx === 1 ? 0 : 2],
                        backgroundColor: medalColor !== 'transparent' ? medalColor + '20' : colors.input,
                        borderTopColor: medalColor !== 'transparent' ? medalColor : colors.border,
                      }]}>
                        <Text style={[styles.podiumRankNum, { color: medalColor !== 'transparent' ? medalColor : colors.mutedText }]}>
                          #{rank}
                        </Text>
                        <Text style={[styles.podiumScore, { color: getScoreColor(entry.avg, colors) }]}>
                          {entry.avg}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </StaggerItem>
        )}

        {/* Full list */}
        <StaggerItem index={4}>
          <Card>
            <View style={[styles.sectionHeader, { marginBottom: 0 }]}>
              <Ionicons name="list-outline" size={14} color={colors.accent} />
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>Classificação geral</Text>
            </View>

            {rankEntries.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = entry.student.id === currentStudent?.studentId;
              const medalColor = getMedalColor(rank);
              const hasScore = entry.avg != null;

              return (
                <View
                  key={entry.student.id}
                  style={[
                    styles.rankRow,
                    { borderBottomColor: colors.border },
                    isMe && { backgroundColor: colors.accent + '08' },
                    idx < rankEntries.length - 1 && { borderBottomWidth: 1 },
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankNumWrap}>
                    {medalColor !== 'transparent' ? (
                      <Ionicons name={getMedalIcon(rank)!} size={16} color={medalColor} />
                    ) : (
                      <Text style={[styles.rankNum, { color: hasScore ? colors.softText : colors.mutedText }]}>
                        {hasScore ? rank : '—'}
                      </Text>
                    )}
                  </View>

                  {/* Avatar */}
                  <View style={[styles.avatar, {
                    backgroundColor: isMe ? colors.accent + '18' : colors.input,
                    borderColor: isMe ? colors.accent : colors.border,
                  }]}>
                    <Text style={[styles.avatarText, { color: isMe ? colors.accent : colors.softText }]}>
                      {getInitials(entry.student.name)}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.rankNameRow}>
                      <Text style={[styles.rankName, { color: colors.text }]} numberOfLines={1}>
                        {entry.student.name}
                      </Text>
                      {isMe && (
                        <View style={[styles.youTag, { backgroundColor: colors.accent }]}>
                          <Text style={styles.youTagText}>você</Text>
                        </View>
                      )}
                    </View>
                    {hasScore ? (
                      <Text style={[styles.rankMeta, { color: colors.mutedText }]}>
                        {entry.count} redação{entry.count !== 1 ? 'ões' : ''} • melhor: {entry.best}
                      </Text>
                    ) : (
                      <Text style={[styles.rankMeta, { color: colors.mutedText }]}>Sem redações corrigidas</Text>
                    )}
                  </View>

                  {/* Score */}
                  {hasScore && (
                    <View style={[styles.rankScoreWrap, { backgroundColor: getScoreColor(entry.avg!, colors) + '12' }]}>
                      <Text style={[styles.rankScore, { color: getScoreColor(entry.avg!, colors) }]}>{entry.avg}</Text>
                      <Text style={[styles.rankScoreLabel, { color: getScoreColor(entry.avg!, colors) + '99' }]}>
                        {getScoreLabel(entry.avg!)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        </StaggerItem>

      </ScreenContainer>
    </StudentRoute>
  );
}

const styles = StyleSheet.create({
  titleRow: { paddingTop: 4, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0, lineHeight: 32 },

  myCard: {
    borderRadius: 18, borderWidth: 1.5, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  myCardLeft: { alignItems: 'center', minWidth: 52 },
  myRankNum: { fontSize: 32, fontWeight: '800', letterSpacing: 0, lineHeight: 36 },
  myRankLabel: { fontSize: 10, fontWeight: '600' },
  myCardDivider: { width: 1, height: 44 },
  myCardStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  myStatItem: { alignItems: 'center', gap: 2 },
  myStatNum: { fontSize: 18, fontWeight: '800', letterSpacing: 0 },
  myStatLabel: { fontSize: 9, fontWeight: '600' },
  myPercentile: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  myPercentileText: { fontSize: 11, fontWeight: '800' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sortLabel: { fontSize: 12, fontWeight: '500', flex: 1 },
  sortBtns: { flexDirection: 'row', gap: 6 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  sortBtnText: { fontSize: 11, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  podiumItem: { flex: 1 },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, alignSelf: 'center',
  },
  podiumInitials: { fontSize: 14, fontWeight: '700' },
  youBadge: {
    position: 'absolute', bottom: -4, right: -4,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999,
  },
  youBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  podiumName: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  podiumBase: {
    width: '100%', borderTopWidth: 2, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 6,
  },
  podiumRankNum: { fontSize: 11, fontWeight: '700' },
  podiumScore: { fontSize: 16, fontWeight: '800', letterSpacing: 0 },

  // List
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4 },
  rankNumWrap: { width: 24, alignItems: 'center' },
  rankNum: { fontSize: 13, fontWeight: '700' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  avatarText: { fontSize: 12, fontWeight: '700' },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  youTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  youTagText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  rankMeta: { fontSize: 11, lineHeight: 16 },
  rankScoreWrap: { borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 52 },
  rankScore: { fontSize: 16, fontWeight: '800', letterSpacing: 0, lineHeight: 20 },
  rankScoreLabel: { fontSize: 9, fontWeight: '600' },
});
