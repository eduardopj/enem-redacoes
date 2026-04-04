import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Card,
  CompetencyCard,
  FeedbackCard,
  ScoreSummaryCard,
  ScreenContainer,
  StaggerItem,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

const competencyDescriptions = {
  c1: 'Domínio da norma padrão da língua portuguesa.',
  c2: 'Compreensão do tema, da proposta e repertório pertinente.',
  c3: 'Seleção, organização e progressão argumentativa.',
  c4: 'Coesão e articulação entre as partes do texto.',
  c5: 'Proposta de intervenção completa e viável.',
};

function buildShareText(essay: any, studentName: string): string {
  const lines: string[] = [];
  lines.push(`📝 PARECER PEDAGÓGICO — ENEM IA`);
  lines.push(`Aluno: ${studentName}`);
  lines.push(`Tema: ${essay.themeTitle}`);
  lines.push(`Nota total: ${essay.totalScore ?? '--'}/1000`);
  lines.push('');
  if (essay.competencies) {
    lines.push('COMPETÊNCIAS');
    lines.push(`C1 Norma Culta: ${essay.competencies.c1}`);
    lines.push(`C2 Tema: ${essay.competencies.c2}`);
    lines.push(`C3 Argumentação: ${essay.competencies.c3}`);
    lines.push(`C4 Coesão: ${essay.competencies.c4}`);
    lines.push(`C5 Intervenção: ${essay.competencies.c5}`);
    lines.push('');
  }
  if (essay.generalObservation) {
    lines.push('RESUMO PARA O PROFESSOR');
    lines.push(essay.generalObservation);
    lines.push('');
  }
  if (essay.congratulations) {
    lines.push('RECONHECIMENTO AO ALUNO');
    lines.push(essay.congratulations);
    lines.push('');
  }
  if (essay.feedback) {
    lines.push('MENSAGEM FINAL');
    lines.push(essay.feedback);
    lines.push('');
  }
  if (essay.strengths?.length) {
    lines.push('PONTOS FORTES');
    essay.strengths.forEach((s: string) => lines.push(`• ${s}`));
    lines.push('');
  }
  if (essay.weaknesses?.length) {
    lines.push('PONTOS A MELHORAR');
    essay.weaknesses.forEach((s: string) => lines.push(`• ${s}`));
    lines.push('');
  }
  if (essay.improvements?.length) {
    lines.push('PLANO DE MELHORIA');
    essay.improvements.forEach((s: string) => lines.push(`• ${s}`));
  }
  return lines.join('\n');
}

