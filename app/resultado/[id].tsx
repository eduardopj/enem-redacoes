import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Card,
  ScoreSummaryCard,
  ScreenContainer,
  StaggerItem,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

const COMP_META: Record<string, { short: string; label: string; description: string }> = {
  c1: {
    short: 'C1',
    label: 'Norma-padrão',
    description: 'Domínio da norma culta da língua portuguesa escrita.',
  },
  c2: {
    short: 'C2',
    label: 'Tema & repertório',
    description: 'Compreensão do tema, proposta e repertório sociocultural pertinente.',
  },
  c3: {
    short: 'C3',
    label: 'Argumentação',
    description: 'Seleção, organização e progressão argumentativa.',
  },
  c4: {
    short: 'C4',
    label: 'Coesão',
    description: 'Coesão textual e articulação entre as partes do texto.',
  },
  c5: {
    short: 'C5',
    label: 'Intervenção',
    description: 'Proposta de intervenção social, detalhada e viável.',
  },
};

function totalScoreLabel(score: number): string {
  if (score >= 900) return 'Excelente';
  if (score >= 800) return 'Muito bom';
  if (score >= 700) return 'Bom';
  if (score >= 600) return 'Regular';
  if (score >= 500) return 'Abaixo da média';
  if (score >= 400) return 'Insuficiente';
  return 'Muito fraco';
}

function compScoreLabel(score: number): string {
  if (score === 200) return 'Excelente';
  if (score === 160) return 'Bom';
  if (score === 120) return 'Regular';
  if (score === 80)  return 'Insuficiente';
  if (score === 40)  return 'Fraco';
  return 'Zerado';
}

// ─── Share text builder (WhatsApp markdown) ──────────────────────────────────
// WhatsApp suporta: *negrito*, _itálico_. Evitar ASCII art e caracteres especiais.

const SEP = '―――――――――――――――――――――――――';

