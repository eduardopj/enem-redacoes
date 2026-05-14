import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Accordion,
  AnimatedNumber,
  AppHeader,
  Button,
  Card,
  CompetencyProgress,
  ScoreCelebration,
  ScreenContainer,
  SkeletonResultado,
  StaggerItem,
  StatusBadge,
} from '@/components/ui';
import { EvolutionBanner } from '@/components/ui/EvolutionBanner';
import { fetchEssayDetail } from '@/services/sync/sync-essays';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getCompColors, getScoreColor, getScoreLabel, isCorrectedEssay } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

type ResultTab = 'resumo' | 'competencias' | 'plano' | 'texto';

const COMP_LABELS: Record<string, string> = {
  c1: 'C1 - Norma culta',
  c2: 'C2 - Tema e repertório',
  c3: 'C3 - Argumentação',
  c4: 'C4 - Coesão',
  c5: 'C5 - Intervenção',
};

function scoreText(score?: number) {
  if (typeof score !== 'number') return '--';
  return String(score);
}

function scoreGap(aiScore?: number, teacherScore?: number) {
  if (typeof aiScore !== 'number' || typeof teacherScore !== 'number') return null;
  return teacherScore - aiScore;
}

function buildShareText(essay: Essay, studentName: string) {
  const rows = [
    `Parecer ENEM IA`,
    `Aluno: ${studentName}`,
    `Tema: ${essay.themeTitle}`,
    `Nota IA: ${essay.totalScore ?? '--'}/1000`,
  ];

  if (essay.teacherScore != null) rows.push(`Nota do professor: ${essay.teacherScore}/1000`);

  if (essay.competencies) {
    rows.push('');
    rows.push('Competências:');
    rows.push(`C1: ${essay.competencies.c1}/200`);
    rows.push(`C2: ${essay.competencies.c2}/200`);
    rows.push(`C3: ${essay.competencies.c3}/200`);
    rows.push(`C4: ${essay.competencies.c4}/200`);
    rows.push(`C5: ${essay.competencies.c5}/200`);
  }

  if (essay.strengths?.length) {
    rows.push('');
    rows.push('Pontos fortes:');
    essay.strengths.slice(0, 4).forEach((item) => rows.push(`- ${item}`));
  }

  if (essay.improvements?.length) {
    rows.push('');
    rows.push('Próximos passos:');
    essay.improvements.slice(0, 4).forEach((item) => rows.push(`- ${item}`));
  }

  if (essay.studentDirectMessage || essay.feedback) {
    rows.push('');
    rows.push(essay.studentDirectMessage || essay.feedback || '');
  }

  return rows.join('\n');
}