export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const essays = useAppStore((state) => state.essays);
  const students = useAppStore((state) => state.students);
  const [showTranscription, setShowTranscription] = useState(false);
  const [sharing, setSharing] = useState(false);

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
      <ProtectedRoute>
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

  const competencyEntries = essay.competencies
    ? [
        { key: 'c1' as const, title: 'Competência 1', score: essay.competencies.c1, description: competencyDescriptions.c1, feedback: essay.competencyFeedbacks?.c1 },
        { key: 'c2' as const, title: 'Competência 2', score: essay.competencies.c2, description: competencyDescriptions.c2, feedback: essay.competencyFeedbacks?.c2 },
        { key: 'c3' as const, title: 'Competência 3', score: essay.competencies.c3, description: competencyDescriptions.c3, feedback: essay.competencyFeedbacks?.c3 },
        { key: 'c4' as const, title: 'Competência 4', score: essay.competencies.c4, description: competencyDescriptions.c4, feedback: essay.competencyFeedbacks?.c4 },
        { key: 'c5' as const, title: 'Competência 5', score: essay.competencies.c5, description: competencyDescriptions.c5, feedback: essay.competencyFeedbacks?.c5 },
      ]
    : [];

  const showReliabilityWarning =
    essay.scoreReliability?.level === 'media' || essay.scoreReliability?.level === 'baixa';

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="RESULTADO"
          title="Correção consolidada"
          subtitle={`Aluno: ${studentName}`}
        />

        <StaggerItem index={0}>
          <ScoreSummaryCard
            totalScore={essay.totalScore}
            status={essay.status}
            reliabilityLevel={essay.scoreReliability?.level}
            reliabilityObservation={essay.scoreReliability?.observation}
          />
        </StaggerItem>

        {/* Compartilhar */}
        <StaggerItem index={1}>
          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={[styles.shareBtn, { opacity: sharing ? 0.7 : 1 }]}
          >
            <View style={styles.shareBtnInner}>
              <FontAwesome5 name="whatsapp" size={22} color="#FFFFFF" />
              <View style={styles.shareBtnTextWrap}>
                <Text style={styles.shareBtnLabel}>
                  {sharing ? 'Gerando parecer...' : 'Compartilhar via WhatsApp'}
                </Text>
                <Text style={styles.shareBtnSub}>Envie o parecer pedagógico completo</Text>
              </View>
            </View>
          </Pressable>
        </StaggerItem>

        {showReliabilityWarning ? (
          <StaggerItem index={2}>
            <Card style={[styles.warningCard, { borderColor: colors.warning }]}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>
                Atenção à confiabilidade desta correção
              </Text>
              <Text style={[styles.warningText, { color: colors.mutedText }]}>
                {essay.scoreReliability?.observation ||
                  'A leitura da imagem trouxe algum nível de incerteza. Vale revisar a transcrição e o parecer pedagógico com mais atenção.'}
              </Text>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Leitura didática */}
        <StaggerItem index={3}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>
              LEITURA DIDÁTICA PARA DEVOLUTIVA
            </Text>
            <Text style={[styles.subTitle, { color: colors.text }]}>Resumo para o professor</Text>
            <Text style={[styles.bodyText, { color: colors.mutedText }]}>
              {essay.generalObservation ?? 'Sem observação geral disponível.'}
            </Text>

            <Text style={[styles.subTitle, { color: colors.text }]}>Reconhecimento ao aluno</Text>
            <Text style={[styles.bodyText, { color: colors.mutedText }]}>
              {essay.congratulations ?? 'Parabéns pelo esforço e pela construção da redação.'}
            </Text>

            <Text style={[styles.subTitle, { color: colors.text }]}>Mensagem final para orientar a reescrita</Text>
            <Text style={[styles.bodyText, { color: colors.mutedText }]}>
              {essay.feedback ?? 'Sem feedback pedagógico disponível.'}
            </Text>
          </Card>
        </StaggerItem>

        {/* Contexto */}
        <StaggerItem index={4}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>CONTEXTO DA CORREÇÃO</Text>
            <InfoRow label="Tema trabalhado" value={essay.themeTitle} colors={colors} />
            <InfoRow label="Tipo de escrita" value={essay.writingMode ?? 'Não identificado'} colors={colors} />
            <InfoRow label="Adequação ao tema" value={essay.themeAdequacy?.level ?? 'Não informado'} colors={colors} />
            <InfoRow label="Confiança da transcrição" value={essay.transcriptionConfidence ?? 'Não informada'} colors={colors} />
          </Card>
        </StaggerItem>

        {/* Transcrição — Acordeão */}
        <StaggerItem index={5}>
          <Card>
            <Pressable
              onPress={() => setShowTranscription((v) => !v)}
              style={styles.accordionHeader}
            >
              <Text style={[styles.sectionTitle, { color: colors.softText, marginBottom: 0 }]}>
                TRANSCRIÇÃO E LEITURA DA IMAGEM
              </Text>
              <Ionicons
                name={showTranscription ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.mutedText}
              />
            </Pressable>

            {!showTranscription ? (
              <View style={styles.accordionClosed}>
                <Text style={[styles.accordionHint, { color: colors.mutedText }]}>
                  Toque para expandir a transcrição completa
                </Text>
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
              </View>
            ) : (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {wordCount > 0 ? (
                  <View style={[styles.wordCountRow, { marginBottom: theme.spacing.sm }]}>
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

                <Text style={[styles.subTitle, { color: colors.text }]}>
                  Observação sobre legibilidade
                </Text>
                <Text style={[styles.bodyText, { color: colors.mutedText }]}>
                  {essay.legibility?.observation ?? 'Sem observação de legibilidade.'}
                </Text>

                {essay.legibility?.illegibleExcerpt ? (
                  <>
                    <Text style={[styles.subTitle, { color: colors.text }]}>
                      Trecho com leitura difícil
                    </Text>
                    <Text style={[styles.bodyText, { color: colors.mutedText }]}>
                      {essay.legibility.illegibleExcerpt}
                    </Text>
                  </>
                ) : null}

                <Text style={[styles.subTitle, { color: colors.text }]}>Transcrição completa</Text>
                <Text style={[styles.bodyText, { color: colors.mutedText }]}>
                  {essay.transcription || 'A transcrição ainda não foi gerada.'}
                </Text>

                <Text style={[styles.subTitle, { color: colors.text }]}>
                  Observações da transcrição
                </Text>
                <Text style={[styles.bodyText, { color: colors.mutedText }]}>
                  {essay.transcriptionNotes || 'Sem observações adicionais.'}
                </Text>
              </View>
            )}
          </Card>
        </StaggerItem>

        {/* Competências */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.softText }]}>COMPETÊNCIAS</Text>

          {essay.competencies ? (
            <View style={styles.cards}>
              {competencyEntries.map((item, index) => (
                <StaggerItem key={item.key} index={index + 6}>
                  <Card>
                    <CompetencyCard
                      title={item.title}
                      score={item.score}
                      description={item.description}
                    />
                    <View style={[styles.feedbackGroup, { borderTopColor: colors.border }]}>
                      <MiniBlock title="Diagnóstico" text={item.feedback?.diagnosis} colors={colors} />
                      <MiniBlock title="O que já funciona bem" text={item.feedback?.positive} colors={colors} />
                      <MiniBlock title="Próximo passo de melhoria" text={item.feedback?.improvement} colors={colors} />
                    </View>
                  </Card>
                </StaggerItem>
              ))}
            </View>
          ) : (
            <Card>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                As competências ainda não foram geradas.
              </Text>
            </Card>
          )}
        </View>

        <StaggerItem index={11}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>PONTOS FORTES</Text>
            <BulletList
              items={essay.strengths?.length ? essay.strengths : ['Sem pontos fortes registrados.']}
              colors={colors}
            />
          </Card>
        </StaggerItem>

        <StaggerItem index={12}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>PONTOS FRACOS</Text>
            <BulletList
              items={essay.weaknesses?.length ? essay.weaknesses : ['Sem pontos fracos registrados.']}
              colors={colors}
            />
          </Card>
        </StaggerItem>

        <StaggerItem index={13}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.softText }]}>PLANO DE MELHORIA</Text>
            <BulletList
              items={essay.improvements?.length ? essay.improvements : ['Sem orientações registradas.']}
              colors={colors}
            />
          </Card>
        </StaggerItem>

        <StaggerItem index={14}>
          <FeedbackCard feedback={essay.feedback} />
        </StaggerItem>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.metaLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function MiniBlock({ title, text, colors }: { title: string; text?: string; colors: any }) {
  return (
    <View style={styles.miniBlock}>
      <Text style={[styles.miniBlockTitle, { color: colors.mutedText }]}>{title}</Text>
      <Text style={[styles.miniBlockText, { color: colors.mutedText }]}>
        {text ?? 'Sem informação disponível.'}
      </Text>
    </View>
  );
}

