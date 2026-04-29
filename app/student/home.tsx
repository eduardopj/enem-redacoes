import { StudentRoute } from '@/components/auth/StudentRoute';
import { AnimatedNumber, Card, ProgressBar, PulsingDot, ScreenContainer, StaggerItem, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMP_LABELS: Record<string, string> = {
  c1: 'Norma Culta',
  c2: 'Tema',
  c3: 'Argumentação',
  c4: 'Coesão',
  c5: 'Intervenção',
};

const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6', c2: '#8B5CF6', c3: '#10B981', c4: '#F59E0B', c5: '#F43F5E',
};

function getLevelInfo(avg: number): { level: string; emoji: string; color: string } {
  if (avg >= 900) return { level: 'Mestre', emoji: '🏆', color: '#F59E0B' };
  if (avg >= 800) return { level: 'Avançado', emoji: '⭐', color: '#10B981' };
  if (avg >= 700) return { level: 'Intermediário+', emoji: '📈', color: '#3B82F6' };
  if (avg >= 600) return { level: 'Intermediário', emoji: '📚', color: '#8B5CF6' };
  if (avg >= 500) return { level: 'Básico+', emoji: '✏️', color: '#F97316' };
  if (avg >= 400) return { level: 'Básico', emoji: '🌱', color: '#EF4444' };
  return { level: 'Iniciante', emoji: '🎯', color: '#94A3B8' };
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
  }, [value, max, trackH]);
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
  const levelInfo = avg != null ? getLevelInfo(avg) : null;
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
            {levelInfo && (
              <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + '18', borderColor: levelInfo.color + '30' }]}>
                <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
                <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.level}</Text>
              </View>
            )}
          </View>
        </StaggerItem>

        {/* ── Hero Score Card ── */}
        <StaggerItem index={1}>
          {correctedEssays.length > 0 ? (
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.heroScoreRow}>
                <View style={styles.heroScoreMain}>
                  <AnimatedNumber value={avg ?? 0} style={[styles.heroScoreNum, { color: scoreColor }]} />
                  <Text style={[styles.heroScoreLabel, { color: colors.mutedText }]}>média atual</Text>
                  {trend != null && (
                    <View style={[styles.trendPill, { backgroundColor: trend >= 0 ? '#22C55E18' : '#EF444418' }]}>
                      <Ionicons
                        name={trend >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={trend >= 0 ? '#22C55E' : '#EF4444'}
                      />
                      <Text style={[styles.trendText, { color: trend >= 0 ? '#22C55E' : '#EF4444' }]}>
                        {trend >= 0 ? '+' : ''}{trend} pts
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.heroStatsDivider} />
                <View style={styles.heroStatsCol}>
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
              </View>
              {/* Progress bar — avg vs 1000 */}
              <ProgressBar value={((avg ?? 0) / 1000) * 100} color={scoreColor} height={6} delay={300} />
              <View style={styles.heroProgressLabels}>
                <Text style={[styles.heroProgressMin, { color: colors.mutedText }]}>0</Text>
                <Text style={[styles.heroProgressMid, { color: colors.mutedText }]}>Média nacional: ~624</Text>
                <Text style={[styles.heroProgressMax, { color: colors.mutedText }]}>1000</Text>
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
                <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
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

        {/* ── Weak competency tip ── */}
        {weak && correctedEssays.length >= 2 && (
          <StaggerItem index={4}>
            <View style={[styles.tipCard, { backgroundColor: COMP_COLORS[weak.key] + '0E', borderColor: COMP_COLORS[weak.key] + '28' }]}>
              <View style={styles.tipHeader}>
                <View style={[styles.tipIconWrap, { backgroundColor: COMP_COLORS[weak.key] + '18' }]}>
                  <Ionicons name="bulb-outline" size={16} color={COMP_COLORS[weak.key]} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Foque aqui para crescer</Text>
              </View>
              <View style={styles.tipCompRow}>
                <View style={[styles.tipCompBadge, { backgroundColor: COMP_COLORS[weak.key] + '22' }]}>
                  <Text style={[styles.tipCompKey, { color: COMP_COLORS[weak.key] }]}>{weak.key.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipCompName, { color: colors.text }]}>{COMP_LABELS[weak.key]}</Text>
                  <Text style={[styles.tipCompScore, { color: COMP_COLORS[weak.key] }]}>
                    Média: {weak.avg}/200
                  </Text>
                </View>
                <VerticalBar value={weak.avg} max={200} color={COMP_COLORS[weak.key]} />
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
  greetName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
  },
  levelEmoji: { fontSize: 14 },
  levelText: { fontSize: 12, fontWeight: '700' },

  // Hero card
  heroCard: {
    borderRadius: 18, borderWidth: 1,
    padding: theme.spacing.lg, gap: 12,
    shadowColor: '#1B2559', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroScoreMain: { alignItems: 'center', gap: 4, minWidth: 80 },
  heroScoreNum: { fontSize: 52, fontWeight: '800', letterSpacing: -2, lineHeight: 58 },
  heroScoreLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 2 },
  trendText: { fontSize: 11, fontWeight: '700' },
  heroStatsDivider: { width: 1, height: 60, backgroundColor: 'rgba(0,0,0,0.08)' },
  heroStatsCol: { flex: 1, gap: 6 },
  heroStatItem: { alignItems: 'center' },
  heroStatNum: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  heroStatLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.1 },
  heroStatDivider: { height: 1, width: '80%' },
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
  emptyHeroTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
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
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  processingTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  processingSub: { fontSize: 12, lineHeight: 16 },

  // Last essay
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  lastEssayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  lastEssayTheme: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  lastEssayMeta: { flexDirection: 'row' },
  lastEssayScore: { borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 64 },
  lastEssayScoreNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
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

  // Weak comp tip
  tipCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '700' },
  tipCompRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipCompBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipCompKey: { fontSize: 11, fontWeight: '800' },
  tipCompName: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  tipCompScore: { fontSize: 12, fontWeight: '700' },
  tipBarTrack: { width: 10, height: 36, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end' },
  tipBarFill: { width: '100%', borderRadius: 5 },

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
    shadowColor: '#1B2559', shadowOffset: { width: 0, height: 3 },
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
