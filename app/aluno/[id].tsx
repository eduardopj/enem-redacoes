import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
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

const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

const COMP_LEVEL: Record<number, string> = {
  200: 'Excelente',
  160: 'Bom',
  120: 'Regular',
  80: 'Insuficiente',
  40: 'Fraco',
  0: 'Zerado',
};

function compLevel(val: number): string {
  const bands = [200, 160, 120, 80, 40, 0];
  const band = bands.find((b) => val >= b) ?? 0;
  return COMP_LEVEL[band] ?? '';
}

function scoreGradientColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  if (score >= 400) return '#EF4444';
  return '#DC2626';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const NATIONAL_AVG = 624;

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

  const correctedSorted = [...studentEssays]
    .filter((e) => e.status === 'corrigida')
    .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));

  const sortedEssays = [...studentEssays].sort(
    (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  );

  const aboveNational =
    stats.averageScore !== null ? stats.averageScore - NATIONAL_AVG : null;

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
        <AppHeader eyebrow="Aluno" title={student.name} subtitle={`Turma: ${student.className}`} />

        {/* ── Hero do aluno ── */}
        <Card>
          <View style={styles.heroRow}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
            </View>

            {/* Info */}
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: colors.text }]}>{student.name}</Text>
              <View style={styles.heroMeta}>
                <View style={[styles.heroPill, { backgroundColor: colors.input }]}>
                  <Ionicons name="school-outline" size={11} color={colors.mutedText} />
                  <Text style={[styles.heroPillText, { color: colors.mutedText }]}>{student.className}</Text>
                </View>
                <View style={[styles.heroPill, { backgroundColor: colors.input }]}>
                  <Ionicons name="document-text-outline" size={11} color={colors.mutedText} />
                  <Text style={[styles.heroPillText, { color: colors.mutedText }]}>
                    {stats.totalEssays} redaç{stats.totalEssays === 1 ? 'ão' : 'ões'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Nota grande */}
            {stats.averageScore !== null && (
              <View style={styles.heroScore}>
                <Text style={[styles.heroScoreNum, { color: avgColor }]}>{stats.averageScore}</Text>
                <Text style={[styles.heroScoreSub, { color: colors.mutedText }]}>média</Text>
              </View>
            )}
          </View>

          {/* Contexto nacional */}
          {aboveNational !== null && (
            <View style={[styles.nationalRow, { backgroundColor: aboveNational >= 0 ? '#DCFCE7' : '#FEE2E2', borderRadius: 10 }]}>
              <Ionicons
                name={aboveNational >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={aboveNational >= 0 ? '#16A34A' : '#EF4444'}
              />
              <Text style={[styles.nationalText, { color: aboveNational >= 0 ? '#16A34A' : '#EF4444' }]}>
                {aboveNational >= 0
                  ? `+${aboveNational} pts acima da média nacional ENEM 2023 (~624 pts)`
                  : `${Math.abs(aboveNational)} pts abaixo da média nacional ENEM 2023 (~624 pts)`}
              </Text>
            </View>
          )}

          {/* Mini stats */}
          <View style={[styles.miniStatsRow, { borderTopColor: colors.border }]}>
            <MiniStat label="Corrigidas" value={stats.correctedEssays} colors={colors} />
            <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
            <MiniStat label="Pendentes" value={stats.pendingEssays} colors={colors} />
            <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
            <MiniStat label="Melhor nota" value={stats.highestScore ?? '--'} color={stats.highestScore ? scoreGradientColor(stats.highestScore) : undefined} colors={colors} />
            <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
            <MiniStat label="Menor nota" value={stats.lowestScore ?? '--'} color={stats.lowestScore ? scoreGradientColor(stats.lowestScore) : undefined} colors={colors} />
          </View>

          {/* Tendência */}
          {stats.scores.length >= 2 && (
            <View style={[styles.trendRow, { backgroundColor: colors.input, borderRadius: 10 }]}>
              <Ionicons name={trendIcon} size={16} color={trendColor} />
              <Text style={[styles.trendText, { color: colors.softText }]}>
                Tendência:{' '}
                <Text style={{ color: trendColor, fontWeight: '700' }}>{trendLabel}</Text>
              </Text>
              {stats.lastCorrectedAt ? (
                <Text style={[styles.trendDate, { color: colors.mutedText }]}>
                  · {formatRelativeDate(stats.lastCorrectedAt)}
                </Text>
              ) : null}
            </View>
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
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>Evolução das notas</Text>
              <Text style={[styles.hintText, { color: colors.mutedText }]}>mais antiga → mais recente</Text>
            </View>
            <EvoChart essays={correctedSorted} colors={colors} />
          </Card>
        )}

        {/* ── Competências ── */}
        {compList.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>Média por competência</Text>
            <View style={styles.compList}>
              {compKeys.map((k) => {
                const val = stats.avgCompetencies[k];
                if (val === 0) return null;
                const pct = competencyPct(val);
                const barColor = COMP_COLORS[k] ?? '#3B82F6';
                const isWeakest = k === stats.weakestCompetency;
                const level = compLevel(val);
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
                      <View style={[styles.compLevelPill, { backgroundColor: barColor + '14' }]}>
                        <Text style={[styles.compLevelText, { color: barColor }]}>{level}</Text>
                      </View>
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
              <Text style={[styles.sectionLabel, { color: colors.softText, marginBottom: 0 }]}>
                Onde focar nas próximas redações
              </Text>
            </View>
            <View style={styles.focusList}>
              {focusAreas.map((area) => {
                const areaColor = COMP_COLORS[area.key] ?? colors.warning;
                const gain = 200 - area.val;
                return (
                  <View key={area.key} style={[styles.focusItem, { borderColor: areaColor + '40', backgroundColor: areaColor + '0C' }]}>
                    <View style={styles.focusTop}>
                      <View style={[styles.focusBadge, { backgroundColor: areaColor + '18' }]}>
                        <Text style={[styles.focusBadgeText, { color: areaColor }]}>
                          {area.key.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.focusComp, { color: colors.text }]}>
                          {getCompetencyLabel(area.key)}
                        </Text>
                        <Text style={[styles.focusScoreRow, { color: colors.mutedText }]}>
                          Média atual: <Text style={{ color: areaColor, fontWeight: '700' }}>{area.val}/200</Text>
                          {'  ·  '}Potencial: <Text style={{ color: colors.accent, fontWeight: '700' }}>+{gain} pts</Text>
                        </Text>
                      </View>
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
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>Histórico de redações</Text>
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

        {/* Empty state */}
        {sortedEssays.length === 0 && (
          <Card>
            <View style={styles.emptyWrap}>
              <Ionicons name="document-outline" size={36} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma redação ainda</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                Cadastre a primeira redação deste aluno para começar a acompanhar o desempenho.
              </Text>
            </View>
          </Card>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MiniStat({ label, value, color, colors }: {
  label: string; value: number | string; color?: string; colors: any;
}) {
  return (
    <View style={styles.miniStatBlock}>
      <Text style={[styles.miniStatLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.miniStatValue, { color: color ?? colors.text }]}>{value}</Text>
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
  const scoreLabel = isCorrected && essay.totalScore ? getScoreLabel(essay.totalScore) : '';

  return (
    <View style={[styles.essayRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.essayIndex, { backgroundColor: colors.input }]}>
        <Text style={[styles.essayIndexNum, { color: colors.softText }]}>{index}</Text>
      </View>

      <Pressable onPress={onPress} style={styles.essayInfo}>
        <Text style={[styles.essayTheme, { color: colors.text }]} numberOfLines={2}>
          {essay.themeTitle}
        </Text>
        <View style={styles.essayMeta}>
          <StatusBadge status={essay.status} />
          {scoreLabel ? (
            <View style={[styles.scoreLabelPill, { backgroundColor: scoreColor + '14' }]}>
              <Text style={[styles.scoreLabelText, { color: scoreColor }]}>{scoreLabel}</Text>
            </View>
          ) : null}
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

      <View style={styles.essayRight}>
        <Text style={[styles.essayScore, { color: scoreColor }]}>
          {isCorrected && typeof essay.totalScore === 'number' ? essay.totalScore : '--'}
        </Text>
        {isCorrected ? (
          <Text style={[styles.essayScoreLabel, { color: colors.mutedText }]}>pts</Text>
        ) : null}
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
  sectionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1, marginBottom: 12 },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyWrap: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hintText: { fontSize: 11 },

  // Hero
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 17, fontWeight: '700', lineHeight: 22, letterSpacing: -0.2 },
  heroMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  heroPillText: { fontSize: 11, fontWeight: '500' },
  heroScore: { alignItems: 'flex-end', gap: 2 },
  heroScoreNum: { fontSize: 40, fontWeight: '700', lineHeight: 42, letterSpacing: -1 },
  heroScoreSub: { fontSize: 11, fontWeight: '500' },

  // National context
  nationalRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, marginBottom: 14 },
  nationalText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  // Mini stats
  miniStatsRow: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1 },
  miniStatBlock: { flex: 1, alignItems: 'center', gap: 3 },
  miniStatLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1, textAlign: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '700', lineHeight: 22, letterSpacing: -0.4 },
  miniStatDiv: { width: 1, marginVertical: 4 },

  // Trend
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 12 },
  trendText: { flex: 1, fontSize: 13, lineHeight: 20 },
  trendDate: { fontSize: 11 },

  // Evolution chart
  evoWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  evoBar: { width: 56, alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' },
  evoDelta: { fontSize: 10, fontWeight: '700' },
  evoScore: { fontSize: 11, fontWeight: '700' },
  evoTrack: { width: '85%', flex: 1, borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  evoFill: { width: '100%', borderRadius: 3 },
  evoDate: { fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Competencies
  compList: { gap: 14 },
  compRow: { gap: 6 },
  compLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  compDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  compName: { flex: 1, fontSize: 13, lineHeight: 20 },
  compVal: { fontSize: 15, fontWeight: '700' },
  compLevelPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  compLevelText: { fontSize: 10, fontWeight: '700' },
  compTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 4 },
  weakTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  weakTagText: { fontSize: 10, fontWeight: '700' },

  // Focus areas
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  focusList: { gap: 10 },
  focusItem: { borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 10 },
  focusTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  focusBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  focusBadgeText: { fontSize: 11, fontWeight: '800' },
  focusComp: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  focusScoreRow: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  focusTip: { fontSize: 13, lineHeight: 20 },

  // Essay history rows
  essayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  essayIndex: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  essayIndexNum: { fontSize: 12, fontWeight: '700' },
  essayInfo: { flex: 1, gap: 5 },
  essayTheme: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  essayMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  scoreLabelPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  scoreLabelText: { fontSize: 10, fontWeight: '700' },
  essayDateTime: { fontSize: 11, lineHeight: 16 },
  essayRight: { alignItems: 'flex-end', gap: 3, minWidth: 44 },
  essayScore: { fontSize: 22, lineHeight: 26, fontWeight: '700', textAlign: 'right', letterSpacing: -0.5 },
  essayScoreLabel: { fontSize: 10, fontWeight: '600', textAlign: 'right' },
  deleteBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