function BulletList({ items, colors }: { items: string[]; colors: any }) {
  return (
    <View style={styles.listGroup}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.listItem}>
          <View style={[styles.listDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.listText, { color: colors.mutedText }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing.md },
  sectionTitle: {
    ...theme.typography.monoLabel,
    marginBottom: theme.spacing.sm,
  },
  subTitle: {
    ...theme.typography.title,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  cards: { gap: theme.spacing.md },
  warningCard: { borderWidth: 1 },
  warningTitle: { ...theme.typography.title, marginBottom: theme.spacing.xs },
  warningText: { ...theme.typography.body, lineHeight: 24 },
  metaRow: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  metaLabel: { ...theme.typography.monoLabel },
  metaValue: { ...theme.typography.body, lineHeight: 24 },
  emptyText: { ...theme.typography.body },
  bodyText: { ...theme.typography.body, lineHeight: 24 },
  feedbackGroup: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  miniBlock: { gap: theme.spacing.xs },
  miniBlockTitle: { ...theme.typography.monoLabel },
  miniBlockText: { ...theme.typography.bodySmall, lineHeight: 22 },
  listGroup: { gap: theme.spacing.sm },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  listDot: { width: 8, height: 8, borderRadius: 999, marginTop: 8 },
  listText: { flex: 1, ...theme.typography.body, lineHeight: 24 },
  // Share button
  shareBtn: {
    backgroundColor: '#25D366',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  shareBtnTextWrap: {
    flex: 1,
    gap: 2,
  },
  shareBtnLabel: {
    ...theme.typography.title,
    fontSize: 14,
    color: '#FFFFFF',
  },
  shareBtnSub: {
    ...theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
  },
  // Accordion
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionClosed: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  accordionHint: {
    ...theme.typography.bodySmall,
  },
  accordionBody: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    gap: 0,
  },
  // Word count
  wordCountRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  wordCountChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  wordCountText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
  },
});
