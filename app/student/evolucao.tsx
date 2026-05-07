import { StudentRoute } from '@/components/auth/StudentRoute';
import { Card, EmptyState, ProgressBar, ScreenContainer, StaggerItem } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getCompColors, getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMP_LABELS: Record<string, string> = {
  c1: 'Norma Culta', c2: 'Tema', c3: 'Argumentação', c4: 'Coesão', c5: 'Intervenção',
};
const COMP_TIPS: Record<string, string> = {
  c1: 'Revise concordância verbal/nominal, ortografia e pontuação.',
  c2: 'Leia editoriais e estude repertórios sobre temas de atualidade.',
  c3: 'Treine: tese → argumentos → contra-argumento → conclusão.',
  c4: 'Pratique conectivos e progressão temática entre parágrafos.',
  c5: 'Elabore propostas com Agente, Ação, Meio, Finalidade e Efeito.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgComp(essays: Essay[], key: keyof NonNullable<Essay['competencies']>): number | null {
  const vals = essays.filter(e => e.competencies).map(e => e.competencies![key]);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedBarFill({ pct, color, trackHeight = 70, delay = 0 }: {
  pct: number; color: string; trackHeight?: number; delay?: number;
}) {
  const animH = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animH, {
      toValue: (pct / 100) * trackHeight,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animH, delay, pct, trackHeight]);
  return <Animated.View style={{ width: '100%', height: animH, backgroundColor: color, borderRadius: 6 }} />;
}

