import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyCard } from './EmptyCard';
import { MEDAL_BG, MEDAL_BORDER, MEDAL_LABEL, type RankingEntry, scoreColor } from './ranking-helpers';
import { SummaryChip } from './SummaryChip';

type Props = {
  classes: string[];
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  ranking: RankingEntry[];
  classAvg: number | null;
  colors: AppColors;
};

function PodiumCard({ rank, entry, height, medalBg, medalBorder, medal, colors }: {
  rank: number; entry: RankingEntry; height: number; medalBg: string; medalBorder: string; medal: string; colors: AppColors;
}) {
  const color = entry.average !== null ? scoreColor(entry.average, colors) : colors.mutedText;
  const initials = entry.student.name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  return (
    <View style={[styles.podiumItem, { flex: rank === 1 ? 1.2 : 1 }]}>
      <Text style={styles.podiumMedal}>{medal}</Text>
      <View style={[styles.podiumAvatar, { backgroundColor: medalBorder + '22', borderColor: medalBorder }]}>
        <Text style={[styles.podiumInitials, { color: medalBorder }]}>{initials}</Text>
      </View>
      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
        {entry.student.name.split(' ')[0]}
      </Text>
      <View style={[styles.podiumBase, { height, backgroundColor: medalBg, borderColor: medalBorder + '50' }]}>
        <Text style={[styles.podiumScore, { color }]}>{entry.average}</Text>
        <Text style={[styles.podiumScoreSub, { color: colors.mutedText }]}>pts</Text>
      </View>
    </View>
  );
}

export function StudentRanking({ classes, selectedClass, setSelectedClass, ranking, classAvg, colors }: Props) {
  const top3 = ranking.slice(0, 3).filter((r) => r.average !== null);

  return (
    <>
      {/* Class filter */}
      {classes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {classes.map((cls) => (
            <Pressable
              key={cls}
              onPress={() => setSelectedClass(cls)}
              style={[styles.tab, selectedClass === cls
                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                : { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <Text style={[styles.tabText, { color: selectedClass === cls ? '#fff' : colors.softText }]}>{cls}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {ranking.length === 0 ? (
        <EmptyCard
          icon="people-outline"
          title="Nenhum aluno ainda"
          text="Cadastre alunos e corrija redações para ver o ranking."
          colors={colors}
        />
      ) : (
        <>
          {classAvg !== null && (
            <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
              <SummaryChip label="Média" value={String(classAvg)} color={scoreColor(classAvg, colors)} colors={colors} />
              <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
              <SummaryChip label="Alunos" value={String(ranking.length)} color={colors.accent} colors={colors} />
              <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
              <SummaryChip label="Com notas" value={String(ranking.filter((r) => r.average !== null).length)} color={colors.success} colors={colors} />
            </View>
          )}

          {top3.length >= 2 && (
            <View style={styles.podium}>
              {top3[1] && <PodiumCard rank={2} entry={top3[1]} height={100} medalBg={MEDAL_BG[1]} medalBorder={MEDAL_BORDER[1]} medal={MEDAL_LABEL[1]} colors={colors} />}
              {top3[0] && <PodiumCard rank={1} entry={top3[0]} height={128} medalBg={MEDAL_BG[0]} medalBorder={MEDAL_BORDER[0]} medal={MEDAL_LABEL[0]} colors={colors} />}
              {top3[2] && <PodiumCard rank={3} entry={top3[2]} height={80} medalBg={MEDAL_BG[2]} medalBorder={MEDAL_BORDER[2]} medal={MEDAL_LABEL[2]} colors={colors} />}
            </View>
          )}

          <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.listTitle, { color: colors.softText }]}>Classificação completa</Text>
            {ranking.map((entry, i) => {
              const isTop3 = i < 3;
              const avg = entry.average;
              const color = avg !== null ? scoreColor(avg, colors) : colors.mutedText;
              return (
                <Pressable
                  key={entry.student.id}
                  onPress={() => router.push(`/aluno/${entry.student.id}` as any)}
                  style={[styles.listRow, i < ranking.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.posWrap, isTop3 ? { backgroundColor: MEDAL_BORDER[i] + '18' } : { backgroundColor: colors.input }]}>
                    <Text style={[styles.posText, { color: isTop3 ? MEDAL_BORDER[i] : colors.softText }]}>
                      {isTop3 ? MEDAL_LABEL[i] : `${i + 1}`}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>{entry.student.name}</Text>
                    <View style={styles.listMeta}>
                      <Text style={[styles.listMetaText, { color: colors.mutedText }]}>{entry.totalEssays} redaç{entry.totalEssays !== 1 ? 'ões' : 'ão'}</Text>
                      {entry.best !== null && <Text style={[styles.listMetaText, { color: colors.mutedText }]}>· Melhor: {entry.best}</Text>}
                    </View>
                  </View>
                  <View style={styles.listRight}>
                    {avg !== null ? (
                      <>
                        <View style={styles.listScoreRow}>
                          <Ionicons name={entry.trend.name as any} size={14} color={entry.trend.color} />
                          <Text style={[styles.listScore, { color }]}>{avg}</Text>
                        </View>
                        <Text style={[styles.listScoreSub, { color: colors.mutedText }]}>média</Text>
                      </>
                    ) : (
                      <Text style={[styles.listNone, { color: colors.mutedText }]}>sem notas</Text>
                    )}
                    <Ionicons name="chevron-forward" size={14} color={colors.border} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flexGrow: 0 },
  tabContent: { gap: 8, paddingVertical: 2 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },
  summaryBar: {
    flexDirection: 'row', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  summaryDiv: { width: 1, marginVertical: 4 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingTop: 8 },
  podiumItem: { alignItems: 'center', gap: 6 },
  podiumMedal: { fontSize: 22 },
  podiumAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  podiumInitials: { fontSize: 16, fontWeight: '800' },
  podiumName: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  podiumBase: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  podiumScore: { fontSize: 20, fontWeight: '700', letterSpacing: 0 },
  podiumScoreSub: { fontSize: 10, fontWeight: '600' },
  listCard: {
    borderRadius: 18, padding: 18,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2, gap: 2,
  },
  listTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0, marginBottom: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  posWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posText: { fontSize: 14, fontWeight: '700' },
  listInfo: { flex: 1, gap: 3 },
  listName: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  listMeta: { flexDirection: 'row', gap: 4 },
  listMetaText: { fontSize: 11, lineHeight: 16 },
  listRight: { alignItems: 'flex-end', gap: 2 },
  listScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listScore: { fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  listScoreSub: { fontSize: 10, fontWeight: '600' },
  listNone: { fontSize: 11 },
});
