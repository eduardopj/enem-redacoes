import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyCard } from './EmptyCard';
import { MEDAL_BORDER, MEDAL_LABEL, PERIOD_COLOR, PERIOD_ICON, scoreColor, type TurmaRankingEntry } from './ranking-helpers';
import { SummaryChip } from './SummaryChip';

type Props = {
  turmaRanking: TurmaRankingEntry[];
  colors: AppColors;
};

function TurmaPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '18' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function TurmaStatChip({ icon, value, label, color, colors }: { icon: any; value: string; label: string; color: string; colors: AppColors }) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

export function TurmaRanking({ turmaRanking, colors }: Props) {
  if (turmaRanking.length === 0) {
    return (
      <EmptyCard
        icon="school-outline"
        title="Nenhuma turma ainda"
        text="Crie turmas e cadastre alunos para ver a comparação entre turmas."
        colors={colors}
        action={{ label: 'Criar turma', onPress: () => router.push('/nova-turma' as any) }}
      />
    );
  }

  return (
    <>
      {/* Overview summary */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
        <SummaryChip label="Turmas" value={String(turmaRanking.length)} color={colors.accent} colors={colors} />
        <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
        <SummaryChip
          label="Melhor turma"
          value={turmaRanking[0]?.avg !== null ? String(turmaRanking[0]?.avg) : '—'}
          color={turmaRanking[0]?.avg ? scoreColor(turmaRanking[0].avg, colors) : colors.mutedText}
          colors={colors}
        />
        <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
        <SummaryChip
          label="Total redações"
          value={String(turmaRanking.reduce((s, t) => s + t.essayCount, 0))}
          color={colors.success}
          colors={colors}
        />
      </View>

      {/* Turma cards */}
      {turmaRanking.map((item, i) => {
        const { turma, avg, studentCount, essayCount, pctAbove700, pending, best } = item;
        const pColor = turma.period ? PERIOD_COLOR[turma.period] : colors.accent;
        const pIcon = turma.period ? PERIOD_ICON[turma.period] : 'school-outline';
        const isTop = i === 0 && avg !== null;
        return (
          <Pressable
            key={turma.id}
            onPress={() => router.push(`/turma/${turma.id}` as any)}
            style={[
              styles.turmaCard,
              { backgroundColor: colors.surface },
              isTop && { borderWidth: 2, borderColor: MEDAL_BORDER[0] + '80' },
            ]}
          >
            {/* Top row */}
            <View style={styles.turmaCardTop}>
              <View style={[styles.turmaRankBadge, { backgroundColor: i < 3 ? MEDAL_BORDER[i] + '18' : colors.input }]}>
                <Text style={[styles.turmaRankText, { color: i < 3 ? MEDAL_BORDER[i] : colors.softText }]}>
                  {i < 3 ? MEDAL_LABEL[i] : `${i + 1}º`}
                </Text>
              </View>
              <View style={[styles.turmaPeriodIcon, { backgroundColor: pColor + '18' }]}>
                <Ionicons name={pIcon as any} size={16} color={pColor} />
              </View>
              <View style={styles.turmaCardInfo}>
                <Text style={[styles.turmaCardName, { color: colors.text }]}>{turma.name}</Text>
                <View style={styles.turmaCardMeta}>
                  {turma.period && <TurmaPill label={turma.period.charAt(0).toUpperCase() + turma.period.slice(1)} color={pColor} />}
                  {turma.year && <TurmaPill label={turma.year} color={colors.mutedText} />}
                </View>
              </View>
              {avg !== null ? (
                <View style={styles.turmaAvgBlock}>
                  <Text style={[styles.turmaAvgValue, { color: scoreColor(avg, colors) }]}>{avg}</Text>
                  <Text style={[styles.turmaAvgSub, { color: colors.mutedText }]}>pts</Text>
                </View>
              ) : (
                <Text style={[styles.turmaNoScore, { color: colors.mutedText }]}>sem notas</Text>
              )}
            </View>

            {/* Stats row */}
            <View style={[styles.turmaStatsRow, { borderTopColor: colors.border }]}>
              <TurmaStatChip icon="people" value={String(studentCount)} label="Alunos" color={colors.accent} colors={colors} />
              <TurmaStatChip icon="document-text" value={String(essayCount)} label="Redações" color={colors.info} colors={colors} />
              {best !== null && <TurmaStatChip icon="star" value={String(best)} label="Melhor" color={colors.warning} colors={colors} />}
              <TurmaStatChip icon="checkmark-circle" value={`${pctAbove700}%`} label="≥700pts" color={pctAbove700 >= 50 ? colors.success : colors.warning} colors={colors} />
            </View>

            {/* Pending alert */}
            {pending > 0 && (
              <View style={[styles.pendingRow, { backgroundColor: colors.warning + '14' }]}>
                <Ionicons name="time-outline" size={12} color={colors.warning} />
                <Text style={[styles.pendingText, { color: colors.warning }]}>
                  {pending} redaç{pending !== 1 ? 'ões' : 'ão'} aguardando correção
                </Text>
              </View>
            )}

            {/* Best label */}
            {isTop && (
              <View style={[styles.topTurmaBadge, { backgroundColor: MEDAL_BORDER[0] + '18' }]}>
                <Ionicons name="trophy" size={12} color={MEDAL_BORDER[0]} />
                <Text style={[styles.topTurmaText, { color: MEDAL_BORDER[0] }]}>Melhor turma</Text>
              </View>
            )}

            <View style={styles.chevronRow}>
              <Text style={[styles.viewLabel, { color: colors.accent }]}>Ver painel</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.accent} />
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '600' },
  summaryBar: {
    flexDirection: 'row', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  summaryDiv: { width: 1, marginVertical: 4 },
  turmaCard: {
    borderRadius: 18, padding: 18, gap: 14,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  turmaCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  turmaRankBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaRankText: { fontSize: 16, fontWeight: '700' },
  turmaPeriodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaCardInfo: { flex: 1, gap: 5 },
  turmaCardName: { fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  turmaCardMeta: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  turmaAvgBlock: { alignItems: 'flex-end' },
  turmaAvgValue: { fontSize: 24, fontWeight: '800', letterSpacing: 0 },
  turmaAvgSub: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  turmaNoScore: { fontSize: 12, fontWeight: '500' },
  turmaStatsRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  statChip: { flex: 1, alignItems: 'center', gap: 3 },
  statIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', letterSpacing: 0 },
  statLabel: { fontSize: 9, fontWeight: '500' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  pendingText: { fontSize: 11, fontWeight: '600' },
  topTurmaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  topTurmaText: { fontSize: 11, fontWeight: '700' },
  chevronRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewLabel: { fontSize: 12, fontWeight: '600' },
});
