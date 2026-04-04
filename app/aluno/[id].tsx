import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import {
  competencyPct,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  getCompetencyFocusTip,
  getCompetencyLabel,
  getScoreColor,
  getScoreLabel,
  getStudentStats,
  getTrendColor,
  getTrendIcon,
  getTrendLabel,
  scorePct,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Paleta de cores única por competência
const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6', // azul — Norma Culta
  c2: '#8B5CF6', // violeta — Tema
  c3: '#10B981', // esmeralda — Argumentação
  c4: '#F59E0B', // âmbar — Coesão
  c5: '#F43F5E', // rosa — Intervenção
};

// Escala de cor mais granular por faixa de nota
function scoreGradientColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  if (score >= 400) return '#EF4444';
  return '#DC2626';
}

export default function AlunoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);
  const deleteEssay = useAppStore((state) => state.deleteEssay);

  const student = useMemo(() => students.find((s) => s.id === id), [students, id]);

  const studentEssays = useMemo(
    () => (student ? essays.filter((e) => e.studentId === student.id) : []),
    [essays, student]
  );

  const stats = useMemo(
    () => (student ? getStudentStats(student.id, essays) : null),
    [student, essays]
  );

  if (!student || !stats) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <AppHeader title="Aluno" subtitle="Aluno não encontrado." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Aluno não encontrado.</Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  const trendIcon = getTrendIcon(stats.trend);
  const trendColor = getTrendColor(stats.trend, colors);
  const trendLabel = getTrendLabel(stats.trend, Math.abs(stats.trendDelta));
  const avgColor = stats.averageScore ? getScoreColor(stats.averageScore, colors) : colors.text;
  const avgLabel = stats.averageScore ? getScoreLabel(stats.averageScore) : '';

  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const compList = compKeys
    .map((k) => ({ key: k, val: stats.avgCompetencies[k] }))
    .filter((c) => c.val > 0)
    .sort((a, b) => a.val - b.val);
  const focusAreas = compList.slice(0, 2);

  // Oldest first — for the evolution chart (left = first correction)
  const correctedSorted = [...studentEssays]
    .filter((e) => e.status === 'corrigida')
    .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));

  // Newest first — for the history list
  const sortedEssays = [...studentEssays].sort(
    (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  );

  function handleDeleteEssay(essay: Essay) {
    Alert.alert(
      'Apagar redação',
      `Deseja apagar a redação "${essay.themeTitle}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => deleteEssay(essay.id) },
      ]
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader eyebrow="ALUNO" title={student.name} subtitle={`Turma: ${student.className}`} />

        {/* ── Resumo geral ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>DESEMPENHO GERAL</Text>
          <View style={styles.statsRow}>
            <StatBlock label="REDAÇÕES" value={String(stats.totalEssays)} colors={colors} />
            <StatBlock label="CORRIGIDAS" value={String(stats.correctedEssays)} colors={colors} />
            <StatBlock label="PENDENTES" value={String(stats.pendingEssays)} colors={colors} />
          </View>

          {stats.averageScore !== null && (
            <View style={[styles.avgBlock, { borderTopColor: colors.border }]}>
              <View style={styles.avgLeft}>
                <Text style={[styles.sectionLabel, { color: colors.softText, marginBottom: 4 }]}>MÉDIA GERAL</Text>
                <Text style={[styles.avgScore, { color: avgColor }]}>{stats.averageScore}</Text>
                <Text style={[styles.avgLabel, { color: avgColor }]}>{avgLabel}</Text>
              </View>
              <View style={styles.avgRight}>
                {stats.highestScore !== null && (
                  <StatMini label="MELHOR" value={stats.highestScore} color={colors.success} colors={colors} />
                )}
                {stats.lowestScore !== null && (
                  <StatMini label="MENOR" value={stats.lowestScore} color={colors.danger} colors={colors} />
                )}
              </View>
            </View>
          )}

          {stats.scores.length >= 2 && (
            <View style={[styles.trendRow, { backgroundColor: colors.input, borderRadius: 4 }]}>
              <Ionicons name={trendIcon} size={18} color={trendColor} />
              <Text style={[styles.trendText, { color: colors.softText }]}>
                Tendência:{' '}
                <Text style={{ color: trendColor, fontWeight: '600' }}>{trendLabel}</Text>
              </Text>
            </View>
          )}

          {stats.lastCorrectedAt && (
            <Text style={[styles.lastDate, { color: colors.mutedText }]}>
              Última correção: {formatRelativeDate(stats.lastCorrectedAt)} ({formatDate(stats.lastCorrectedAt)})
            </Text>
          )}
        </Card>

        {/* ── Nova redação ── */}
        <Button
          title="Nova redação para este aluno"
          leftIcon="create-outline"
          onPress={() => router.push(`/nova-redacao?studentId=${student.id}` as any)}
        />

        {/* ── Evolução de notas ── */}
        {correctedSorted.length >= 2 && (
          <Card>
            <View style={styles.evoHeader}>
              <Text style={[styles.sectionLabel, { color: colors.softText, marginBottom: 0 }]}>
                EVOLUÇÃO DAS NOTAS
              </Text>
              <Text style={[styles.evoHint, { color: colors.mutedText }]}>
                mais antiga → mais recente
              </Text>
            </View>
            <EvoChart essays={correctedSorted} colors={colors} />
          </Card>
        )}

        {/* ── Competências ── */}
        {compList.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>MÉDIA POR COMPETÊNCIA</Text>
            <View style={styles.compList}>
              {compKeys.map((k) => {
                const val = stats.avgCompetencies[k];
                if (val === 0) return null;
                const pct = competencyPct(val);
                const barColor = COMP_COLORS[k] ?? '#3B82F6';
                const isWeakest = k === stats.weakestCompetency;
                return (
                  <View key={k} style={styles.compRow}>
                    <View style={styles.compLabelRow}>
                      <View style={[styles.compDot, { backgroundColor: barColor }]} />
                      <Text style={[styles.compName, { color: colors.text }]}>
                        {getCompetencyLabel(k, true)}
                      </Text>
                      {isWeakest && (
                        <View style={[styles.weakTag, { backgroundColor: colors.warningSoft }]}>
                          <Text style={[styles.weakTagText, { color: colors.warning }]}>Foco</Text>
                        </View>
                      )}
                      <Text style={[styles.compVal, { color: barColor }]}>{val}</Text>
                    </View>
                    <View style={[styles.compTrack, { backgroundColor: colors.input }]}>
                      <View style={[styles.compFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Áreas de foco ── */}
        {focusAreas.length > 0 && (
          <Card>
            <View style={styles.focusHeader}>
              <Ionicons name="bulb-outline" size={16} color={colors.accent} />
              <Text style={[styles.sectionLabel, { color: colors.softText, marginBottom: 0 }]}>ONDE FOCAR</Text>
            </View>
            <View style={styles.focusList}>
              {focusAreas.map((area) => {
                const areaColor = COMP_COLORS[area.key] ?? colors.warning;
                return (
                  <View key={area.key} style={[styles.focusItem, { borderColor: areaColor + '40', backgroundColor: areaColor + '10' }]}>
                    <View style={styles.focusTop}>
                      <View style={[styles.compDot, { backgroundColor: areaColor }]} />
                      <Text style={[styles.focusComp, { color: colors.text }]}>
                        {getCompetencyLabel(area.key)}
                      </Text>
                      <Text style={[styles.focusScore, { color: areaColor }]}>{area.val} pts</Text>
                    </View>
                    <Text style={[styles.focusTip, { color: colors.mutedText }]}>
                      {getCompetencyFocusTip(area.key)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Histórico de redações ── */}
        {sortedEssays.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>HISTÓRICO</Text>
            <View>
              {sortedEssays.map((essay, index) => (
                <EssayRow
                  key={essay.id}
                  essay={essay}
                  index={sortedEssays.length - index}
                  isLast={index === sortedEssays.length - 1}
                  onPress={() =>
                    essay.status === 'corrigida'
                      ? router.push(`/resultado/${essay.id}`)
                      : router.push(`/redacao/${essay.id}`)
                  }
                  onDelete={() => handleDeleteEssay(essay)}
                  colors={colors}
                />
              ))}
            </View>
          </Card>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatBlock({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function StatMini({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={styles.statMini}>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.statMiniVal, { color }]}>{value}</Text>
    </View>
  );
}

function EvoChart({ essays, colors }: { essays: Essay[]; colors: any }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.evoWrap, { minWidth: essays.length * 64 }]}>
        {essays.map((essay, i) => {
          const score = essay.totalScore ?? 0;
          const pct = scorePct(score);
          const barColor = scoreGradientColor(score);
          const prev = i > 0 ? (essays[i - 1].totalScore ?? 0) : null;
          const delta = prev !== null ? score - prev : null;
          const dateStr = essay.correctedAt ?? essay.createdAt;
          const dateLabel = dateStr
            ? new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            : `#${i + 1}`;
          return (
            <Pressable
              key={essay.id}
              onPress={() => router.push(`/resultado/${essay.id}` as any)}
              style={styles.evoBar}
            >
              {delta !== null ? (
                <Text style={[styles.evoDelta, { color: delta >= 0 ? '#22C55E' : '#EF4444' }]}>
                  {delta >= 0 ? '+' : ''}{delta}
                </Text>
              ) : (
                <Text style={[styles.evoDelta, { color: colors.mutedText }]}>—</Text>
              )}
              <Text style={[styles.evoScore, { color: colors.text }]}>{score}</Text>
              <View style={[styles.evoTrack, { backgroundColor: colors.input }]}>
                <View style={[styles.evoFill, { height: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.evoDate, { color: colors.mutedText }]}>{dateLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function EssayRow({ essay, index, isLast, onPress, onDelete, colors }: {
  essay: Essay; index: number; isLast: boolean; onPress: () => void; onDelete: () => void; colors: any;
}) {
  const isCorrected = essay.status === 'corrigida';
  const scoreColor = isCorrected && essay.totalScore ? scoreGradientColor(essay.totalScore) : colors.mutedText;
  const displayDate = essay.correctedAt ?? essay.createdAt;

  return (
    <View
      style={[
        styles.essayRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {/* Left: index number */}
      <View style={[styles.essayIndex, { backgroundColor: colors.input }]}>
        <Text style={[styles.essayIndexNum, { color: colors.softText }]}>{index}</Text>
      </View>

      {/* Center: info */}
      <Pressable onPress={onPress} style={styles.essayInfo}>
        <Text style={[styles.essayTheme, { color: colors.text }]} numberOfLines={2}>
          {essay.themeTitle}
        </Text>
        <View style={styles.essayMeta}>
          <StatusBadge status={essay.status} />
        </View>
        {displayDate ? (
          <Text style={[styles.essayDateTime, { color: colors.mutedText }]}>
            {isCorrected ? 'Corrigida ' : 'Enviada '}
            {formatRelativeDate(displayDate)}
            {'  ·  '}
            {formatDateTime(displayDate)}
          </Text>
        ) : null}
      </Pressable>

      {/* Right: score + delete */}
      <View style={styles.essayRight}>
        <Text style={[styles.essayScore, { color: scoreColor }]}>
          {isCorrected && typeof essay.totalScore === 'number' ? essay.totalScore : '--'}
        </Text>
        <Text style={[styles.essayScoreLabel, { color: colors.mutedText }]}>
          {isCorrected ? 'pts' : ''}
        </Text>
        <Pressable
          onPress={onDelete}
          style={[styles.deleteBtn, { backgroundColor: colors.input }]}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 12 },
  evoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  evoHint: { fontSize: 11, lineHeight: 16 },
  emptyText: { fontSize: 15, lineHeight: 24 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 0 },
  statBlock: { flex: 1, gap: 4, alignItems: 'center' },
  statLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6 },
  statValue: { fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' },
  statMini: { gap: 2, alignItems: 'flex-end' },
  statMiniVal: { fontSize: 22, lineHeight: 26, fontWeight: '700' },
  // Avg
  avgBlock: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 16, marginTop: 16, borderTopWidth: 1 },
  avgLeft: { flex: 1 },
  avgScore: { fontSize: 52, lineHeight: 52, fontWeight: '700', letterSpacing: -1.6 },
  avgLabel: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  avgRight: { gap: 8 },
  // Trend
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 12 },
  trendText: { fontSize: 13, lineHeight: 20 },
  lastDate: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  // Evo chart
  evoWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  evoBar: { width: 56, alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' },
  evoDelta: { fontSize: 10, fontWeight: '700' },
  evoScore: { fontSize: 11, fontWeight: '700' },
  evoTrack: { width: '85%', flex: 1, borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  evoFill: { width: '100%', borderRadius: 3 },
  evoDate: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  // Competencies
  compList: { gap: 12 },
  compRow: { gap: 6 },
  compLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compDot: { width: 8, height: 8, borderRadius: 4 },
  compName: { flex: 1, fontSize: 13, lineHeight: 20 },
  compVal: { fontSize: 15, fontWeight: '700' },
  compTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 4 },
  weakTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  weakTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  // Focus
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  focusList: { gap: 12 },
  focusItem: { borderWidth: 1, borderRadius: 6, padding: 12, gap: 6 },
  focusTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusComp: { flex: 1, fontSize: 13, fontWeight: '600' },
  focusScore: { fontSize: 13, fontWeight: '700' },
  focusTip: { fontSize: 13, lineHeight: 20 },
  // Essay rows
  essayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 16 },
  essayIndex: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  essayIndexNum: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  essayInfo: { flex: 1, gap: 6 },
  essayTheme: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  essayMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  essayDateTime: { fontSize: 11, lineHeight: 16 },
  essayRight: { alignItems: 'flex-end', gap: 4, minWidth: 44 },
  essayScore: { fontSize: 24, lineHeight: 26, fontWeight: '700', textAlign: 'right', letterSpacing: -0.5 },
  essayScoreLabel: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', textAlign: 'right' },
  deleteBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
