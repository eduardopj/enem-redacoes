import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Atividade, Essay } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// ─── Helpers ───────────────────────────────────────────────────────────────

const NATIONAL_AVG = 624;
const COMP_LABELS: Record<string, string> = {
  c1: 'C1 — Língua formal',
  c2: 'C2 — Tema',
  c3: 'C3 — Argumentação',
  c4: 'C4 — Coesão',
  c5: 'C5 — Intervenção',
};
const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

function scoreColor(s: number) {
  if (s >= 900) return '#16A34A';
  if (s >= 700) return '#22C55E';
  if (s >= 500) return '#EAB308';
  if (s >= 300) return '#F97316';
  return '#EF4444';
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function trendDelta(essays: Essay[]): number | null {
  const sorted = [...essays]
    .filter((e) => e.status === 'corrigida' && e.totalScore != null)
    .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));
  if (sorted.length < 2) return null;
  return (sorted[sorted.length - 1].totalScore ?? 0) - (sorted[sorted.length - 2].totalScore ?? 0);
}

type SortKey = 'avg' | 'best' | 'essays' | 'improvement';

// ─── Screen ────────────────────────────────────────────────────────────────

export default function TurmaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const turmas = useAppStore((s) => s.turmas);
  const students = useAppStore((s) => s.students);
  const essays = useAppStore((s) => s.essays);
  const atividades = useAppStore((s) => s.atividades);
  const encerrarAtividade = useAppStore((s) => s.encerrarAtividade);
  const fetchStudentEssaysFromBackend = useAppStore((s) => s.fetchStudentEssaysFromBackend);

  const [sortKey, setSortKey] = useState<SortKey>('avg');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setSyncing(true);
    fetchStudentEssaysFromBackend().finally(() => setSyncing(false));
  }, [fetchStudentEssaysFromBackend]);

  const turma = useMemo(() => turmas.find((t) => t.id === id), [turmas, id]);

  const classStudents = useMemo(
    () => students.filter((s) => s.turmaId === id),
    [students, id]
  );

  // Per-student stats
  const studentStats = useMemo(
    () =>
      classStudents.map((s) => {
        const se = essays.filter((e) => e.studentId === s.id);
        const corrected = se.filter((e) => e.status === 'corrigida');
        const scores = corrected.map((e) => e.totalScore ?? 0);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const best = scores.length ? Math.max(...scores) : null;
        const delta = trendDelta(se);
        return { student: s, totalEssays: se.length, corrected: corrected.length, scores, avg, best, delta };
      }),
    [classStudents, essays]
  );

  const withScores = studentStats.filter((s) => s.avg !== null);

  // Sorted ranking
  const ranked = useMemo(() => {
    const copy = [...studentStats];
    if (sortKey === 'avg') copy.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
    else if (sortKey === 'best') copy.sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
    else if (sortKey === 'essays') copy.sort((a, b) => b.totalEssays - a.totalEssays);
    else if (sortKey === 'improvement') copy.sort((a, b) => (b.delta ?? -9999) - (a.delta ?? -9999));
    return copy;
  }, [studentStats, sortKey]);

  // Class-level aggregates
  const classAvg = useMemo(() => {
    if (!withScores.length) return null;
    return Math.round(withScores.reduce((s, r) => s + (r.avg ?? 0), 0) / withScores.length);
  }, [withScores]);

  const totalEssays = useMemo(() => studentStats.reduce((s, r) => s + r.totalEssays, 0), [studentStats]);
  const totalCorrected = useMemo(() => studentStats.reduce((s, r) => s + r.corrected, 0), [studentStats]);
  const pendingEssays = useMemo(() => totalEssays - totalCorrected, [totalEssays, totalCorrected]);
  const noEssayStudents = useMemo(() => studentStats.filter((s) => s.totalEssays === 0), [studentStats]);
  const lowPerformers = useMemo(() => withScores.filter((s) => (s.avg ?? 0) < NATIONAL_AVG), [withScores]);
  const highPerformers = useMemo(() => withScores.filter((s) => (s.avg ?? 0) >= 700), [withScores]);
  const pctAboveNational = useMemo(
    () => (withScores.length ? Math.round((highPerformers.length / withScores.length) * 100) : 0),
    [withScores, highPerformers]
  );

  // Score distribution (bands of 200)
  const distribution = useMemo(() => {
    const allScores = studentStats.flatMap((s) => s.scores);
    const bands = [
      { label: '0–200', min: 0, max: 200 },
      { label: '201–400', min: 201, max: 400 },
      { label: '401–600', min: 401, max: 600 },
      { label: '601–800', min: 601, max: 800 },
      { label: '801–1000', min: 801, max: 1000 },
    ];
    return bands.map((b) => ({
      ...b,
      count: allScores.filter((s) => s >= b.min && s <= b.max).length,
    }));
  }, [studentStats]);
  const maxBandCount = Math.max(...distribution.map((b) => b.count), 1);

  // Competency class averages
  const compAvg = useMemo(() => {
    const keys = ['c1', 'c2', 'c3', 'c4', 'c5'];
    return keys.map((k) => {
      const vals = studentStats
        .flatMap((s) =>
          essays
            .filter((e) => e.studentId === s.student.id && e.status === 'corrigida' && e.competencies)
            .map((e) => (e.competencies as any)[k] as number)
        )
        .filter((v) => v > 0);
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      return { key: k, avg };
    });
  }, [studentStats, essays]);

  const turmaAtividades = useMemo(
    () => atividades.filter((a) => a.turmaId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [atividades, id]
  );

  if (!turma) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <Text style={{ color: colors.mutedText, padding: 20 }}>Turma não encontrada.</Text>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>

        {/* ── Sync indicator ── */}
        {syncing && (
          <View style={[styles.syncBanner, { backgroundColor: colors.accent + '14' }]}>
            <Ionicons name="cloud-download-outline" size={14} color={colors.accent} />
            <Text style={[styles.syncText, { color: colors.accent }]}>Buscando redações dos alunos...</Text>
          </View>
        )}

        {/* ── Class Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.accent }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="people" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>
                {turma.period ? turma.period.charAt(0).toUpperCase() + turma.period.slice(1) : 'Turma'}
                {turma.year ? ` · ${turma.year}` : ''}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{turma.name}</Text>
            {turma.subject && (
              <Text style={styles.heroSub}>{turma.subject}</Text>
            )}
          </View>
          <View style={styles.heroStats}>
            <HeroStat value={String(classStudents.length)} label="Alunos" />
            <HeroStat value={String(totalEssays)} label="Redações" />
            <HeroStat value={classAvg !== null ? String(classAvg) : '—'} label="Média" />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.qRow}>
          <Button
            title="Nova redação"
            leftIcon="create-outline"
            onPress={() => router.push('/nova-redacao' as any)}
          />
          <Pressable
            onPress={() => router.push(`/novo-aluno?turmaId=${id}` as any)}
            style={[styles.secondBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.accent} />
            <Text style={[styles.secondBtnText, { color: colors.accent }]}>Add aluno</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/nova-atividade?turmaId=${id}` as any)}
            style={[styles.secondBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
            <Text style={[styles.secondBtnText, { color: colors.accent }]}>Atividade</Text>
          </Pressable>
        </View>

        {/* ── Atividades ── */}
        {turmaAtividades.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Atividades</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.accent + '18' }]}>
                <Text style={[styles.countBadgeText, { color: colors.accent }]}>
                  {turmaAtividades.filter((a) => a.status === 'ativa').length} ativa{turmaAtividades.filter((a) => a.status === 'ativa').length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            {turmaAtividades.map((a) => (
              <AtividadeRow
                key={a.id}
                atividade={a}
                onEncerrar={() => encerrarAtividade(a.id)}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* ── KPI Grid ── */}
        <View style={styles.kpiGrid}>
          <KpiCard icon="checkmark-circle" label="Corrigidas" value={totalCorrected} color={colors.success} colors={colors} />
          <KpiCard icon="time-outline" label="Pendentes" value={pendingEssays} color={colors.warning} colors={colors} />
          <KpiCard icon="trending-up" label="Acima de 700" value={highPerformers.length} color={colors.info} colors={colors} />
          <KpiCard icon="alert-circle-outline" label="Atenção" value={lowPerformers.length} color={colors.danger} colors={colors} />
        </View>

        {/* ── Insights / Alertas ── */}
        {(noEssayStudents.length > 0 || pctAboveNational > 0) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Insights da turma</Text>
            </View>

            {pctAboveNational > 0 && (
              <InsightRow
                icon="trophy-outline"
                color={colors.success}
                text={`${pctAboveNational}% dos alunos estão acima de 700 pts`}
                colors={colors}
              />
            )}
            {classAvg !== null && classAvg >= NATIONAL_AVG && (
              <InsightRow
                icon="trending-up"
                color={colors.success}
                text={`Média da turma (${classAvg}) acima da média nacional ENEM (~${NATIONAL_AVG})`}
                colors={colors}
              />
            )}
            {classAvg !== null && classAvg < NATIONAL_AVG && (
              <InsightRow
                icon="trending-down"
                color={colors.warning}
                text={`Média da turma (${classAvg}) abaixo da média nacional (~${NATIONAL_AVG})`}
                colors={colors}
              />
            )}
            {noEssayStudents.length > 0 && (
              <InsightRow
                icon="warning-outline"
                color={colors.danger}
                text={`${noEssayStudents.length} aluno${noEssayStudents.length > 1 ? 's' : ''} sem nenhuma redação: ${noEssayStudents.slice(0, 3).map((s) => s.student.name.split(' ')[0]).join(', ')}${noEssayStudents.length > 3 ? '…' : ''}`}
                colors={colors}
              />
            )}
          </View>
        )}

        {/* ── Score Distribution ── */}
        {totalCorrected > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Distribuição de notas</Text>
            </View>
            <View style={styles.distChart}>
              {distribution.map((b) => {
                const pct = b.count / maxBandCount;
                const bColor = b.min >= 801 ? '#16A34A' : b.min >= 601 ? '#22C55E' : b.min >= 401 ? '#EAB308' : b.min >= 201 ? '#F97316' : '#EF4444';
                return (
                  <View key={b.label} style={styles.distBar}>
                    <Text style={[styles.distCount, { color: b.count > 0 ? bColor : colors.mutedText }]}>
                      {b.count > 0 ? b.count : ''}
                    </Text>
                    <View style={[styles.distTrack, { backgroundColor: colors.input }]}>
                      <View style={[styles.distFill, { height: `${Math.max(pct * 100, b.count > 0 ? 8 : 0)}%`, backgroundColor: bColor }]} />
                    </View>
                    <Text style={[styles.distLabel, { color: colors.mutedText }]}>{b.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Competency Averages ── */}
        {compAvg.some((c) => c.avg !== null) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Média por competência</Text>
              <Text style={[styles.cardSub, { color: colors.mutedText }]}>(turma)</Text>
            </View>
            {compAvg.map(({ key, avg }) => {
              if (avg === null) return null;
              const pct = (avg / 200) * 100;
              const c = COMP_COLORS[key] ?? colors.accent;
              const level = avg >= 160 ? 'Bom' : avg >= 120 ? 'Regular' : avg >= 80 ? 'Insuficiente' : 'Fraco';
              return (
                <View key={key} style={styles.compRow}>
                  <View style={styles.compLabelRow}>
                    <View style={[styles.compDot, { backgroundColor: c }]} />
                    <Text style={[styles.compName, { color: colors.text }]}>{COMP_LABELS[key]}</Text>
                    <View style={[styles.compLevelPill, { backgroundColor: c + '14' }]}>
                      <Text style={[styles.compLevelText, { color: c }]}>{level}</Text>
                    </View>
                    <Text style={[styles.compVal, { color: c }]}>{avg}/200</Text>
                  </View>
                  <View style={[styles.compTrack, { backgroundColor: colors.input }]}>
                    <View style={[styles.compFill, { width: `${pct}%`, backgroundColor: c }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Student Ranking ── */}
        {ranked.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Alunos</Text>
            </View>

            {/* Sort tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={styles.sortRow}>
                {([
                  { key: 'avg', label: 'Maior média' },
                  { key: 'best', label: 'Melhor nota' },
                  { key: 'essays', label: 'Mais ativo' },
                  { key: 'improvement', label: 'Em evolução' },
                ] as { key: SortKey; label: string }[]).map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => setSortKey(s.key)}
                    style={[
                      styles.sortTab,
                      sortKey === s.key
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : { backgroundColor: colors.input, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.sortTabText, { color: sortKey === s.key ? '#fff' : colors.softText }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Student rows */}
            {ranked.map((entry, i) => {
              const { student, avg, best, totalEssays: te, delta } = entry;
              const medals = ['1º', '2º', '3º'];
              const isTop3 = i < 3 && avg !== null;
              const color = avg !== null ? scoreColor(avg) : colors.mutedText;
              return (
                <Pressable
                  key={student.id}
                  onPress={() => router.push(`/aluno/${student.id}` as any)}
                  style={[
                    styles.studentRow,
                    i < ranked.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  {/* Rank */}
                  <View style={[
                    styles.rankBadge,
                    { backgroundColor: isTop3 ? colors.accent + '14' : colors.input },
                  ]}>
                    <Text style={[styles.rankText, { color: isTop3 ? colors.accent : colors.softText }]}>
                      {isTop3 ? medals[i] : `${i + 1}`}
                    </Text>
                  </View>

                  {/* Avatar */}
                  <View style={[styles.miniAvatar, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.miniAvatarText, { color }]}>{getInitials(student.name)}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                      {student.name}
                    </Text>
                    <View style={styles.studentMeta}>
                      <Text style={[styles.studentMetaText, { color: colors.mutedText }]}>
                        {te} redaç{te !== 1 ? 'ões' : 'ão'}
                      </Text>
                      {best !== null && (
                        <Text style={[styles.studentMetaText, { color: colors.mutedText }]}>
                          · Melhor: {best}
                        </Text>
                      )}
                      {delta !== null && (
                        <View style={[
                          styles.deltaPill,
                          { backgroundColor: delta >= 0 ? colors.success + '18' : colors.danger + '18' },
                        ]}>
                          <Ionicons
                            name={delta >= 0 ? 'trending-up' : 'trending-down'}
                            size={10}
                            color={delta >= 0 ? colors.success : colors.danger}
                          />
                          <Text style={[styles.deltaText, { color: delta >= 0 ? colors.success : colors.danger }]}>
                            {delta >= 0 ? '+' : ''}{delta}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Score */}
                  <View style={styles.studentRight}>
                    <Text style={[styles.studentScore, { color }]}>
                      {sortKey === 'avg' ? (avg ?? '—') : sortKey === 'best' ? (best ?? '—') : sortKey === 'essays' ? te : (delta !== null ? `${delta >= 0 ? '+' : ''}${delta}` : '—')}
                    </Text>
                    <Text style={[styles.studentScoreSub, { color: colors.mutedText }]}>
                      {sortKey === 'avg' ? 'média' : sortKey === 'best' ? 'melhor' : sortKey === 'essays' ? 'total' : 'evolução'}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.border} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {classStudents.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="person-add-outline" size={36} color={colors.mutedText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum aluno ainda</Text>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Adicione alunos a esta turma para começar o acompanhamento.
            </Text>
            <Button
              title="Adicionar aluno"
              leftIcon="person-add-outline"
              onPress={() => router.push(`/novo-aluno?turmaId=${id}` as any)}
            />
          </View>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function KpiCard({ icon, label, value, color, colors }: {
  icon: any; label: string; value: number; color: string; colors: any;
}) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function InsightRow({ icon, color, text, colors }: { icon: any; color: string; text: string; colors: any }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.insightText, { color: colors.softText }]}>{text}</Text>
    </View>
  );
}

function AtividadeRow({ atividade, onEncerrar, colors }: { atividade: Atividade; onEncerrar: () => void; colors: any }) {
  const isAtiva = atividade.status === 'ativa';
  return (
    <View style={[styles.atividadeRow, { borderColor: colors.border }]}>
      <View style={styles.atividadeTop}>
        <View style={[
          styles.atividadeStatusPill,
          { backgroundColor: isAtiva ? colors.success + '18' : colors.mutedText + '18' },
        ]}>
          <View style={[
            styles.atividadeStatusDot,
            { backgroundColor: isAtiva ? colors.success : colors.mutedText },
          ]} />
          <Text style={[styles.atividadeStatusText, { color: isAtiva ? colors.success : colors.mutedText }]}>
            {isAtiva ? 'Ativa' : 'Encerrada'}
          </Text>
        </View>
        {atividade.dueDate && (
          <View style={styles.atividadeDueWrap}>
            <Ionicons name="calendar-outline" size={11} color={colors.mutedText} />
            <Text style={[styles.atividadeDue, { color: colors.mutedText }]}>{atividade.dueDate}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.atividadeTitle, { color: colors.text }]} numberOfLines={2}>
        {atividade.themeTitle}
      </Text>
      {atividade.description ? (
        <Text style={[styles.atividadeDesc, { color: colors.softText }]} numberOfLines={2}>
          {atividade.description}
        </Text>
      ) : null}
      {isAtiva && (
        <Pressable onPress={onEncerrar} style={[styles.encerrarBtn, { borderColor: colors.danger + '50' }]}>
          <Ionicons name="stop-circle-outline" size={13} color={colors.danger} />
          <Text style={[styles.encerrarText, { color: colors.danger }]}>Encerrar atividade</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  syncText: { fontSize: 13, fontWeight: '500' },

  // Hero
  hero: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  heroContent: { gap: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0, lineHeight: 32 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  heroStats: { flexDirection: 'row', gap: 0 },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0 },
  heroStatLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },

  // Quick actions
  qRow: { flexDirection: 'row', gap: 10 },
  secondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondBtnText: { fontSize: 13, fontWeight: '700' },

  // KPIs
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 5,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '800', letterSpacing: 0 },
  kpiLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', letterSpacing: 0.1 },

  // Cards
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0 },
  cardSub: { fontSize: 12 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  countBadgeText: { fontSize: 11, fontWeight: '700' },

  // Atividade rows
  atividadeRow: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 8,
  },
  atividadeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atividadeStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  atividadeStatusDot: { width: 6, height: 6, borderRadius: 3 },
  atividadeStatusText: { fontSize: 11, fontWeight: '700' },
  atividadeDueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  atividadeDue: { fontSize: 11 },
  atividadeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  atividadeDesc: { fontSize: 12, lineHeight: 18 },
  encerrarBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  encerrarText: { fontSize: 12, fontWeight: '600' },

  // Insights
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insightIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Distribution chart
  distChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 },
  distBar: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  distCount: { fontSize: 11, fontWeight: '700' },
  distTrack: { width: '100%', flex: 1, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  distFill: { width: '100%', borderRadius: 6 },
  distLabel: { fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // Competency bars
  compRow: { gap: 6 },
  compLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  compDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  compName: { flex: 1, fontSize: 12, lineHeight: 18 },
  compLevelPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  compLevelText: { fontSize: 10, fontWeight: '700' },
  compVal: { fontSize: 13, fontWeight: '700' },
  compTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 3 },

  // Sort tabs
  sortRow: { flexDirection: 'row', gap: 7 },
  sortTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  sortTabText: { fontSize: 12, fontWeight: '600' },

  // Student ranking
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankText: { fontSize: 13, fontWeight: '700' },
  miniAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  miniAvatarText: { fontSize: 12, fontWeight: '800' },
  studentInfo: { flex: 1, gap: 3 },
  studentName: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  studentMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  studentMetaText: { fontSize: 11, lineHeight: 16 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  deltaText: { fontSize: 10, fontWeight: '700' },
  studentRight: { alignItems: 'flex-end', gap: 1 },
  studentScore: { fontSize: 20, fontWeight: '700', letterSpacing: 0 },
  studentScoreSub: { fontSize: 9, fontWeight: '600' },

  // Empty
  emptyCard: {
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
