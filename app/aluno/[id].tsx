import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, EmptyState, ScreenContainer, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import {
  competencyPct,
  formatDateTime,
  formatRelativeDate,
  getCompColors,
  getCompetencyFocusTip,
  getCompetencyLabel,
  getScoreColor,
  getScoreLabel,
  getStudentStats,
  getTrendColor,
  getTrendIcon,
  getTrendLabel,
  isCorrectedEssay,
  scorePct,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

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

function scoreGradientColor(score: number, colors: any): string {
  if (score >= 700) return colors.success;
  if (score >= 500) return colors.warning;
  return colors.danger;
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
  const generateStudentCode = useAppStore((state) => state.generateStudentCode);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const [codeShared, setCodeShared] = useState(false);

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

  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const compList = compKeys
    .map((k) => ({ key: k, val: stats.avgCompetencies[k] }))
    .filter((c) => c.val > 0)
    .sort((a, b) => a.val - b.val);
  const focusAreas = compList.slice(0, 2);

  const correctedSorted = [...studentEssays]
    .filter(isCorrectedEssay)
    .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));

  const sortedEssays = [...studentEssays].sort(
    (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  );
  const pendingEssay = sortedEssays.find(
    (essay) => essay.status === 'pendente' || essay.status === 'precisa_revisao' || essay.status === 'baixa_confiabilidade'
  );
  const nextFocus = focusAreas[0];

  const aboveNational =
    stats.averageScore !== null ? stats.averageScore - NATIONAL_AVG : null;

  async function handleGenerateCode() {
    const code = generateStudentCode(student!.id);
    if (code) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCodeShared(true);
      setTimeout(() => setCodeShared(false), 2000);
      await Share.share({
        message: `Olá ${student!.name}! Seu código de acesso ao ENEM IA é: ${code}\n\nAbra o app, toque em "Sou aluno" e use:\nProfessor: ${currentTeacher?.email}\nCódigo: ${code}`,
        title: 'Código de acesso — ENEM IA',
      });
    }
  }

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
            <View style={[styles.nationalRow, { backgroundColor: aboveNational >= 0 ? colors.successSoft : colors.dangerSoft, borderRadius: 10 }]}>
              <Ionicons
                name={aboveNational >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={aboveNational >= 0 ? colors.success : colors.danger}
              />
              <Text style={[styles.nationalText, { color: aboveNational >= 0 ? colors.success : colors.danger }]}>
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
            <MiniStat label="Melhor nota" value={stats.highestScore ?? '--'} color={stats.highestScore ? scoreGradientColor(stats.highestScore, colors) : undefined} colors={colors} />
            <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
            <MiniStat label="Menor nota" value={stats.lowestScore ?? '--'} color={stats.lowestScore ? scoreGradientColor(stats.lowestScore, colors) : undefined} colors={colors} />
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
        <Button
          title="Gerar relatório do aluno"
          variant="secondary"
          leftIcon="analytics-outline"
          onPress={() => router.push(`/relatorio-aluno/${student.id}` as any)}
        />

        {pendingEssay ? (
          <SmartActionCard
            icon="flash-outline"
            title="Próxima ação"
            description={`Há uma redação de "${pendingEssay.themeTitle}" pronta para correção ou revisão.`}
            buttonLabel="Abrir redação"
            onPress={() => router.push(`/redacao/${pendingEssay.id}` as any)}
            colors={colors}
          />
        ) : nextFocus ? (
          <SmartActionCard
            icon="bulb-outline"
            title="Foco pedagógico"
            description={`Trabalhe ${getCompetencyLabel(nextFocus.key, true)} na próxima proposta. É onde há maior ganho possível agora.`}
            buttonLabel="Nova redação guiada"
            onPress={() => router.push(`/nova-redacao?studentId=${student.id}` as any)}
            colors={colors}
          />
        ) : null}

        {/* ── Código de acesso do aluno ── */}
        <Card>
          <View style={styles.codeHeader}>
            <View style={[styles.codeIconWrap, { backgroundColor: colors.accent + '18' }]}>
              <Ionicons name="key-outline" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.codeTitle, { color: colors.text }]}>Código de acesso</Text>
              <Text style={[styles.codeSub, { color: colors.mutedText }]}>
                Compartilhe com o aluno para ele entrar no app
              </Text>
            </View>
          </View>

          {student.accessCode ? (
            <Pressable
              onPress={handleGenerateCode}
              style={[styles.codeBox, { backgroundColor: colors.input, borderColor: colors.accent + '40' }]}
            >
              <Text style={[styles.codeValue, { color: colors.accent }]}>{student.accessCode}</Text>
              <View style={[styles.copyBtn, { backgroundColor: colors.accent + '18' }]}>
                <Ionicons
                  name={codeShared ? 'checkmark-outline' : 'share-outline'}
                  size={16}
                  color={colors.accent}
                />
                <Text style={[styles.copyText, { color: colors.accent }]}>
                  {codeShared ? 'Ok!' : 'Enviar'}
                </Text>
              </View>
            </Pressable>
          ) : null}

          <Button
            title={student.accessCode ? 'Gerar novo código' : 'Gerar código de acesso'}
            variant="secondary"
            leftIcon="refresh-outline"
            onPress={handleGenerateCode}
          />

          <Text style={[styles.codeHint, { color: colors.mutedText }]}>
            O aluno usa o e-mail do professor + este código para entrar
          </Text>
        </Card>

        {/* Evolução de notas */}
        {correctedSorted.length > 0 && (
          <Card>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>Evolução das notas</Text>
              <Text style={[styles.hintText, { color: colors.mutedText }]}>mais antiga → mais recente</Text>
            </View>
            <View style={styles.evolutionSummary}>
              <EvolutionMetric label="Primeira" value={correctedSorted[0]?.totalScore ?? '--'} colors={colors} />
              <EvolutionMetric label="Última" value={correctedSorted[correctedSorted.length - 1]?.totalScore ?? '--'} colors={colors} />
              <EvolutionMetric
                label="Evolução"
                value={
                  correctedSorted.length >= 2
                    ? `${(correctedSorted[correctedSorted.length - 1]?.totalScore ?? 0) - (correctedSorted[0]?.totalScore ?? 0) >= 0 ? '+' : ''}${(correctedSorted[correctedSorted.length - 1]?.totalScore ?? 0) - (correctedSorted[0]?.totalScore ?? 0)}`
                    : '--'
                }
                colors={colors}
              />
            </View>
            <EvoChart essays={correctedSorted} colors={colors} />
            {correctedSorted.length === 1 ? (
              <Text style={[styles.evolutionHint, { color: colors.mutedText }]}>Corrija mais uma redação para visualizar tendência e variação de nota.</Text>
            ) : null}
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
                const barColor = getCompColors(colors)[k] ?? colors.accent;
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
                const areaColor = getCompColors(colors)[area.key] ?? colors.warning;
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
          <EmptyState
            icon="document-text-outline"
            title="Nenhuma redação ainda"
            description="Envie a primeira redação para começar a acompanhar o desempenho deste aluno."
            buttonLabel="Enviar primeira redação"
            onPress={() => router.push(`/nova-redacao?studentId=${student.id}` as any)}
            tip="A IA avalia as 5 competências do ENEM e devolve o resultado em segundos."
          />
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

function EvolutionMetric({ label, value, colors }: { label: string; value: number | string; colors: any }) {
  const numeric = typeof value === 'number' ? value : Number(String(value).replace('+', ''));
  const color = Number.isFinite(numeric)
    ? numeric >= 0 && label === 'Evolução'
      ? colors.success
      : label === 'Evolução'
        ? colors.danger
        : scoreGradientColor(Number(numeric), colors)
    : colors.text;

  return (
    <View style={[styles.evolutionMetric, { backgroundColor: colors.input }]}>
      <Text style={[styles.evolutionMetricValue, { color }]}>{value}</Text>
      <Text style={[styles.evolutionMetricLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function SmartActionCard({ icon, title, description, buttonLabel, onPress, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Card variant="flat">
      <View style={styles.smartAction}>
        <View style={[styles.smartIcon, { backgroundColor: colors.accent + '18' }]}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.smartTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.smartText, { color: colors.mutedText }]}>{description}</Text>
        </View>
      </View>
      <Button title={buttonLabel} leftIcon="arrow-forward-outline" onPress={onPress} />
    </Card>
  );
}

function EvoChart({ essays, colors }: { essays: Essay[]; colors: any }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.evoWrap, { minWidth: essays.length * 64 }]}>
        {essays.map((essay, i) => {
          const score = essay.totalScore ?? 0;
          const pct = scorePct(score);
          const barColor = scoreGradientColor(score, colors);
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
                <Text style={[styles.evoDelta, { color: delta >= 0 ? colors.success : colors.danger }]}>
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
  const isCorrected = isCorrectedEssay(essay);
  const scoreColor = isCorrected && essay.totalScore ? scoreGradientColor(essay.totalScore, colors) : colors.mutedText;
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
  sectionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0, marginBottom: 12 },
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
  heroName: { fontSize: 17, fontWeight: '700', lineHeight: 22, letterSpacing: 0 },
  heroMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  heroPillText: { fontSize: 11, fontWeight: '500' },
  heroScore: { alignItems: 'flex-end', gap: 2 },
  heroScoreNum: { fontSize: 40, fontWeight: '700', lineHeight: 42, letterSpacing: 0 },
  heroScoreSub: { fontSize: 11, fontWeight: '500' },

  // National context
  nationalRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, marginBottom: 14 },
  nationalText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  // Mini stats
  miniStatsRow: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1 },
  miniStatBlock: { flex: 1, alignItems: 'center', gap: 3 },
  miniStatLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1, textAlign: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '700', lineHeight: 22, letterSpacing: 0 },
  miniStatDiv: { width: 1, marginVertical: 4 },

  // Trend
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 12 },
  trendText: { flex: 1, fontSize: 13, lineHeight: 20 },
  trendDate: { fontSize: 11 },

  // Smart action
  smartAction: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  smartIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smartTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  smartText: { fontSize: 12, lineHeight: 18 },

  // Evolution chart
  evolutionSummary: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  evolutionMetric: { flex: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, alignItems: 'center' },
  evolutionMetricValue: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  evolutionMetricLabel: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  evolutionHint: { fontSize: 12, lineHeight: 18, marginTop: 10, textAlign: 'center' },
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

  // Access code
  codeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  codeIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  codeTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  codeSub: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  codeValue: { fontSize: 28, fontWeight: '800', letterSpacing: 6 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  copyText: { fontSize: 12, fontWeight: '700' },
  codeHint: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4 },

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
  essayScore: { fontSize: 22, lineHeight: 26, fontWeight: '700', textAlign: 'right', letterSpacing: 0 },
  essayScoreLabel: { fontSize: 10, fontWeight: '600', textAlign: 'right' },
  deleteBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