function ScoreTimeline({ essays, colors }: { essays: Essay[]; colors: any }) {
  const maxScore = 1000;

  return (
    <View style={timelineStyles.wrap}>
      {essays.map((essay, i) => {
        const score = essay.totalScore ?? 0;
        const color = getScoreColor(score, colors);
        const barPct = Math.max((score / maxScore) * 100, 2);
        const prev = essays[i - 1]?.totalScore;
        const delta = prev != null ? score - prev : null;

        return (
          <Pressable
            key={essay.id}
            onPress={() => router.push(`/resultado/${essay.id}`)}
            style={timelineStyles.item}
          >
            {/* Bar */}
            <View style={timelineStyles.barWrap}>
              {delta != null && (
                <View style={timelineStyles.deltaWrap}>
                  <Ionicons
                    name={delta >= 0 ? 'caret-up' : 'caret-down'}
                    size={9}
                    color={delta >= 0 ? colors.success : colors.danger}
                  />
                  <Text style={[timelineStyles.deltaText, { color: delta >= 0 ? colors.success : colors.danger }]}>
                    {Math.abs(delta)}
                  </Text>
                </View>
              )}
              <View style={[timelineStyles.barTrack, { backgroundColor: colors.input }]}>
                <AnimatedBarFill pct={barPct} color={color} delay={i * 80} />
              </View>
            </View>
            {/* Score label */}
            <Text style={[timelineStyles.scoreLabel, { color }]}>{score}</Text>
            {/* Date */}
            <Text style={[timelineStyles.dateLabel, { color: colors.mutedText }]}>
              {essay.correctedAt ? formatShortDate(essay.correctedAt) : `#${i + 1}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  barWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  deltaWrap: { flexDirection: 'row', alignItems: 'center', gap: 1, marginBottom: 2 },
  deltaText: { fontSize: 8, fontWeight: '700' },
  barTrack: { width: '70%', height: 70, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  scoreLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  dateLabel: { fontSize: 8, fontWeight: '500', textAlign: 'center' },
});

function CompetencyCard({ compKey, avg, essays, colors }: {
  compKey: string; avg: number; essays: Essay[]; colors: any;
}) {
  const color = getCompColors(colors)[compKey];
  const pct = (avg / 200) * 100;
  const history = essays.filter(e => e.competencies).map(e => e.competencies![compKey as keyof NonNullable<Essay['competencies']>]);
  const trend = history.length >= 2 ? history[history.length - 1] - history[history.length - 2] : null;

  const levelLabel = avg >= 160 ? 'Bom' : avg >= 120 ? 'Regular' : avg >= 80 ? 'Insuficiente' : avg >= 40 ? 'Fraco' : avg === 200 ? 'Excelente' : 'Zerado';

  return (
    <View style={[compStyles.card, { backgroundColor: color + '08', borderColor: color + '22' }]}>
      <View style={compStyles.header}>
        <View style={[compStyles.badge, { backgroundColor: color + '1C' }]}>
          <Text style={[compStyles.badgeKey, { color }]}>{compKey.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[compStyles.label, { color: colors.text }]}>{COMP_LABELS[compKey]}</Text>
          <Text style={[compStyles.levelLabel, { color }]}>{levelLabel}</Text>
        </View>
        <View style={compStyles.scoreWrap}>
          <Text style={[compStyles.scoreNum, { color }]}>{avg}</Text>
          <Text style={[compStyles.scoreMax, { color: color + '88' }]}>/200</Text>
        </View>
        {trend != null && (
          <View style={[compStyles.trendPill, { backgroundColor: trend >= 0 ? colors.success + '14' : colors.danger + '14' }]}>
            <Ionicons name={trend >= 0 ? 'trending-up' : 'trending-down'} size={11} color={trend >= 0 ? colors.success : colors.danger} />
            <Text style={[compStyles.trendText, { color: trend >= 0 ? colors.success : colors.danger }]}>
              {trend >= 0 ? '+' : ''}{trend}
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <ProgressBar value={pct} color={color} height={5} />

      {/* Mini history dots */}
      {history.length > 1 && (
        <View style={compStyles.historyRow}>
          {history.slice(-6).map((v, i) => (
            <View
              key={i}
              style={[compStyles.historyDot, {
                backgroundColor: color,
                opacity: 0.3 + (i / (Math.max(history.slice(-6).length - 1, 1))) * 0.7,
                width: 6 + (v / 200) * 8,
                height: 6 + (v / 200) * 8,
              }]}
            />
          ))}
        </View>
      )}

      {/* Tip */}
      {avg < 160 && (
        <View style={[compStyles.tip, { backgroundColor: color + '12' }]}>
          <Ionicons name="bulb-outline" size={12} color={color} />
          <Text style={[compStyles.tipText, { color: colors.mutedText }]}>{COMP_TIPS[compKey]}</Text>
        </View>
      )}
    </View>
  );
}

const compStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeKey: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  label: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  levelLabel: { fontSize: 11, fontWeight: '600' },
  scoreWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreNum: { fontSize: 22, fontWeight: '800', letterSpacing: 0, lineHeight: 26 },
  scoreMax: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  trendText: { fontSize: 10, fontWeight: '700' },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  historyRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  historyDot: { borderRadius: 99 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 8, padding: 8 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentEvolucaoScreen() {
  const { colors } = useAppTheme();
  const currentStudent = useAppStore(s => s.currentStudent);
  const essays = useAppStore(s => s.essays);

  const myEssays = useMemo(
    () => essays.filter(e => e.studentId === currentStudent?.studentId),
    [essays, currentStudent]
  );

  const corrected = useMemo(
    () => [...myEssays.filter(e => e.status === 'corrigida' && e.totalScore != null)]
      .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? '')),
    [myEssays]
  );

  const avg = useMemo(() => {
    if (!corrected.length) return null;
    return Math.round(corrected.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / corrected.length);
  }, [corrected]);

  const best = useMemo(() => corrected.length ? Math.max(...corrected.map(e => e.totalScore!)) : null, [corrected]);
  const last = corrected[corrected.length - 1] ?? null;
  const prev = corrected[corrected.length - 2] ?? null;
  const totalTrend = last && prev ? (last.totalScore ?? 0) - (prev.totalScore ?? 0) : null;

  const compAvgs = useMemo(() => {
    const keys = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;
    return keys.map(k => ({ key: k, avg: avgComp(corrected, k) })).filter(x => x.avg != null) as { key: string; avg: number }[];
  }, [corrected]);

  const bestComp = useMemo(() => {
    if (!compAvgs.length) return null;
    return [...compAvgs].sort((a, b) => b.avg - a.avg)[0];
  }, [compAvgs]);

  const weakComp = useMemo(() => {
    if (!compAvgs.length) return null;
    return [...compAvgs].sort((a, b) => a.avg - b.avg)[0];
  }, [compAvgs]);

  if (corrected.length === 0) {
    return (
      <StudentRoute>
        <ScreenContainer showStudentNav>
          <View style={styles.titleRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Minha evolução</Text>
            <Text style={[styles.title, { color: colors.text }]}>Evolução</Text>
          </View>
          <EmptyState
            icon="trending-up-outline"
            title="Ainda sem dados"
            description="Corrija ao menos uma redação para ver sua evolução."
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

        <StaggerItem index={0}>
          <View style={styles.titleRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Minha evolução</Text>
            <Text style={[styles.title, { color: colors.text }]}>Evolução</Text>
          </View>
        </StaggerItem>

        {/* ── KPIs ── */}
        <StaggerItem index={1}>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiNum, { color: getScoreColor(avg ?? 0, colors) }]}>{avg ?? '--'}</Text>
              <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>média</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiNum, { color: getScoreColor(best ?? 0, colors) }]}>{best ?? '--'}</Text>
              <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>melhor nota</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.kpiTrendRow}>
                {totalTrend != null && (
                  <Ionicons
                    name={totalTrend >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={totalTrend >= 0 ? colors.success : colors.danger}
                  />
                )}
                <Text style={[styles.kpiNum, { color: totalTrend == null ? colors.mutedText : totalTrend >= 0 ? colors.success : colors.danger }]}>
                  {totalTrend == null ? '--' : `${totalTrend >= 0 ? '+' : ''}${totalTrend}`}
                </Text>
              </View>
              <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>últ. evolução</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiNum, { color: colors.text }]}>{corrected.length}</Text>
              <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>corrigidas</Text>
            </View>
          </View>
        </StaggerItem>

        {/* ── Score timeline ── */}
        {corrected.length >= 2 && (
          <StaggerItem index={2}>
            <Card>
              <View style={styles.sectionHeader}>
                <Ionicons name="bar-chart-outline" size={15} color={colors.accent} />
                <Text style={[styles.sectionLabel, { color: colors.softText }]}>Histórico de notas</Text>
                <Text style={[styles.sectionHint, { color: colors.mutedText }]}>toque para ver</Text>
              </View>
              <ScoreTimeline essays={corrected} colors={colors} />
            </Card>
          </StaggerItem>
        )}

        {/* ── Highlights ── */}
        {(bestComp || weakComp) && (
          <StaggerItem index={3}>
            <View style={styles.highlightRow}>
              {bestComp && (
                <View style={[styles.highlightCard, { backgroundColor: colors.success + '0A', borderColor: colors.success + '22' }]}>
                  <View style={styles.highlightHeader}>
                    <Ionicons name="star" size={13} color={colors.success} />
                    <Text style={[styles.highlightTitle, { color: colors.success }]}>Ponto forte</Text>
                  </View>
                  <Text style={[styles.highlightKey, { color: getCompColors(colors)[bestComp.key] }]}>{bestComp.key.toUpperCase()}</Text>
                  <Text style={[styles.highlightName, { color: colors.text }]}>{COMP_LABELS[bestComp.key]}</Text>
                  <Text style={[styles.highlightScore, { color: getCompColors(colors)[bestComp.key] }]}>{bestComp.avg}/200</Text>
                </View>
              )}
              {weakComp && (
                <View style={[styles.highlightCard, { backgroundColor: colors.warning + '0A', borderColor: colors.warning + '22' }]}>
                  <View style={styles.highlightHeader}>
                    <Ionicons name="flag" size={13} color={colors.warning} />
                    <Text style={[styles.highlightTitle, { color: colors.warning }]}>Foco de melhoria</Text>
                  </View>
                  <Text style={[styles.highlightKey, { color: getCompColors(colors)[weakComp.key] }]}>{weakComp.key.toUpperCase()}</Text>
                  <Text style={[styles.highlightName, { color: colors.text }]}>{COMP_LABELS[weakComp.key]}</Text>
                  <Text style={[styles.highlightScore, { color: getCompColors(colors)[weakComp.key] }]}>{weakComp.avg}/200</Text>
                </View>
              )}
            </View>
          </StaggerItem>
        )}

        {/* ── Competency detail cards ── */}
        {compAvgs.length > 0 && (
          <StaggerItem index={4}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={15} color={colors.accent} />
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>Desempenho por competência</Text>
            </View>
          </StaggerItem>
        )}
        {compAvgs.map((c, i) => (
          <StaggerItem key={c.key} index={5 + i}>
            <CompetencyCard compKey={c.key} avg={c.avg} essays={corrected} colors={colors} />
          </StaggerItem>
        ))}

        {/* ── Nacional context ── */}
        {avg != null && (
          <StaggerItem index={10}>
            <Card>
              <View style={styles.sectionHeader}>
                <Ionicons name="earth-outline" size={15} color={colors.accent} />
                <Text style={[styles.sectionLabel, { color: colors.softText }]}>Contexto nacional</Text>
              </View>
              {[
                { label: 'Média nacional (ENEM 2023)', value: '~624 pts', highlight: false },
                { label: 'Sua média atual', value: `${avg} pts`, highlight: true },
                { label: 'Diferença', value: `${avg >= 624 ? '+' : ''}${avg - 624} pts`, highlight: true },
                { label: 'Top 10% começa em', value: '900+ pts', highlight: false },
                { label: 'Nota 1000', value: '<0,2% dos candidatos', highlight: false },
              ].map((row, i) => (
                <View key={i} style={[styles.contextRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.contextLabel, { color: colors.mutedText }]}>{row.label}</Text>
                  <Text style={[styles.contextValue, { color: row.highlight ? getScoreColor(avg, colors) : colors.text, fontWeight: row.highlight ? '700' : '500' }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </Card>
          </StaggerItem>
        )}

      </ScreenContainer>
    </StudentRoute>
  );
}

const styles = StyleSheet.create({
  titleRow: { paddingTop: 4, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0, lineHeight: 32 },

  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 10,
    alignItems: 'center', gap: 2,
  },
  kpiNum: { fontSize: 20, fontWeight: '800', letterSpacing: 0, lineHeight: 24 },
  kpiLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.1, textAlign: 'center' },
  kpiTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1, flex: 1 },
  sectionHint: { fontSize: 11 },

  highlightRow: { flexDirection: 'row', gap: 10 },
  highlightCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  highlightTitle: { fontSize: 11, fontWeight: '700' },
  highlightKey: { fontSize: 16, fontWeight: '800' },
  highlightName: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  highlightScore: { fontSize: 13, fontWeight: '700' },

  contextRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1,
  },
  contextLabel: { fontSize: 13, lineHeight: 18, flex: 1 },
  contextValue: { fontSize: 13, lineHeight: 18 },
});