function buildShareText(essay: any, studentName: string): string {
  const score = essay.totalScore ?? 0;
  const scoreL = totalScoreLabel(score);
  const lines: string[] = [];

  // Cabeçalho
  lines.push(`*📝 PARECER PEDAGÓGICO — ENEM IA*`);
  lines.push(SEP);
  lines.push(`👤 *Aluno:* ${studentName}`);
  lines.push(`📌 *Tema:* ${essay.themeTitle}`);
  lines.push('');

  // Nota
  lines.push(`⭐ *NOTA TOTAL: ${score}/1000*`);
  lines.push(`_${scoreL}_`);
  if (score > 0) {
    const diff = score - 624;
    if (diff >= 0) {
      lines.push(`📍 +${diff} pts acima da média nacional (ENEM 2023: ~624 pts)`);
    } else {
      lines.push(`📍 ${Math.abs(diff)} pts abaixo da média nacional (ENEM 2023: ~624 pts)`);
    }
    if (score >= 900) lines.push(`🏅 Você está no *TOP 10%* dos candidatos!`);
    else if (score >= 800) lines.push(`✨ Nota compatível com a maioria das cotas federais (600–800 pts).`);
    else if (score >= 624) lines.push(`✅ Você já supera a média nacional — continue evoluindo!`);
    else lines.push(`💪 Grande margem para crescer — foque nas dicas abaixo.`);
  }
  lines.push('');

  // Competências
  if (essay.competencies) {
    lines.push(SEP);
    lines.push(`📊 *COMPETÊNCIAS* _(cada uma vale 0–200 pts)_`);
    lines.push('');

    const compRows = [
      ['C1', 'Norma-padrão',    essay.competencies.c1],
      ['C2', 'Tema/Repertório', essay.competencies.c2],
      ['C3', 'Argumentação',    essay.competencies.c3],
      ['C4', 'Coesão',          essay.competencies.c4],
      ['C5', 'Intervenção',     essay.competencies.c5],
    ] as [string, string, number][];

    const weakComp  = [...compRows].sort((a, b) => a[2] - b[2])[0];
    const strongComp = [...compRows].sort((a, b) => b[2] - a[2])[0];

    for (const [key, label, val] of compRows) {
      const lbl = compScoreLabel(val);
      const star = val === strongComp[2] ? ' ✨' : '';
      const arrow = val === weakComp[2] && val < 160 ? ' 👈 foco' : '';
      lines.push(`*${key}* ${label} — *${val}/200* _${lbl}_${star}${arrow}`);
    }

    lines.push('');
    if (weakComp[2] < 160) {
      lines.push(`💡 *Maior potencial:* ${weakComp[1]} — subir um nível vale +40 pts`);
    }
    lines.push(`✅ *Destaque:* ${strongComp[1]} (${strongComp[2]}/200)`);
    lines.push('');

    // Estatísticas reais
    lines.push(`📌 *Dados reais do ENEM:*`);
    lines.push(`• Média nacional de redação (2023): ~624 pts`);
    lines.push(`• Top 10% dos candidatos: acima de 900 pts`);
    lines.push(`• Nota 1000: menos de 0,2% dos participantes`);
    lines.push(`• C5 (Intervenção) é onde mais candidatos perdem pontos`);
    lines.push(`• Quem atinge C2 acima de 160 tem média total ~23% maior`);
  }
  lines.push('');

  // Mensagem direta ao aluno
  if (essay.studentDirectMessage) {
    lines.push(SEP);
    lines.push(`💬 *MENSAGEM PARA VOCÊ*`);
    lines.push('');
    lines.push(essay.studentDirectMessage);
    lines.push('');
  }

  // Reconhecimento
  if (essay.congratulations) {
    lines.push(SEP);
    lines.push(`🏆 *RECONHECIMENTO*`);
    lines.push('');
    lines.push(essay.congratulations);
    lines.push('');
  }

  // Pontos fortes
  if (essay.strengths?.length) {
    lines.push(SEP);
    lines.push(`✅ *PONTOS FORTES*`);
    lines.push('');
    essay.strengths.forEach((s: string) => lines.push(`• ${s}`));
    lines.push('');
  }

  // Pontos a melhorar
  if (essay.weaknesses?.length) {
    lines.push(SEP);
    lines.push(`⚠️ *PONTOS A MELHORAR*`);
    lines.push('');
    essay.weaknesses.forEach((s: string) => lines.push(`• ${s}`));
    lines.push('');
  }

  // Potencial de melhoria
  if (essay.improvementPotential) {
    lines.push(SEP);
    lines.push(`📈 *POTENCIAL DE MELHORIA*`);
    lines.push('');
    lines.push(essay.improvementPotential);
    lines.push('');
  }

  // Plano de melhoria
  if (essay.improvements?.length) {
    lines.push(SEP);
    lines.push(`🎯 *PLANO DE AÇÃO*`);
    lines.push('');
    essay.improvements.forEach((s: string) => lines.push(`• ${s}`));
    lines.push('');
  }

  // Vocabulário
  if (essay.vocabularyAnalysis?.frequentWords?.length) {
    lines.push(SEP);
    lines.push(`📚 *VOCABULÁRIO — ENRIQUEÇA SUA ESCRITA*`);
    lines.push('');
    lines.push(`_Palavras que você usa com frequência:_`);
    lines.push(essay.vocabularyAnalysis.frequentWords.map((w: string) => `"${w}"`).join(', '));

    if (essay.vocabularyAnalysis.synonymSuggestions?.length) {
      lines.push('');
      lines.push(`💡 *Sugestões de substituição:*`);
      essay.vocabularyAnalysis.synonymSuggestions.slice(0, 6).forEach((s: any) => {
        lines.push(`• *"${s.word}"* -> _${s.alternatives.slice(0, 4).join(', ')}_`);
        if (s.context) lines.push(`  _${s.context}_`);
      });
    }
    lines.push('');
  }

  // Orientação final
  if (essay.feedback) {
    lines.push(SEP);
    lines.push(`📝 *ORIENTAÇÃO FINAL*`);
    lines.push('');
    lines.push(essay.feedback);
    lines.push('');
  }

  lines.push(SEP);
  lines.push(`_Parecer gerado por ENEM IA_`);

  return lines.join('\n');
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const essays = useAppStore((state) => state.essays);
  const students = useAppStore((state) => state.students);
  const updateEssayTeacherEval = useAppStore((state) => state.updateEssayTeacherEval);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const isTeacher = currentTeacher != null;
  const [showTranscription, setShowTranscription] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [teacherEvalOpen, setTeacherEvalOpen] = useState(false);
  const [teacherScoreInput, setTeacherScoreInput] = useState('');
  const [teacherNoteInput, setTeacherNoteInput] = useState('');

  const essay = useMemo(() => essays.find((item) => item.id === id), [essays, id]);

  const studentName = useMemo(() => {
    if (!essay) return '';
    return students.find((student) => student.id === essay.studentId)?.name ?? 'Aluno';
  }, [essay, students]);

  const wordCount = useMemo(() => {
    if (!essay?.transcription?.trim()) return 0;
    return essay.transcription.trim().split(/\s+/).filter(Boolean).length;
  }, [essay?.transcription]);

  const paragraphCount = useMemo(() => {
    if (!essay?.transcription?.trim()) return 0;
    return essay.transcription.trim().split(/\n\n+/).filter(Boolean).length || 1;
  }, [essay?.transcription]);

  const handleShare = async () => {
    if (!essay) return;
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: buildShareText(essay, studentName),
        title: `Parecer — ${studentName}`,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o parecer.');
    } finally {
      setSharing(false);
    }
  };

  if (!essay) {
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack>
          <AppHeader title="Resultado" subtitle="Correção da redação." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Resultado não encontrado.
            </Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;
  const showReliabilityWarning =
    essay.scoreReliability?.level === 'media' || essay.scoreReliability?.level === 'baixa';

  return (
    <ProtectedRoute allowStudent>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Resultado"
          title={studentName}
          subtitle={essay.themeTitle}
        />

        {/* ── Score hero ── */}
        <StaggerItem index={0}>
          <ScoreSummaryCard
            totalScore={essay.totalScore}
            status={essay.status}
            reliabilityLevel={essay.scoreReliability?.level}
            reliabilityObservation={essay.scoreReliability?.observation}
          />
        </StaggerItem>

        {/* ── Share — compact pill ── */}
        <StaggerItem index={1}>
          <View style={styles.shareRow}>
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={[styles.sharePill, { opacity: sharing ? 0.7 : 1 }]}
            >
              <FontAwesome5 name="whatsapp" size={14} color="#FFFFFF" />
              <Text style={styles.sharePillText}>
                {sharing ? 'Gerando...' : 'Compartilhar'}
              </Text>
            </Pressable>
          </View>
        </StaggerItem>

        {/* ── Reliability warning ── */}
        {showReliabilityWarning ? (
          <StaggerItem index={2}>
            <Card style={[styles.warningCard, { borderColor: colors.warning }]}>
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.warningTitle, { color: colors.text }]}>
                    Atenção à confiabilidade
                  </Text>
                  <Text style={[styles.warningText, { color: colors.mutedText }]}>
                    {essay.scoreReliability?.observation ||
                      'A leitura da imagem trouxe algum nível de incerteza. Revise a transcrição com cuidado.'}
                  </Text>
                </View>
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* ── Mini competency overview ── */}
        {essay.competencies ? (
          <StaggerItem index={3}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.softText }]}>
                Visão geral das competências
              </Text>
              <View style={styles.compGrid}>
                {compKeys.map((k) => {
                  const score = essay.competencies?.[k] ?? 0;
                  const color = COMP_COLORS[k];
                  const pct = (score / 200) * 100;
                  return (
                    <View
                      key={k}
                      style={[styles.compChip, { backgroundColor: color + '12', borderColor: color + '28' }]}
                    >
                      <View style={styles.compChipHeader}>
                        <View style={[styles.compDot, { backgroundColor: color }]} />
                        <Text style={[styles.compChipKey, { color }]}>{k.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.compChipScore, { color }]}>{score}</Text>
                      <Text style={[styles.compChipLabel, { color: colors.mutedText }]}>
                        {COMP_META[k].label}
                      </Text>
                      <View style={[styles.compMiniTrack, { backgroundColor: colors.input }]}>
                        <View
                          style={[styles.compMiniFill, { width: `${pct}%`, backgroundColor: color }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* ── Mensagem direta ao aluno ── */}
        {essay.studentDirectMessage ? (
          <StaggerItem index={4}>
            <View style={[styles.studentMsgCard, { backgroundColor: colors.accent + '0E', borderColor: colors.accent + '30' }]}>
              <View style={styles.studentMsgHeader}>
                <View style={[styles.studentMsgIconWrap, { backgroundColor: colors.accent + '1A' }]}>
                  <Ionicons name="chatbubble-ellipses" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.studentMsgLabel, { color: colors.accent }]}>
                  Mensagem para o aluno
                </Text>
              </View>
              <Text style={[styles.studentMsgText, { color: colors.text }]}>
                {essay.studentDirectMessage}
              </Text>
            </View>
          </StaggerItem>
        ) : null}

        {/* ── Potencial de melhoria ── */}
        {essay.improvementPotential ? (
          <StaggerItem index={5}>
            <Card>
              <View style={styles.potentialHeader}>
                <Ionicons name="trending-up" size={16} color="#22C55E" />
                <Text style={[styles.sectionTitle, { color: colors.softText, marginBottom: 0 }]}>
                  Potencial de melhoria
                </Text>
              </View>
              <Text style={[styles.potentialText, { color: colors.text }]}>
                {essay.improvementPotential}
              </Text>
              {essay.totalScore !== undefined ? (
                <View style={[styles.statsBox, { backgroundColor: colors.input }]}>
                  <Text style={[styles.statsTitle, { color: colors.softText }]}>
                    Contexto ENEM (dados reais)
                  </Text>
                  <View style={styles.statsList}>
                    <StatRow icon="bar-chart-outline" text="Média nacional 2023: ~624 pts" colors={colors} />
                    <StatRow icon="people-outline" text="Top 10%: acima de 900 pts" colors={colors} />
                    <StatRow icon="star-outline" text="Nota 1000: <0,2% dos candidatos" colors={colors} />
                    <StatRow
                      icon="location-outline"
                      text={`Sua nota: ${essay.totalScore} pts — ${essay.totalScore >= 624 ? `${essay.totalScore - 624} acima da média` : `${624 - essay.totalScore} abaixo da média`}`}
                      colors={colors}
                      highlight
                    />
                  </View>
                </View>
              ) : null}
            </Card>
          </StaggerItem>
        ) : null}

        {/* ── Leitura pedagógica ── */}
        <StaggerItem index={6}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>
              Leitura didática para devolutiva
            </Text>

            <FeedbackBlock
              icon="school-outline"
              label="Resumo para o professor"
              text={essay.generalObservation ?? 'Sem observação geral disponível.'}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <FeedbackBlock
              icon="ribbon-outline"
              label="Reconhecimento ao aluno"
              text={essay.congratulations ?? 'Parabéns pelo esforço.'}
              colors={colors}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <FeedbackBlock
              icon="flag-outline"
              label="Orientação para reescrita"
              text={essay.feedback ?? 'Sem feedback disponível.'}
              colors={colors}
            />
          </Card>
        </StaggerItem>

        {/* ── Competências individuais ── */}
        {essay.competencies ? (
          <StaggerItem index={7}>
            <View style={styles.compSection}>
              <Text style={[styles.sectionTitleOutside, { color: colors.softText }]}>
                Detalhamento por competência
              </Text>
              {compKeys.map((k) => {
                const score = essay.competencies?.[k] ?? 0;
                const color = COMP_COLORS[k];
                const feedback = essay.competencyFeedbacks?.[k];
                const meta = COMP_META[k];
                const pct = (score / 200) * 100;
                return (
                  <CompetencyDetailCard
                    key={k}
                    shortKey={meta.short}
                    label={meta.label}
                    description={meta.description}
                    score={score}
                    scoreLabel={compScoreLabel(score)}
                    pct={pct}
                    color={color}
                    feedback={feedback}
                    colors={colors}
                  />
                );
              })}
            </View>
          </StaggerItem>
        ) : null}

        {/* ── Análise qualitativa ── */}
        <StaggerItem index={8}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>Análise qualitativa</Text>

            {essay.strengths?.length ? (
              <AnalysisGroup
                icon="checkmark-circle-outline"
                label="Pontos fortes"
                items={essay.strengths}
                color="#22C55E"
                colors={colors}
              />
            ) : null}

            {essay.weaknesses?.length ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <AnalysisGroup
                  icon="alert-circle-outline"
                  label="Pontos a melhorar"
                  items={essay.weaknesses}
                  color="#F97316"
                  colors={colors}
                />
              </>
            ) : null}

            {essay.improvements?.length ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <AnalysisGroup
                  icon="trending-up-outline"
                  label="Plano de melhoria"
                  items={essay.improvements}
                  color={colors.accent}
                  colors={colors}
                />
              </>
            ) : null}

            {!essay.strengths?.length && !essay.weaknesses?.length && !essay.improvements?.length ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                Sem análise qualitativa disponível.
              </Text>
            ) : null}
          </Card>
        </StaggerItem>

        {/* ── Vocabulário ── */}
        {essay.vocabularyAnalysis?.frequentWords?.length ? (
          <StaggerItem index={9}>
            <Card>
              <View style={styles.vocabHeader}>
                <Ionicons name="library-outline" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.softText, marginBottom: 0 }]}>
                  Análise de vocabulário
                </Text>
              </View>

              <Text style={[styles.vocabSubtitle, { color: colors.mutedText }]}>
                Palavras usadas com frequência nesta redação:
              </Text>
              <View style={styles.vocabChipsRow}>
                {essay.vocabularyAnalysis.frequentWords.map((word, i) => (
                  <View key={`${word}-${i}`} style={[styles.vocabChip, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <Text style={[styles.vocabChipText, { color: colors.softText }]}>{word}</Text>
                  </View>
                ))}
              </View>

              {essay.vocabularyAnalysis.synonymSuggestions?.length ? (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.vocabSubtitle, { color: colors.mutedText }]}>
                    Sugestões para enriquecer o vocabulário:
                  </Text>
                  <View style={styles.synonymList}>
                    {essay.vocabularyAnalysis.synonymSuggestions.map((item, i) => (
                      <View
                        key={`${item.word}-${i}`}
                        style={[styles.synonymItem, { borderColor: colors.border }, i > 0 && { borderTopWidth: 1 }]}
                      >
                        <View style={styles.synonymWordRow}>
                          <View style={[styles.synonymOriginalPill, { backgroundColor: colors.accent + '14' }]}>
                            <Text style={[styles.synonymOriginalText, { color: colors.accent }]}>
                              {item.word}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={12} color={colors.mutedText} />
                          <View style={styles.synonymAltWrap}>
                            {item.alternatives.slice(0, 4).map((alt, j) => (
                              <View key={`${alt}-${j}`} style={[styles.synonymAltPill, { backgroundColor: colors.input }]}>
                                <Text style={[styles.synonymAltText, { color: colors.text }]}>{alt}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        {item.context ? (
                          <Text style={[styles.synonymContext, { color: colors.mutedText }]}>
                            {item.context}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </Card>
          </StaggerItem>
        ) : null}

        {/* ── Contexto da correção ── */}
        <StaggerItem index={10}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>Contexto da correção</Text>
            <InfoRow label="Tema trabalhado" value={essay.themeTitle} colors={colors} />
            <InfoRow label="Tipo de escrita" value={essay.writingMode ?? 'Não identificado'} colors={colors} />
            <InfoRow label="Adequação ao tema" value={essay.themeAdequacy?.level ?? 'Não informado'} colors={colors} />
            <InfoRow label="Confiança da transcrição" value={essay.transcriptionConfidence ?? 'Não informada'} colors={colors} last />
          </Card>
        </StaggerItem>

        {/* ── Transcrição — acordeão ── */}
        <StaggerItem index={11}>
          <Card>
            <Pressable
              onPress={() => setShowTranscription((v) => !v)}
              style={styles.accordionHeader}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons name="document-text-outline" size={16} color={colors.mutedText} />
                <Text style={[styles.sectionTitle, { color: colors.softText, marginBottom: 0 }]}>
                  Transcrição da redação
                </Text>
              </View>
              <View style={styles.accordionHeaderRight}>
                {wordCount > 0 && !showTranscription ? (
                  <View style={[styles.wordChip, { backgroundColor: colors.input }]}>
                    <Text style={[styles.wordChipText, { color: colors.softText }]}>{wordCount} palavras</Text>
                  </View>
                ) : null}
                <Ionicons
                  name={showTranscription ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.mutedText}
                />
              </View>
            </Pressable>

            {!showTranscription ? (
              <Text style={[styles.accordionHint, { color: colors.mutedText }]}>
                Toque para ver a transcrição completa
              </Text>
            ) : (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {wordCount > 0 ? (
                  <View style={styles.wordCountRow}>
                    <View style={[styles.wordCountChip, { backgroundColor: colors.input }]}>
                      <Text style={[styles.wordCountText, { color: colors.softText }]}>
                        {wordCount} palavras
                      </Text>
                    </View>
                    <View style={[styles.wordCountChip, { backgroundColor: colors.input }]}>
                      <Text style={[styles.wordCountText, { color: colors.softText }]}>
                        {paragraphCount} parágrafo{paragraphCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {essay.legibility?.observation ? (
                  <MiniBlock title="Legibilidade" text={essay.legibility.observation} colors={colors} />
                ) : null}

                {essay.legibility?.illegibleExcerpt ? (
                  <MiniBlock
                    title="Trecho com leitura difícil"
                    text={essay.legibility.illegibleExcerpt}
                    colors={colors}
                  />
                ) : null}

                <MiniBlock
                  title="Transcrição completa"
                  text={essay.transcription || 'A transcrição ainda não foi gerada.'}
                  colors={colors}
                  mono
                />

                {essay.transcriptionNotes ? (
                  <MiniBlock title="Notas da transcrição" text={essay.transcriptionNotes} colors={colors} />
                ) : null}
              </View>
            )}
          </Card>
        </StaggerItem>

        {/* ── Avaliação do professor ── */}
        {isTeacher ? (
          <StaggerItem index={20}>
            <View style={[styles.teacherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.teacherHeader}>
                <View style={[styles.teacherIconWrap, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teacherTitle, { color: colors.text }]}>
                    Avaliação do professor
                  </Text>
                  <Text style={[styles.teacherSub, { color: colors.mutedText }]}>
                    Opcional — adicione sua nota e parecer
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (!teacherEvalOpen) {
                      setTeacherScoreInput(essay.teacherScore != null ? String(essay.teacherScore) : '');
                      setTeacherNoteInput(essay.teacherNote ?? '');
                    }
                    setTeacherEvalOpen((v) => !v);
                  }}
                  style={[styles.teacherToggleBtn, { backgroundColor: teacherEvalOpen ? colors.accent : colors.input }]}
                >
                  <Ionicons
                    name={teacherEvalOpen ? 'chevron-up' : (essay.teacherScore != null || essay.teacherNote ? 'pencil' : 'add')}
                    size={16}
                    color={teacherEvalOpen ? '#fff' : colors.accent}
                  />
                </Pressable>
              </View>

              {/* Saved preview */}
              {!teacherEvalOpen && (essay.teacherScore != null || essay.teacherNote) && (
                <View style={[styles.teacherPreview, { backgroundColor: colors.input, borderRadius: 12 }]}>
                  {essay.teacherScore != null && (
                    <View style={styles.teacherPreviewScore}>
                      <Text style={[styles.teacherPreviewScoreNum, { color: colors.accent }]}>
                        {essay.teacherScore}
                      </Text>
                      <Text style={[styles.teacherPreviewScoreLabel, { color: colors.mutedText }]}>
                        /1000 — nota do professor
                      </Text>
                    </View>
                  )}
                  {essay.teacherNote ? (
                    <Text style={[styles.teacherPreviewNote, { color: colors.softText }]} numberOfLines={3}>
                      {essay.teacherNote}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Form */}
              {teacherEvalOpen && (
                <View style={styles.teacherForm}>
                  <View style={styles.teacherFormField}>
                    <Text style={[styles.teacherFormLabel, { color: colors.softText }]}>
                      Sua nota (0–1000)
                    </Text>
                    <View style={[styles.teacherScoreInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                      <TextInput
                        style={[styles.teacherScoreText, { color: colors.text }]}
                        placeholder="Ex.: 720"
                        placeholderTextColor={colors.mutedText}
                        value={teacherScoreInput}
                        onChangeText={(v) => {
                          const n = v.replace(/[^0-9]/g, '');
                          if (n === '' || (parseInt(n) >= 0 && parseInt(n) <= 1000)) setTeacherScoreInput(n);
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                      <Text style={[styles.teacherScoreDenom, { color: colors.mutedText }]}>/1000</Text>
                    </View>
                  </View>

                  <View style={styles.teacherFormField}>
                    <Text style={[styles.teacherFormLabel, { color: colors.softText }]}>
                      Seu parecer
                    </Text>
                    <TextInput
                      style={[
                        styles.teacherNoteInput,
                        { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
                      ]}
                      placeholder="Escreva seu comentário ou feedback para o aluno..."
                      placeholderTextColor={colors.mutedText}
                      value={teacherNoteInput}
                      onChangeText={setTeacherNoteInput}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.teacherFormActions}>
                    <Pressable
                      onPress={() => setTeacherEvalOpen(false)}
                      style={[styles.teacherCancelBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.teacherCancelText, { color: colors.mutedText }]}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const score = teacherScoreInput ? parseInt(teacherScoreInput) : undefined;
                        updateEssayTeacherEval(essay.id, score, teacherNoteInput);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setTeacherEvalOpen(false);
                      }}
                      style={[styles.teacherSaveBtn, { backgroundColor: colors.accent }]}
                    >
                      <Ionicons name="checkmark-outline" size={16} color="#fff" />
                      <Text style={styles.teacherSaveText}>Salvar avaliação</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </StaggerItem>
        ) : (essay.teacherScore != null || essay.teacherNote) ? (
          <StaggerItem index={20}>
            <View style={[styles.teacherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.teacherHeader}>
                <View style={[styles.teacherIconWrap, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teacherTitle, { color: colors.text }]}>
                    Parecer do professor
                  </Text>
                </View>
              </View>
              <View style={[styles.teacherPreview, { backgroundColor: colors.input, borderRadius: 12 }]}>
                {essay.teacherScore != null && (
                  <View style={styles.teacherPreviewScore}>
                    <Text style={[styles.teacherPreviewScoreNum, { color: colors.accent }]}>
                      {essay.teacherScore}
                    </Text>
                    <Text style={[styles.teacherPreviewScoreLabel, { color: colors.mutedText }]}>
                      /1000 — nota do professor
                    </Text>
                  </View>
                )}
                {essay.teacherNote ? (
                  <Text style={[styles.teacherPreviewNote, { color: colors.softText }]}>
                    {essay.teacherNote}
                  </Text>
                ) : null}
              </View>
            </View>
          </StaggerItem>
        ) : null}

      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompetencyDetailCard({
  shortKey, label, description, score, scoreLabel: sLabel,
  pct, color, feedback, colors,
}: {
  shortKey: string; label: string; description: string; score: number;
  scoreLabel: string; pct: number; color: string;
  feedback?: { diagnosis?: string; positive?: string; improvement?: string };
  colors: any;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[styles.compDetailCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <View style={styles.compDetailHeader}>
        <View style={[styles.compDetailBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.compDetailBadgeText, { color }]}>{shortKey}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.compDetailLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.compDetailDesc, { color: colors.mutedText }]} numberOfLines={expanded ? undefined : 1}>
            {description}
          </Text>
        </View>
        <View style={styles.compDetailScoreWrap}>
          <Text style={[styles.compDetailScore, { color }]}>{score}</Text>
          <Text style={[styles.compDetailScoreMax, { color: color + '80' }]}>/200</Text>
        </View>
      </View>

      <View style={[styles.compDetailTrack, { backgroundColor: colors.input }]}>
        <View style={[styles.compDetailFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.compDetailFooter}>
        <View style={[styles.compScoreLabelPill, { backgroundColor: color + '14' }]}>
          <Text style={[styles.compScoreLabelText, { color }]}>{sLabel}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedText} />
      </View>

      {expanded && feedback ? (
        <View style={[styles.compDetailExpanded, { borderTopColor: colors.border }]}>
          {feedback.diagnosis ? (
            <MiniBlock title="Diagnóstico" text={feedback.diagnosis} colors={colors} />
          ) : null}
          {feedback.positive ? (
            <MiniBlock title="O que já funciona bem" text={feedback.positive} colors={colors} />
          ) : null}
          {feedback.improvement ? (
            <MiniBlock title="Próximo passo" text={feedback.improvement} colors={colors} />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function FeedbackBlock({ icon, label, text, colors }: {
  icon: any; label: string; text: string; colors: any;
}) {
  return (
    <View style={styles.feedbackBlock}>
      <View style={styles.feedbackBlockHeader}>
        <Ionicons name={icon} size={15} color={colors.accent} />
        <Text style={[styles.feedbackBlockLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Text style={[styles.feedbackBlockText, { color: colors.mutedText }]}>{text}</Text>
    </View>
  );
}

function AnalysisGroup({ icon, label, items, color, colors }: {
  icon: any; label: string; items: string[]; color: string; colors: any;
}) {
  return (
    <View style={styles.analysisGroup}>
      <View style={styles.analysisGroupHeader}>
        <Ionicons name={icon} size={15} color={color} />
        <Text style={[styles.analysisGroupLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.bulletList}>
        {items.map((item, i) => (
          <View key={`${item}-${i}`} style={styles.bulletItem}>
            <View style={[styles.bulletDot, { backgroundColor: color }]} />
            <Text style={[styles.bulletText, { color: colors.mutedText }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatRow({ icon, text, colors, highlight }: {
  icon: any; text: string; colors: any; highlight?: boolean;
}) {
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon} size={13} color={highlight ? colors.accent : colors.mutedText} />
      <Text style={[styles.statText, { color: highlight ? colors.text : colors.mutedText, fontWeight: highlight ? '600' : '400' }]}>
        {text}
      </Text>
    </View>
  );
}

function InfoRow({ label, value, colors, last }: {
  label: string; value: string; colors: any; last?: boolean;
}) {
  return (
    <View style={[styles.metaRow, { borderBottomColor: colors.border }, last && styles.metaRowLast]}>
      <Text style={[styles.metaLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function MiniBlock({ title, text, colors, mono }: {
  title: string; text?: string; colors: any; mono?: boolean;
}) {
  return (
    <View style={styles.miniBlock}>
      <Text style={[styles.miniBlockTitle, { color: colors.softText }]}>{title}</Text>
      <Text style={[styles.miniBlockText, { color: colors.mutedText }, mono && styles.monoText]}>
        {text ?? 'Sem informação disponível.'}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  emptyText: { fontSize: 15, lineHeight: 22 },
  divider: { height: 1, marginVertical: theme.spacing.md },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 14,
  },
  sectionTitleOutside: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 10,
  },

  // Share
  shareRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  sharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sharePillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Warning
  warningCard: { borderWidth: 1 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  warningTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  warningText: { fontSize: 13, lineHeight: 20 },

  // Competency overview grid
  compGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compChip: {
    width: '18%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    minWidth: 58,
  },
  compChipHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compDot: { width: 6, height: 6, borderRadius: 3 },
  compChipKey: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  compChipScore: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, lineHeight: 24 },
  compChipLabel: { fontSize: 9, fontWeight: '500', lineHeight: 12 },
  compMiniTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  compMiniFill: { height: '100%', borderRadius: 2 },

  // Student direct message
  studentMsgCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: 10,
  },
  studentMsgHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  studentMsgIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  studentMsgLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  studentMsgText: { fontSize: 15, lineHeight: 24 },

  // Improvement potential
  potentialHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  potentialText: { fontSize: 14, lineHeight: 22, marginBottom: theme.spacing.md },
  statsBox: { borderRadius: 12, padding: theme.spacing.md, gap: 8 },
  statsTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1, marginBottom: 4 },
  statsList: { gap: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statText: { fontSize: 13, lineHeight: 18 },

  // Pedagogical feedback
  feedbackBlock: { gap: 6 },
  feedbackBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackBlockLabel: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  feedbackBlockText: { fontSize: 14, lineHeight: 22 },

  // Competency detail
  compSection: { gap: 8 },
  compDetailCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: 8,
  },
  compDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compDetailBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  compDetailBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  compDetailLabel: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  compDetailDesc: { fontSize: 12, lineHeight: 16 },
  compDetailScoreWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  compDetailScore: { fontSize: 22, fontWeight: '700', lineHeight: 26, letterSpacing: -0.3 },
  compDetailScoreMax: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  compDetailTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  compDetailFill: { height: '100%', borderRadius: 3 },
  compDetailFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  compScoreLabelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  compScoreLabelText: { fontSize: 11, fontWeight: '700' },
  compDetailExpanded: {
    marginTop: 4, paddingTop: theme.spacing.md,
    borderTopWidth: 1, gap: theme.spacing.sm,
  },

  // Analysis
  analysisGroup: { gap: 8 },
  analysisGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analysisGroupLabel: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  bulletList: { gap: 6, paddingLeft: 4 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22 },

  // Vocabulary
  vocabHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  vocabSubtitle: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  vocabChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vocabChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },
  vocabChipText: { fontSize: 13, fontWeight: '500' },
  synonymList: { gap: 0 },
  synonymItem: { paddingVertical: 12, gap: 8 },
  synonymWordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  synonymOriginalPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  synonymOriginalText: { fontSize: 13, fontWeight: '700' },
  synonymAltWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  synonymAltPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  synonymAltText: { fontSize: 12, fontWeight: '500' },
  synonymContext: { fontSize: 11, lineHeight: 17 },

  // Context meta
  metaRow: {
    gap: 3,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  metaRowLast: { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
  metaLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  metaValue: { fontSize: 15, lineHeight: 22 },

  // Transcription
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accordionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionHint: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  accordionBody: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    gap: theme.spacing.md,
  },
  wordCountRow: { flexDirection: 'row', gap: 8 },
  wordCountChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  wordCountText: { fontSize: 11, fontWeight: '600' },
  wordChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  wordChipText: { fontSize: 10, fontWeight: '600' },

  // Mini blocks
  miniBlock: { gap: 4 },
  miniBlockTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  miniBlockText: { fontSize: 13, lineHeight: 20 },
  monoText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 22 },

  // Teacher evaluation card
  teacherCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  teacherHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  teacherTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  teacherSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  teacherToggleBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  teacherPreview: { padding: 14, gap: 8 },
  teacherPreviewScore: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  teacherPreviewScoreNum: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  teacherPreviewScoreLabel: { fontSize: 13 },
  teacherPreviewNote: { fontSize: 13, lineHeight: 20 },
  teacherForm: { gap: 14 },
  teacherFormField: { gap: 7 },
  teacherFormLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  teacherScoreInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  teacherScoreText: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, minWidth: 60 },
  teacherScoreDenom: { fontSize: 16, fontWeight: '500' },
  teacherNoteInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 110,
  },
  teacherFormActions: { flexDirection: 'row', gap: 10 },
  teacherCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherCancelText: { fontSize: 14, fontWeight: '600' },
  teacherSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    paddingVertical: 12,
  },
  teacherSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
