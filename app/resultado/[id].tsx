import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Accordion,
  AppHeader,
  Button,
  Card,
  CompetencyProgress,
  ScreenContainer,
  StatusBadge,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getScoreColor, getScoreLabel, isCorrectedEssay } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

type ResultTab = 'resumo' | 'competencias' | 'plano' | 'texto';

const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

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

  const [activeTab, setActiveTab] = useState<ResultTab>('resumo');
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherScoreInput, setTeacherScoreInput] = useState('');
  const [teacherNoteInput, setTeacherNoteInput] = useState('');

  const essay = useMemo(() => essays.find((item) => item.id === id), [essays, id]);
  const student = useMemo(
    () => (essay ? students.find((item) => item.id === essay.studentId) : undefined),
    [essay, students]
  );

  if (!essay || !isCorrectedEssay(essay)) {
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack>
          <AppHeader title="Resultado" subtitle="Resultado não encontrado." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Esta redação ainda não tem uma correção final.
            </Text>
          </Card>
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
      <ScreenContainer showBack>
        <AppHeader eyebrow="Resultado" title={studentName} subtitle={essay.themeTitle} />

        <Card style={[styles.heroCard, { borderColor: scoreColor + '35' }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroKicker, { color: colors.mutedText }]}>Nota da IA</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.score, { color: scoreColor }]}>{scoreText(essay.totalScore)}</Text>
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
                  <Text style={[styles.teacherTitle, { color: colors.text }]}>Avaliação do professor</Text>
                  <Text style={[styles.teacherSub, { color: colors.mutedText }]}>
                    Destaque sua nota final e observações manuais.
                  </Text>
                </View>
                <Pressable onPress={teacherOpen ? () => setTeacherOpen(false) : openTeacherEval} style={[styles.iconButton, { backgroundColor: colors.input }]}>
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
        {activeTab === 'texto' ? <TextoTab essay={essay} colors={colors} /> : null}

        <View style={styles.actions}>
          <Button title="Gerar devolutiva" leftIcon="share-social-outline" onPress={handleShare} />
          <Button
            title="Nova redação"
            variant="secondary"
            leftIcon="add-circle-outline"
            onPress={() => router.push(`/nova-redacao?studentId=${essay.studentId}` as any)}
          />
          <Button
            title="Voltar ao aluno"
            variant="ghost"
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

      <BulletsCard title="Pontos fortes" icon="checkmark-circle-outline" items={essay.strengths} color={colors.success} colors={colors} />
      <BulletsCard title="Prioridades" icon="alert-circle-outline" items={essay.weaknesses} color={colors.warning} colors={colors} />
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
              <CompetencyProgress label={COMP_LABELS[key] ?? key.toUpperCase()} score={score} color={COMP_COLORS[key]} />
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

function TextoTab({ essay, colors }: { essay: Essay; colors: any }) {
  return (
    <>
      {essay.imageUri ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Imagem enviada</Text>
          <Image source={{ uri: essay.imageUri }} style={[styles.preview, { borderColor: colors.border }]} contentFit="contain" />
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
  emptyText: { fontSize: 14, lineHeight: 21 },
  heroCard: { borderWidth: 1, gap: theme.spacing.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md },
  heroKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontSize: 56, lineHeight: 62, fontWeight: '900', letterSpacing: 0 },
  scoreBase: { fontSize: 17, fontWeight: '700' },
  scoreLabel: { fontSize: 14, fontWeight: '800' },
  heroStatus: { alignItems: 'flex-end', gap: 8 },
  confidencePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  confidenceText: { fontSize: 11, fontWeight: '800' },
  aiPanel: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  aiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  aiText: { fontSize: 12, lineHeight: 17 },
  teacherPanel: { borderTopWidth: 1, paddingTop: theme.spacing.md, gap: theme.spacing.md },
  teacherTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teacherTitle: { fontSize: 15, fontWeight: '800' },
  teacherSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  iconButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teacherPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  teacherScoreBox: { width: 94, borderRadius: 14, padding: 10, alignItems: 'center' },
  teacherScore: { fontSize: 28, fontWeight: '900', letterSpacing: 0 },
  teacherScoreLabel: { fontSize: 10, fontWeight: '700' },
  teacherNote: { fontSize: 13, lineHeight: 19 },
  teacherGap: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  teacherForm: { gap: 10 },
  teacherInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, fontSize: 16, fontWeight: '800' },
  teacherTextarea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 96, textAlignVertical: 'top', fontSize: 14, lineHeight: 20 },
  teacherActions: { flexDirection: 'row', gap: 10 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', lineHeight: 21, marginBottom: 12 },
  insightGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  miniInsight: { flex: 1, borderRadius: 12, padding: 10, gap: 4 },
  miniLabel: { fontSize: 10, fontWeight: '800' },
  miniValue: { fontSize: 12, fontWeight: '800' },
  paragraph: { fontSize: 14, lineHeight: 21 },
  paragraphSmall: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bulletList: { gap: 9 },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  competencyList: { gap: 10 },
  feedbackBlock: { gap: 12, marginTop: 14 },
  feedbackLine: { gap: 3 },
  feedbackTitle: { fontSize: 12, fontWeight: '900' },
  feedbackText: { fontSize: 13, lineHeight: 19 },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  wordPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  wordText: { fontSize: 12, fontWeight: '700' },
  preview: { width: '100%', height: 300, borderRadius: 14, borderWidth: 1 },
  transcription: { fontSize: 13, lineHeight: 21 },
  actions: { gap: 10, marginBottom: theme.spacing.sm },
});