export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const essays = useAppStore((state) => state.essays);
  const students = useAppStore((state) => state.students);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const updateEssayTeacherEval = useAppStore((state) => state.updateEssayTeacherEval);
  const markEssayTeacherViewed = useAppStore((state) => state.markEssayTeacherViewed);
  const updateEssayCorrection = useAppStore((state) => state.updateEssayCorrection);
  const backendToken = useAppStore((state) => state.backendToken);

  const [showCelebration, setShowCelebration] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const hasFetchedDetail = useRef(false);
  const [activeTab, setActiveTab] = useState<ResultTab>('resumo');
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherScoreInput, setTeacherScoreInput] = useState('');
  const [teacherNoteInput, setTeacherNoteInput] = useState('');

  const essay = useMemo(() => essays.find((item) => item.id === id), [essays, id]);
  const student = useMemo(
    () => (essay ? students.find((item) => item.id === essay.studentId) : undefined),
    [essay, students]
  );

  // Mark as reviewed when the teacher opens a student-submitted essay
  useEffect(() => {
    if (currentTeacher && essay?.submittedByStudent && !essay.teacherReviewedAt) {
      markEssayTeacherViewed(essay.id);
    }
  }, [essay?.id]);

  // Lazy-load correction details stripped from AsyncStorage (heavy fields)
  useEffect(() => {
    if (!essay || !isCorrectedEssay(essay) || hasFetchedDetail.current) return;
    if (essay.competencyFeedbacks || (essay.strengths?.length && essay.feedback)) return;
    hasFetchedDetail.current = true;
    setLoadingDetail(true);
    fetchEssayDetail(essay.id, backendToken ?? undefined)
      .then((remote) => {
        if (remote?.correctionJson) updateEssayCorrection(essay.id, remote.correctionJson);
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [essay?.id]);

  if (!essay) {
    // Redação não encontrada de jeito nenhum
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack topBarTitle="Resultado">
          <AppHeader title="Resultado" subtitle="Resultado não encontrado." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Esta redação não foi encontrada.
            </Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  // Corrected essay with heavy fields being lazy-loaded from backend
  if (isCorrectedEssay(essay) && loadingDetail && !essay.competencyFeedbacks) {
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack topBarTitle="Resultado">
          <AppHeader eyebrow="Carregando" title="Buscando detalhes…" subtitle={essay.themeTitle} />
          <SkeletonResultado />
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  // Redação existe mas ainda está sendo processada → skeleton informativo
  if (!isCorrectedEssay(essay)) {
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack topBarTitle="Resultado">
          <AppHeader
            eyebrow="Aguardando"
            title="Corrigindo…"
            subtitle={essay.themeTitle ?? 'A IA está analisando a redação'}
          />
          <SkeletonResultado />
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  const studentName = student?.name ?? 'Aluno';
  const aiScore = essay.totalScore ?? 0;
  const scoreColor = getScoreColor(aiScore, colors);
  const confidence = essay.scoreReliability?.level ?? essay.confidenceLevel ?? 'media';
  const lowConfidence =
    confidence === 'baixa' ||
    essay.transcriptionConfidence === 'baixa' ||
    essay.reviewRequired ||
    essay.status === 'baixa_confiabilidade';
  const gap = scoreGap(essay.totalScore, essay.teacherScore);
  const teacherReviewed = Boolean(essay.teacherReviewedAt);

  async function handleShare() {
    await Share.share({
      title: 'Parecer da redação',
      message: buildShareText(essay, studentName),
    });
  }

  function openTeacherEval() {
    setTeacherScoreInput(essay.teacherScore != null ? String(essay.teacherScore) : '');
    setTeacherNoteInput(essay.teacherNote ?? '');
    setTeacherOpen(true);
  }

  function saveTeacherEval() {
    const score = teacherScoreInput.trim() ? Number(teacherScoreInput) : undefined;
    if (score != null && (!Number.isFinite(score) || score < 0 || score > 1000)) {
      Alert.alert('Nota inválida', 'Informe uma nota entre 0 e 1000.');
      return;
    }
    updateEssayTeacherEval(essay.id, score, teacherNoteInput.trim());
    setTeacherOpen(false);
  }

  return (
    <ProtectedRoute allowStudent>
      <ScoreCelebration
        score={aiScore}
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />
      <ScreenContainer showBack topBarTitle="Resultado">
        <AppHeader eyebrow="Resultado" title={studentName} subtitle={essay.themeTitle} />

        {/* Banner de evolução — aparece se houver redação anterior */}
        <EvolutionBanner currentEssay={essay} allEssays={essays} />

        <Card style={[styles.heroCard, { borderColor: scoreColor + '35' }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroKicker, { color: colors.mutedText }]}>Nota da IA</Text>
              <View style={styles.scoreRow}>
                <AnimatedNumber value={aiScore} style={[styles.score, { color: scoreColor }]} />
                <Text style={[styles.scoreBase, { color: colors.mutedText }]}>/1000</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{getScoreLabel(aiScore)}</Text>
            </View>
            <View style={styles.heroStatus}>
              <StatusBadge status={essay.status} />
              <View style={[styles.confidencePill, { backgroundColor: lowConfidence ? colors.warningSoft : colors.successSoft }]}>
                <Ionicons
                  name={lowConfidence ? 'warning-outline' : 'shield-checkmark-outline'}
                  size={13}
                  color={lowConfidence ? colors.warning : colors.success}
                />
                <Text style={[styles.confidenceText, { color: lowConfidence ? colors.warning : colors.success }]}>
                  {lowConfidence ? 'Revisão indicada' : `Confiança ${confidence}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.aiPanel, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <View style={[styles.aiIcon, { backgroundColor: colors.accent + '16' }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: colors.text }]}>Correção gerada pela IA</Text>
              <Text style={[styles.aiText, { color: colors.mutedText }]}>
                Use como apoio pedagógico. A decisão final continua sendo do professor.
              </Text>
            </View>
          </View>

          {currentTeacher ? (
            <View style={[styles.teacherPanel, { borderTopColor: colors.border }]}>
              <View style={styles.teacherTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.teacherTitleRow}>
                    <Text style={[styles.teacherTitle, { color: colors.text }]}>Avaliação do professor</Text>
                    {teacherReviewed ? (
                      <View style={[styles.teacherReviewedPill, { backgroundColor: colors.successSoft }]}>
                        <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                        <Text style={[styles.teacherReviewedText, { color: colors.success }]}>Revisada</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.teacherSub, { color: colors.mutedText }]}>
                    {teacherReviewed
                      ? 'Nota final validada pelo professor.'
                      : 'Destaque sua nota final e observações manuais.'}
                  </Text>
                </View>
                <Pressable
                onPress={teacherOpen ? () => setTeacherOpen(false) : openTeacherEval}
                style={[styles.iconButton, { backgroundColor: colors.input }]}
                accessibilityLabel={teacherOpen ? 'Fechar edição' : 'Editar avaliação do professor'}
              >
                  <Ionicons name={teacherOpen ? 'chevron-up' : 'pencil-outline'} size={17} color={colors.accent} />
                </Pressable>
              </View>

              {!teacherOpen ? (
                <View style={styles.teacherPreviewRow}>
                  <View style={[styles.teacherScoreBox, { backgroundColor: colors.accent + '12' }]}>
                    <Text style={[styles.teacherScore, { color: colors.accent }]}>
                      {scoreText(essay.teacherScore)}
                    </Text>
                    <Text style={[styles.teacherScoreLabel, { color: colors.mutedText }]}>professor</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teacherNote, { color: colors.softText }]} numberOfLines={3}>
                      {essay.teacherNote || 'Nenhuma observação manual ainda.'}
                    </Text>
                    {gap != null ? (
                      <Text style={[styles.teacherGap, { color: gap >= 0 ? colors.success : colors.warning }]}>
                        {gap >= 0 ? '+' : ''}{gap} pts em relação à IA
                      </Text>
                    ) : null}
                    {teacherReviewed ? (
                      <Text style={[styles.teacherReviewedDate, { color: colors.mutedText }]}>
                        Revisão humana salva
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={styles.teacherForm}>
                  <TextInput
                    value={teacherScoreInput}
                    onChangeText={setTeacherScoreInput}
                    placeholder="Nota final do professor"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.teacherInput, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                  />
                  <TextInput
                    value={teacherNoteInput}
                    onChangeText={setTeacherNoteInput}
                    placeholder="Observação pedagógica do professor"
                    placeholderTextColor={colors.mutedText}
                    multiline
                    style={[styles.teacherTextarea, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                  />
                  <View style={styles.teacherActions}>
                    <Button title="Cancelar" variant="secondary" onPress={() => setTeacherOpen(false)} />
                    <Button title="Salvar" leftIcon="checkmark-outline" onPress={saveTeacherEval} />
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </Card>

        <View style={[styles.tabs, { backgroundColor: colors.input }]}>
          {(['resumo', 'competencias', 'plano', 'texto'] as ResultTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.accent : colors.mutedText }]}>
                {tab === 'resumo' ? 'Resumo' : tab === 'competencias' ? 'C1-C5' : tab === 'plano' ? 'Plano' : 'Texto'}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'resumo' ? <ResumoTab essay={essay} colors={colors} /> : null}
        {activeTab === 'competencias' ? <CompetenciasTab essay={essay} colors={colors} /> : null}
        {activeTab === 'plano' ? <PlanoTab essay={essay} colors={colors} /> : null}
        {activeTab === 'texto' ? <TextoTab essay={essay} colors={colors} token={backendToken} /> : null}

        <View style={styles.actions}>
          <Button
            title="Gerar devolutiva"
            variant="dark"
            leftIcon="share-social-outline"
            onPress={handleShare}
          />
          {currentTeacher && !teacherReviewed ? (
            <Button
              title="Revisar como professor"
              variant="outline"
              leftIcon="shield-checkmark-outline"
              onPress={openTeacherEval}
            />
          ) : null}
          <Button
            title="Nova redação"
            variant="secondary"
            leftIcon="add-circle-outline"
            onPress={() => router.push(`/nova-redacao?studentId=${essay.studentId}` as any)}
          />
          <Button
            title="Voltar ao aluno"
            variant="soft"
            leftIcon="person-outline"
            onPress={() => router.push(`/aluno/${essay.studentId}` as any)}
          />
        </View>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function ResumoTab({ essay, colors }: { essay: Essay; colors: any }) {
  return (
    <>
      <StaggerItem index={0}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leitura pedagógica</Text>
          <View style={styles.insightGrid}>
            <MiniInsight label="Tema" value={essay.themeAdequacy?.level ?? 'pendente'} icon="flag-outline" colors={colors} />
            <MiniInsight label="Leitura" value={essay.transcriptionConfidence ?? 'media'} icon="eye-outline" colors={colors} />
            <MiniInsight label="Modo" value={essay.writingMode ?? 'indefinido'} icon="create-outline" colors={colors} />
          </View>
          {essay.generalObservation ? (
            <Text style={[styles.paragraph, { color: colors.softText }]}>{essay.generalObservation}</Text>
          ) : null}
        </Card>
      </StaggerItem>

      <StaggerItem index={1}>
        <BulletsCard title="Pontos fortes" icon="checkmark-circle-outline" items={essay.strengths} color={colors.success} colors={colors} />
      </StaggerItem>
      <StaggerItem index={2}>
        <BulletsCard title="Prioridades" icon="alert-circle-outline" items={essay.weaknesses} color={colors.warning} colors={colors} />
      </StaggerItem>
    </>
  );
}

function CompetenciasTab({ essay, colors }: { essay: Essay; colors: any }) {
  if (!essay.competencies) {
    return <Card><Text style={[styles.paragraph, { color: colors.mutedText }]}>Sem competências disponíveis.</Text></Card>;
  }

  const entries = Object.entries(essay.competencies);

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Competências ENEM</Text>
      <View style={styles.competencyList}>
        {entries.map(([key, score]) => {
          const feedback = essay.competencyFeedbacks?.[key as keyof Essay['competencyFeedbacks']];
          return (
            <Accordion
              key={key}
              title={COMP_LABELS[key] ?? key.toUpperCase()}
              subtitle={`${score}/200 - toque para ver diagnóstico`}
            >
              <CompetencyProgress label={COMP_LABELS[key] ?? key.toUpperCase()} score={score} color={getCompColors(colors)[key]} />
              {feedback ? (
                <View style={styles.feedbackBlock}>
                  <FeedbackLine title="Diagnóstico" text={feedback.diagnosis} colors={colors} />
                  <FeedbackLine title="Ponto positivo" text={feedback.positive} colors={colors} />
                  <FeedbackLine title="Melhoria" text={feedback.improvement} colors={colors} />
                </View>
              ) : null}
            </Accordion>
          );
        })}
      </View>
    </Card>
  );
}

function PlanoTab({ essay, colors }: { essay: Essay; colors: any }) {
  return (
    <>
      <BulletsCard title="Plano de melhoria" icon="trail-sign-outline" items={essay.improvements} color={colors.accent} colors={colors} />
      {essay.improvementPotential ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Potencial de evolução</Text>
          <Text style={[styles.paragraph, { color: colors.softText }]}>{essay.improvementPotential}</Text>
        </Card>
      ) : null}
      {essay.studentDirectMessage || essay.feedback ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Devolutiva curta</Text>
          <Text style={[styles.paragraph, { color: colors.softText }]}>
            {essay.studentDirectMessage || essay.feedback}
          </Text>
        </Card>
      ) : null}
      {essay.vocabularyAnalysis?.frequentWords?.length ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vocabulário</Text>
          <View style={styles.wordWrap}>
            {essay.vocabularyAnalysis.frequentWords.slice(0, 10).map((word) => (
              <View key={word} style={[styles.wordPill, { backgroundColor: colors.input }]}>
                <Text style={[styles.wordText, { color: colors.softText }]}>{word}</Text>
              </View>
            ))}
          </View>
          {essay.vocabularyAnalysis.synonymSuggestions?.slice(0, 4).map((item) => (
            <Text key={item.word} style={[styles.paragraphSmall, { color: colors.mutedText }]}>
              {item.word}: {item.alternatives.join(', ')}
            </Text>
          ))}
        </Card>
      ) : null}
    </>
  );
}

function TextoTab({ essay, colors, token }: { essay: Essay; colors: any; token?: string | null }) {
  const imageSource = essay.imageUri
    ? { uri: essay.imageUri }
    : essay.imageRemoteUrl
    ? { uri: essay.imageRemoteUrl, headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    : null;

  return (
    <>
      {imageSource ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Imagem enviada</Text>
          <Image source={imageSource} style={[styles.preview, { borderColor: colors.border }]} contentFit="contain" />
        </Card>
      ) : null}
      <Accordion title="Transcrição" subtitle={essay.transcriptionConfidence ? `confiança ${essay.transcriptionConfidence}` : undefined} defaultOpen>
        <Text style={[styles.transcription, { color: colors.softText }]}>
          {essay.transcription || 'Transcrição não disponível.'}
        </Text>
      </Accordion>
      <Accordion title="Feedback completo">
        <Text style={[styles.transcription, { color: colors.softText }]}>
          {essay.feedback || essay.generalObservation || 'Feedback completo não disponível.'}
        </Text>
      </Accordion>
    </>
  );
}

function MiniInsight({ label, value, icon, colors }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; colors: any }) {
  return (
    <View style={[styles.miniInsight, { backgroundColor: colors.input }]}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={[styles.miniLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.miniValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function BulletsCard({ title, icon, items, color, colors }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items?: string[];
  color: string;
  colors: any;
}) {
  if (!items?.length) return null;
  return (
    <Card>
      <View style={styles.cardTitleRow}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{title}</Text>
      </View>
      <View style={styles.bulletList}>
        {items.slice(0, 6).map((item, index) => (
          <View key={`${item}-${index}`} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: color }]} />
            <Text style={[styles.bulletText, { color: colors.softText }]}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function FeedbackLine({ title, text, colors }: { title: string; text: string; colors: any }) {
  return (
    <View style={styles.feedbackLine}>
      <Text style={[styles.feedbackTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.feedbackText, { color: colors.mutedText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 16, lineHeight: 26, fontFamily: 'Inter_400Regular' },
  heroCard: { borderWidth: 1, gap: theme.spacing.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md },
  heroKicker: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, fontFamily: 'Inter_700Bold' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontSize: 56, lineHeight: 62, fontWeight: '900', letterSpacing: 0, fontFamily: 'Nunito_900Black' },
  scoreBase: { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  scoreLabel: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  heroStatus: { alignItems: 'flex-end', gap: 8 },
  confidencePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  confidenceText: { fontSize: 12, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  aiPanel: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  aiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 15, fontWeight: '800', lineHeight: 22, fontFamily: 'Inter_700Bold' },
  aiText: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  teacherPanel: { borderTopWidth: 1, paddingTop: theme.spacing.md, gap: theme.spacing.md },
  teacherTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teacherTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  teacherTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  teacherReviewedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  teacherReviewedText: { fontSize: 12, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  teacherSub: { fontSize: 14, lineHeight: 22, marginTop: 2, fontFamily: 'Inter_400Regular' },
  iconButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teacherPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  teacherScoreBox: { width: 94, borderRadius: 14, padding: 10, alignItems: 'center' },
  teacherScore: { fontSize: 28, fontWeight: '900', letterSpacing: 0, fontFamily: 'Nunito_900Black' },
  teacherScoreLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  teacherNote: { fontSize: 15, lineHeight: 24, fontFamily: 'Inter_400Regular' },
  teacherGap: { fontSize: 13, fontWeight: '800', marginTop: 4, fontFamily: 'Inter_700Bold' },
  teacherReviewedDate: { fontSize: 12, fontWeight: '700', marginTop: 3, fontFamily: 'Inter_600SemiBold' },
  teacherForm: { gap: 10 },
  teacherInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 50, fontSize: 17, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  teacherTextarea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 96, textAlignVertical: 'top', fontSize: 16, lineHeight: 26, fontFamily: 'Inter_400Regular' },
  teacherActions: { flexDirection: 'row', gap: 10 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 17, fontWeight: '800', lineHeight: 26, marginBottom: 12, fontFamily: 'Nunito_800ExtraBold' },
  insightGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  miniInsight: { flex: 1, borderRadius: 12, padding: 10, gap: 4 },
  miniLabel: { fontSize: 12, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  miniValue: { fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  paragraph: { fontSize: 16, lineHeight: 26, fontFamily: 'Inter_400Regular' },
  paragraphSmall: { fontSize: 14, lineHeight: 22, marginTop: 8, fontFamily: 'Inter_400Regular' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bulletList: { gap: 10 },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 9 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 24, fontFamily: 'Inter_400Regular' },
  competencyList: { gap: 10 },
  feedbackBlock: { gap: 14, marginTop: 14 },
  feedbackLine: { gap: 4 },
  feedbackTitle: { fontSize: 13, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  feedbackText: { fontSize: 15, lineHeight: 24, fontFamily: 'Inter_400Regular' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  wordPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  wordText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  preview: { width: '100%', height: 300, borderRadius: 14, borderWidth: 1 },
  transcription: { fontSize: 15, lineHeight: 25, fontFamily: 'Inter_400Regular' },
  actions: { gap: 10, marginBottom: theme.spacing.sm },
});
