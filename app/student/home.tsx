import { StudentRoute } from '@/components/auth/StudentRoute';
import { AnimatedNumber, Card, ProgressBar, PulsingDot, ScreenContainer, SparkDatum, Sparkline, StaggerItem, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getCompColors, getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMP_LABELS: Record<string, string> = {
  c1: 'Norma Culta',
  c2: 'Compreensão do Tema',
  c3: 'Argumentação',
  c4: 'Coesão Textual',
  c5: 'Proposta de Intervenção',
};

const COMP_TIPS: Record<string, string> = {
  c1: 'Evite gírias, "a gente" e formas verbais informais. Releia cada parágrafo procurando erros de concordância e pontuação antes de entregar.',
  c2: 'Cada parágrafo de desenvolvimento deve retomar diretamente o tema da proposta. Evite tangenciar ou abordar assuntos paralelos.',
  c3: 'Estruture cada argumento com: afirmação + justificativa + exemplo concreto. Afirmações genéricas sem evidências reduzem sua nota.',
  c4: 'Varie os conectivos: além disso, entretanto, por conseguinte, visto que. Não repita "porém" ou "mas" em todo parágrafo.',
  c5: 'Sua proposta deve ter: agente (quem faz) + ação (o quê) + modo (como) + finalidade (para quê). Seja específico — evite "o governo deve investir em X".',
};

function getLevelInfo(avg: number, colors: any): { level: string; icon: keyof typeof Ionicons.glyphMap; color: string } {
  if (avg >= 900) return { level: 'Mestre', icon: 'trophy-outline', color: colors.warning };
  if (avg >= 800) return { level: 'Avançado', icon: 'star-outline', color: colors.success };
  if (avg >= 700) return { level: 'Intermediário+', icon: 'trending-up-outline', color: colors.info };
  if (avg >= 600) return { level: 'Intermediário', icon: 'book-outline', color: colors.secondary };
  if (avg >= 500) return { level: 'Básico+', icon: 'create-outline', color: colors.warning };
  if (avg >= 400) return { level: 'Básico', icon: 'leaf-outline', color: colors.danger };
  return { level: 'Iniciante', icon: 'flag-outline', color: colors.mutedText };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function calcAvg(essays: Essay[]): number | null {
  const scores = essays.filter(e => e.status === 'corrigida' && e.totalScore != null).map(e => e.totalScore!);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function weakestComp(essays: Essay[]): { key: string; avg: number } | null {
  const corrected = essays.filter(e => e.status === 'corrigida' && e.competencies);
  if (corrected.length === 0) return null;
  const sums: Record<string, number[]> = { c1: [], c2: [], c3: [], c4: [], c5: [] };
  for (const e of corrected) {
    const c = e.competencies!;
    sums.c1.push(c.c1); sums.c2.push(c.c2); sums.c3.push(c.c3); sums.c4.push(c.c4); sums.c5.push(c.c5);
  }
  let minKey = 'c1'; let minVal = 200;
  for (const [k, vals] of Object.entries(sums)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < minVal) { minVal = avg; minKey = k; }
  }
  return { key: minKey, avg: Math.round(minVal) };
}

// ─── Animated vertical bar (tip card) ────────────────────────────────────────

function VerticalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [trackH, setTrackH] = useState(0);
  const animH = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trackH) return;
    Animated.timing(animH, {
      toValue: (value / max) * trackH,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animH, value, max, trackH]);
  return (
    <View
      style={{ width: 10, height: 36, borderRadius: 5, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.08)' }}
      onLayout={e => setTrackH(e.nativeEvent.layout.height)}
    >
      <Animated.View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: animH, backgroundColor: color, borderRadius: 5,
        }}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentHomeScreen() {
  const { colors } = useAppTheme();
  const currentStudent = useAppStore(s => s.currentStudent);
  const essays = useAppStore(s => s.essays);
  const atividades = useAppStore(s => s.atividades);
  const logoutStudent = useAppStore(s => s.logoutStudent);

  const myEssays = useMemo(
    () => essays.filter(e => e.studentId === currentStudent?.studentId),
    [essays, currentStudent]
  );

  const correctedEssays = useMemo(() => myEssays.filter(e => e.status === 'corrigida'), [myEssays]);
  const avg = useMemo(() => calcAvg(myEssays), [myEssays]);
  const best = useMemo(() => correctedEssays.length ? Math.max(...correctedEssays.map(e => e.totalScore!)) : null, [correctedEssays]);

  const lastCorrected = useMemo(() => {
    return [...correctedEssays].sort((a, b) => (b.correctedAt ?? '').localeCompare(a.correctedAt ?? ''))[0] ?? null;
  }, [correctedEssays]);

  const prevEssay = useMemo(() => {
    const sorted = [...correctedEssays].sort((a, b) => (b.correctedAt ?? '').localeCompare(a.correctedAt ?? ''));
    return sorted[1] ?? null;
  }, [correctedEssays]);

  const trend = useMemo(() => {
    if (!lastCorrected || !prevEssay) return null;
    return (lastCorrected.totalScore ?? 0) - (prevEssay.totalScore ?? 0);
  }, [lastCorrected, prevEssay]);

  const weak = useMemo(() => weakestComp(myEssays), [myEssays]);
  const processing = useMemo(() => myEssays.filter(e => e.status === 'processando'), [myEssays]);
  const pending = useMemo(() => myEssays.filter(e => e.status === 'pendente' && !e.feedback?.startsWith('Erro')), [myEssays]);
  const sparkData = useMemo<SparkDatum[]>(() => {
    const sorted = [...correctedEssays]
      .filter(e => e.correctedAt && e.totalScore != null)
      .sort((a, b) => (a.correctedAt ?? '').localeCompare(b.correctedAt ?? ''))
      .slice(-8);
    return sorted.map(e => {
      const d = new Date(e.correctedAt!);
      return { value: e.totalScore!, label: `${d.getDate()}/${d.getMonth() + 1}` };
    });
  }, [correctedEssays]);

  const sparkTrend = useMemo(() => {
    if (sparkData.length < 2) return null;
    return sparkData[sparkData.length - 1].value - sparkData[0].value;
  }, [sparkData]);

  const compColors = getCompColors(colors);
  const levelInfo = avg != null ? getLevelInfo(avg, colors) : null;
  const scoreColor = avg != null ? getScoreColor(avg, colors) : colors.mutedText;

  const atividadesPendentes = useMemo(
    () => atividades.filter(
      (a) => a.turmaId === currentStudent?.turmaId && a.status === 'ativa'
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [atividades, currentStudent]
  );

  const name = currentStudent?.studentName.split(' ')[0] ?? 'Aluno';

  return (
    <StudentRoute>
      <ScreenContainer showStudentNav>

        {/* ── Greeting ── */}
        <StaggerItem index={0}>
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greetSub, { color: colors.mutedText }]}>{getGreeting()},</Text>
              <Text style={[styles.greetName, { color: colors.text }]}>{name} 👋</Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/student/nova' as any); }}
              style={[styles.newEssayChip, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.newEssayChipText}>Nova</Text>
            </Pressable>
          </View>
        </StaggerItem>

        {/* ── Hero Score Card ── */}
        <StaggerItem index={1}>
          {correctedEssays.length > 0 ? (
            <View style={[styles.heroCard, { overflow: 'hidden' }]}>
              {/* Colored score section */}
              <View style={[styles.heroCardTop, { backgroundColor: scoreColor }]}>
                <View style={styles.heroScoreMain}>
                  <AnimatedNumber value={avg ?? 0} style={styles.heroScoreNumLight} />
                  <Text style={styles.heroScoreLabelLight}>média atual</Text>
                  {trend != null && (
                    <View style={[styles.trendPill, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                      <Ionicons
                        name={trend >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color="#fff"
                      />
                      <Text style={[styles.trendText, { color: '#fff' }]}>
                        {trend >= 0 ? '+' : ''}{trend} pts
                      </Text>
                    </View>
                  )}
                </View>
                {/* Level badge inside hero */}
                {levelInfo && (
                  <View style={styles.heroLevelWrap}>
                    <Ionicons name={levelInfo.icon} size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.heroLevelText}>{levelInfo.level}</Text>
                  </View>
                )}
              </View>
              {/* White stats + progress section */}
              <View style={[styles.heroCardBottom, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatNum, { color: colors.text }]}>{myEssays.length}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.mutedText }]}>redações</Text>
                  </View>
                  <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatNum, { color: colors.text }]}>{best ?? '--'}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.mutedText }]}>melhor nota</Text>
                  </View>
                  <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatNum, { color: colors.text }]}>{correctedEssays.length}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.mutedText }]}>corrigidas</Text>
                  </View>
                </View>
                <ProgressBar value={((avg ?? 0) / 1000) * 100} color={scoreColor} height={6} delay={300} />
                <View style={styles.heroProgressLabels}>
                  <Text style={[styles.heroProgressMin, { color: colors.mutedText }]}>0</Text>
                  <Text style={[styles.heroProgressMid, { color: colors.mutedText }]}>Nacional: ~624</Text>
                  <Text style={[styles.heroProgressMax, { color: colors.mutedText }]}>1000</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyHeroIcon, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="document-text-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.emptyHeroTitle, { color: colors.text }]}>Comece sua jornada</Text>
              <Text style={[styles.emptyHeroSub, { color: colors.mutedText }]}>
                Envie sua primeira redação e receba um parecer completo com IA.
              </Text>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/student/nova' as any); }}
                style={[styles.emptyHeroCta, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="camera-outline" size={16} color="#fff" />
                <Text style={styles.emptyHeroCtaText}>Enviar redação</Text>
              </Pressable>
            </View>
          )}
        </StaggerItem>

        {/* ── Score evolution sparkline ── */}
        {sparkData.length >= 3 && (
          <StaggerItem index={2}>
            <Card>
              <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="trending-up-outline" size={15} color={colors.accent} />
                  <Text style={[styles.sectionLabel, { color: colors.softText }]}>Sua evolução</Text>
                  {sparkTrend != null && (
                    <View style={[
                      styles.trendPill,
                      { backgroundColor: sparkTrend >= 0 ? colors.success + '18' : colors.danger + '18' },
                    ]}>
                      <Ionicons
                        name={sparkTrend >= 0 ? 'trending-up' : 'trending-down'}
                        size={11}
                        color={sparkTrend >= 0 ? colors.success : colors.danger}
                      />
                      <Text style={[styles.trendText, { color: sparkTrend >= 0 ? colors.success : colors.danger }]}>
                        {sparkTrend >= 0 ? '+' : ''}{sparkTrend} pts
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => router.push('/student/evolucao' as any)}
                  style={styles.seeAllBtn}
                  hitSlop={8}
                >
                  <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver tudo</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.accent} />
                </Pressable>
              </View>
              <Sparkline data={sparkData} height={82} color={scoreColor} />
            </Card>
          </StaggerItem>
        )}

        {/* ── Processing alert ── */}
        {processing.length > 0 && (
          <StaggerItem index={2}>
            <Pressable
              onPress={() => router.push(`/redacao/${processing[0].id}` as any)}
              style={[styles.processingCard, { backgroundColor: colors.infoSoft ?? colors.accent + '12', borderColor: colors.info ?? colors.accent }]}
            >
              <PulsingDot color={colors.info ?? colors.accent} size={10} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.processingTitle, { color: colors.text }]}>Correção em andamento</Text>
                <Text style={[styles.processingSub, { color: colors.mutedText }]} numberOfLines={1}>
                  {processing[0].themeTitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </Pressable>
          </StaggerItem>
        )}

        {/* ── Atividades da turma ── */}
        {atividadesPendentes.length > 0 && (
          <StaggerItem index={3}>
            <View style={[styles.atividadesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.atividadesHeader}>
                <View style={[styles.atividadesIconWrap, { backgroundColor: colors.accent + '14' }]}>
                  <Ionicons name="clipboard-outline" size={15} color={colors.accent} />
                </View>
                <Text style={[styles.atividadesTitle, { color: colors.text }]}>Atividades da turma</Text>
                <View style={[styles.atividadesBadge, { backgroundColor: colors.accent + '14' }]}>
                  <Text style={[styles.atividadesBadgeText, { color: colors.accent }]}>
                    {atividadesPendentes.length}
                  </Text>
                </View>
              </View>
              {atividadesPendentes.map((a, i) => (
                <View
                  key={a.id}
                  style={[
                    styles.atividadeItem,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.atividadeTheme, { color: colors.text }]} numberOfLines={2}>
                    {a.themeTitle}
                  </Text>
                  {a.description ? (
                    <Text style={[styles.atividadeDescText, { color: colors.mutedText }]} numberOfLines={2}>
                      {a.description}
                    </Text>
                  ) : null}
                  {a.dueDate ? (
                    <View style={styles.atividadeDueRow}>
                      <Ionicons name="calendar-outline" size={11} color={colors.mutedText} />
                      <Text style={[styles.atividadeDueText, { color: colors.mutedText }]}>Prazo: {a.dueDate}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => router.push(`/student/nova?themeTitle=${encodeURIComponent(a.themeTitle)}` as any)}
                    style={[styles.atividadeCta, { backgroundColor: colors.accent }]}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.atividadeCtaText}>Enviar redação</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </StaggerItem>
        )}

        {/* ── Last corrected essay ── */}
        {lastCorrected && (
          <StaggerItem index={4}>
            <Card>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={[styles.sectionLabel, { color: colors.softText }]}>Última redação corrigida</Text>
              </View>
              <Pressable onPress={() => router.push(`/resultado/${lastCorrected.id}`)}>
                <View style={styles.lastEssayRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.lastEssayTheme, { color: colors.text }]} numberOfLines={2}>
                      {lastCorrected.themeTitle}
                    </Text>
                    <View style={styles.lastEssayMeta}>
                      <StatusBadge status={lastCorrected.status} />
                    </View>
                  </View>
                  <View style={[styles.lastEssayScore, { backgroundColor: getScoreColor(lastCorrected.totalScore ?? 0, colors) + '14' }]}>
                    <Text style={[styles.lastEssayScoreNum, { color: getScoreColor(lastCorrected.totalScore ?? 0, colors) }]}>
                      {lastCorrected.totalScore ?? '--'}
                    </Text>
                    <Text style={[styles.lastEssayScoreMax, { color: getScoreColor(lastCorrected.totalScore ?? 0, colors) + '99' }]}>/1000</Text>
                  </View>
                </View>
                {lastCorrected.studentDirectMessage && (
                  <View style={[styles.msgBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.accent} />
                    <Text style={[styles.msgText, { color: colors.mutedText }]} numberOfLines={3}>
                      {lastCorrected.studentDirectMessage}
                    </Text>
                  </View>
                )}
                <View style={[styles.seeResultRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.seeResultText, { color: colors.accent }]}>Ver resultado completo</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                </View>
              </Pressable>
            </Card>
          </StaggerItem>
        )}

        {/* ── Foco da semana ── */}
        {weak && correctedEssays.length >= 2 && (
          <StaggerItem index={4}>
            <View style={[styles.focusCard, { backgroundColor: compColors[weak.key] + '0C', borderColor: compColors[weak.key] + '30' }]}>
              {/* Header */}
              <View style={styles.focusHeader}>
                <View style={[styles.focusIconWrap, { backgroundColor: compColors[weak.key] + '20' }]}>
                  <Ionicons name="flag-outline" size={15} color={compColors[weak.key]} />
                </View>
                <Text style={[styles.focusEyebrow, { color: compColors[weak.key] }]}>FOCO DA SEMANA</Text>
              </View>

              {/* Competency row */}
              <View style={styles.focusCompRow}>
                <View style={[styles.focusKeyBadge, { backgroundColor: compColors[weak.key] }]}>
                  <Text style={styles.focusKeyText}>{weak.key.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.focusCompName, { color: colors.text }]}>{COMP_LABELS[weak.key]}</Text>
                  <Text style={[styles.focusScore, { color: compColors[weak.key] }]}>
                    Média atual: {weak.avg}/200
                  </Text>
                </View>
                <VerticalBar value={weak.avg} max={200} color={compColors[weak.key]} />
              </View>

              {/* Tip */}
              <View style={[styles.focusTipBox, { backgroundColor: compColors[weak.key] + '12' }]}>
                <Ionicons name="bulb-outline" size={13} color={compColors[weak.key]} />
                <Text style={[styles.focusTipText, { color: colors.softText }]}>
                  {COMP_TIPS[weak.key]}
                </Text>
              </View>
            </View>
          </StaggerItem>
        )}

        {/* ── Quick actions ── */}
        <StaggerItem index={5}>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/student/nova' as any); }}
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Nova redação</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/student/evolucao' as any)}
              style={[styles.actionBtnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
              <Text style={[styles.actionBtnSecondaryText, { color: colors.accent }]}>Ver evolução</Text>
            </Pressable>
          </View>
        </StaggerItem>

        {/* ── Pending essays nudge ── */}
        {pending.length > 0 && (
          <StaggerItem index={6}>
            <View style={[styles.nudgeRow, { backgroundColor: colors.warningSoft ?? colors.warning + '14', borderColor: colors.warning + '30' }]}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={[styles.nudgeText, { color: colors.softText }]}>
                {pending.length} redação{pending.length > 1 ? 'ões' : ''} aguardando correção
              </Text>
              <Pressable onPress={() => router.push('/student/redacoes' as any)}>
                <Text style={[styles.nudgeLink, { color: colors.warning }]}>Ver</Text>
              </Pressable>
            </View>
          </StaggerItem>
        )}

        {/* ── Logout ── */}
        <StaggerItem index={7}>
          <Pressable
            onPress={() => { logoutStudent(); router.replace('/'); }}
            style={[styles.logoutBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.mutedText} />
            <Text style={[styles.logoutText, { color: colors.mutedText }]}>Sair da conta</Text>
          </Pressable>
        </StaggerItem>

      </ScreenContainer>
    </StudentRoute>
  );
}

const styles = StyleSheet.create({
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  greetSub: { fontSize: 13, fontWeight: '500' },
  greetName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, lineHeight: 32 },
  newEssayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  newEssayChipText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Hero card — split design
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    gap: 12,
  },
  heroCardBottom: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  heroScoreMain: { alignItems: 'flex-start', gap: 2 },
  heroScoreNumLight: { fontSize: 58, fontWeight: '800', letterSpacing: -1, lineHeight: 64, color: '#fff' },
  heroScoreLabelLight: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.2 },
  heroLevelWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  heroLevelText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 2 },
  trendText: { fontSize: 11, fontWeight: '700' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  heroStatItem: { alignItems: 'center', flex: 1 },
  heroStatNum: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  heroStatLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.1 },
  heroStatDivider: { width: 1, height: 36 },
  heroProgressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 3 },
  heroProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroProgressMin: { fontSize: 9, fontWeight: '600' },
  heroProgressMid: { fontSize: 9, fontWeight: '500' },
  heroProgressMax: { fontSize: 9, fontWeight: '600' },

  // Empty hero
  emptyHero: {
    borderRadius: 18, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 12,
  },
  emptyHeroIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyHeroTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 0 },
  emptyHeroSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyHeroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  emptyHeroCtaText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Processing
  processingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  processingDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  processingTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  processingSub: { fontSize: 12, lineHeight: 16 },

  // Last essay
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 12 },
  sectionHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  lastEssayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  lastEssayTheme: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  lastEssayMeta: { flexDirection: 'row' },
  lastEssayScore: { borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 64 },
  lastEssayScoreNum: { fontSize: 22, fontWeight: '800', letterSpacing: 0 },
  lastEssayScoreMax: { fontSize: 10, fontWeight: '600' },
  msgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10,
  },
  msgText: { flex: 1, fontSize: 13, lineHeight: 18 },
  seeResultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
    paddingTop: 10, borderTopWidth: 1,
  },
  seeResultText: { fontSize: 13, fontWeight: '700' },

  // Foco da semana card (item 5)
  focusCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  focusEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  focusCompRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  focusKeyBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  focusKeyText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  focusCompName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  focusScore: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  focusTipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 10 },
  focusTipText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  actionBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5,
  },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '700' },

  // Nudge
  nudgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  nudgeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  nudgeLink: { fontSize: 13, fontWeight: '700' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12,
  },
  logoutText: { fontSize: 13, fontWeight: '600' },

  // Atividades
  atividadesCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 16, gap: 14,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  atividadesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atividadesIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  atividadesTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  atividadesBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  atividadesBadgeText: { fontSize: 11, fontWeight: '800' },
  atividadeItem: { gap: 8, paddingTop: 14 },
  atividadeTheme: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  atividadeDescText: { fontSize: 12, lineHeight: 18 },
  atividadeDueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  atividadeDueText: { fontSize: 11 },
  atividadeCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 10,
  },
  atividadeCtaText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
