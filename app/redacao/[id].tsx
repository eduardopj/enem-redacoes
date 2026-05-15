import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, CorrectionProgress, ScreenContainer, StaggerItem, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { isCorrectedEssay } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, View } from 'react-native';

function parseStep(feedback: string | undefined): 1 | 2 | 3 | 4 {
  if (!feedback) return 1;
  const match = feedback.match(/ETAPA\s+(\d)/i);
  const n = match ? parseInt(match[1], 10) : 1;
  return (n >= 1 && n <= 4 ? n : 1) as 1 | 2 | 3 | 4;
}

export default function RedacaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);
  const evaluateEssayWithOpenAI = useAppStore((state) => state.evaluateEssayWithOpenAI);
  const retryQueue = useAppStore((state) => state.retryQueue);
  const processRetryQueue = useAppStore((state) => state.processRetryQueue);

  const [retrying, setRetrying] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const didAutoNav = useRef(false);

  const essay = useMemo(() => essays.find((item) => item.id === id), [essays, id]);

  const studentName = useMemo(() => {
    if (!essay) return '';
    return students.find((student) => student.id === essay.studentId)?.name ?? 'Aluno';
  }, [essay, students]);

  // Auto-navigate to resultado — on mount if already corrigida, or on transition
  useEffect(() => {
    if (!essay || didAutoNav.current) return;
    if (isCorrectedEssay(essay)) {
      didAutoNav.current = true;
      router.replace(`/resultado/${essay.id}`);
      return;
    }
    const prev = prevStatusRef.current;
    prevStatusRef.current = essay.status;
    if (prev === 'processando' && isCorrectedEssay(essay)) {
      didAutoNav.current = true;
      router.replace(`/resultado/${essay.id}`);
    }
  }, [essay]);

  // AppState listener: retry queue when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && retryQueue.length > 0) {
        processRetryQueue();
      }
    });
    return () => subscription.remove();
  }, [processRetryQueue, retryQueue.length]);

  if (!essay) {
    return (
      <ProtectedRoute allowStudent>
        <ScreenContainer showBack>
          <AppHeader title="Detalhe da redação" subtitle="Redação não encontrada." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Redação não encontrada.
            </Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  const isProcessing = essay.status === 'processando';
  const isCorrected = isCorrectedEssay(essay);
  const hasError = essay.status === 'pendente' && Boolean(essay.errorMessage);
  const isInRetryQueue = retryQueue.includes(essay.id);
  const currentStep = parseStep(essay.feedback);

  const handleRetry = () => {
    const detail = essay.errorMessage ? `\n\nÚltimo erro: ${essay.errorMessage}` : '';

    Alert.alert(
      'Corrigir com IA',
      `A IA irá transcrever a redação, avaliar as 5 competências do ENEM e gerar um parecer pedagógico completo. Isso pode levar de 30 a 90 segundos.${detail}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar correção',
          onPress: async () => {
            try {
              setRetrying(true);
              await evaluateEssayWithOpenAI(essay.id);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Falha ao conectar ao servidor.';
              const lowerMessage = message.toLowerCase();
              const isNetwork =
                lowerMessage.includes('network request failed') ||
                lowerMessage.includes('connect') ||
                lowerMessage.includes('conectar') ||
                lowerMessage.includes('backend') ||
                lowerMessage.includes('servidor') ||
                lowerMessage.includes('fetch');
              Alert.alert(
                'Erro na correção',
                isNetwork
                  ? 'Não foi possível conectar ao servidor de correção. A redação foi adicionada à fila e será reprocessada automaticamente quando a conexão for restabelecida.'
                  : message
              );
            } finally {
              setRetrying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ProtectedRoute allowStudent>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Redação"
          title="Acompanhar correção"
          subtitle="Veja o envio, o status e o próximo passo."
        />

        {/* Info */}
        <StaggerItem index={0}>
          <Card>
            <View style={styles.headerTop}>
              <View style={styles.headerInfo}>
                <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
                <Text style={[styles.themeText, { color: colors.mutedText }]}>{essay.themeTitle}</Text>
              </View>
              <StatusBadge status={essay.status} />
            </View>

            <View style={[styles.infoGroup, { borderTopColor: colors.border }]}>
              <InfoRow label="Imagem" value={essay.imageName ?? 'Não enviada'} colors={colors} />
              <InfoRow label="Arquivo" value={essay.documentName ?? 'Não enviado'} colors={colors} />
              <InfoRow
                label="Confiabilidade"
                value={essay.scoreReliability?.level ?? 'Aguardando análise'}
                colors={colors}
              />
            </View>
          </Card>
        </StaggerItem>

        {/* Preview da imagem */}
        {essay.imageUri ? (
          <StaggerItem index={1}>
            <Card>
              <Text style={[styles.blockTitle, { color: colors.softText }]}>Prévia</Text>
              <Image
                source={{ uri: essay.imageUri }}
                style={[styles.previewImage, { borderColor: colors.border }]}
                contentFit="contain"
              />
            </Card>
          </StaggerItem>
        ) : null}

        {/* Fila de retry offline */}
        {isInRetryQueue && !isProcessing ? (
          <StaggerItem index={2}>
            <Card style={[styles.queueCard, { borderColor: colors.warning }]}>
              <View style={styles.queueRow}>
                <View style={[styles.queueDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.queueText, { color: colors.softText }]}>
                  Na fila de reprocessamento — será corrigida automaticamente quando a conexão for restabelecida.
                </Text>
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Estado: processando */}
        {isProcessing ? (
          <StaggerItem index={2}>
            <CorrectionProgress currentStep={currentStep} feedback={essay.feedback} />
          </StaggerItem>
        ) : null}

        {/* Estado: erro */}
        {hasError ? (
          <StaggerItem index={2}>
            <Card style={[styles.errorCard, { borderColor: colors.danger + '40' }]}>
              <View style={styles.errorHeader}>
                <View style={[styles.errorIconWrap, { backgroundColor: colors.danger + '14' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                </View>
                <Text style={[styles.errorTitle, { color: colors.danger }]}>Falha na correção</Text>
              </View>
              <Text style={[styles.errorText, { color: colors.mutedText }]}>
                {essay.errorMessage ||
                  'Não foi possível completar a correção. Verifique sua conexão e tente novamente.'}
              </Text>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Estado: pendente — CTA para iniciar correção */}
        {!isCorrected && !isProcessing ? (
          <StaggerItem index={3}>
            <View style={[styles.aiCta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.aiCtaHeader}>
                <View style={[styles.aiCtaBadge, { backgroundColor: colors.accent + '18' }]}>
                  <Text style={[styles.aiCtaBadgeText, { color: colors.accent }]}>Correção com IA</Text>
                </View>
              </View>
              <Text style={[styles.aiCtaTitle, { color: colors.text }]}>
                Pronto para analisar
              </Text>
              <Text style={[styles.aiCtaDesc, { color: colors.mutedText }]}>
                A IA irá transcrever o manuscrito, identificar o tema, pontuar as 5 competências e gerar um parecer pedagógico completo.
              </Text>
              <View style={[styles.aiCtaSteps, { borderColor: colors.border, backgroundColor: colors.input }]}>
                {['Leitura da imagem', 'Avaliação temática', 'Pontuação das competências', 'Parecer pedagógico'].map((s, i) => (
                  <View key={i} style={[styles.aiCtaStep, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View style={[styles.aiCtaStepNum, { backgroundColor: colors.accent + '20' }]}>
                      <Text style={[styles.aiCtaStepNumText, { color: colors.accent }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.aiCtaStepLabel, { color: colors.softText }]}>{s}</Text>
                  </View>
                ))}
              </View>
              <Button
                title="Corrigir com IA agora"
                variant="dark"
                leftIcon="sparkles-outline"
                onPress={handleRetry}
                loading={retrying}
              />
            </View>
          </StaggerItem>
        ) : null}

        {/* Estado: corrigido */}
        {isCorrected ? (
          <>
            <StaggerItem index={3}>
              <Card>
                <Text style={[styles.blockTitle, { color: colors.softText }]}>Resumo</Text>
                <View style={styles.summaryGrid}>
                  <SummaryChip
                    label="Nota"
                    value={String(essay.totalScore ?? '--')}
                    color={colors.accent}
                    colors={colors}
                  />
                  <SummaryChip
                    label="Tema"
                    value={essay.themeAdequacy?.level ?? '--'}
                    color={colors.success}
                    colors={colors}
                  />
                  <SummaryChip
                    label="Transcrição"
                    value={essay.transcriptionConfidence ?? '--'}
                    color={colors.info}
                    colors={colors}
                  />
                </View>
                {essay.scoreReliability?.observation ? (
                  <Text style={[styles.resumeObs, { color: colors.mutedText, borderTopColor: colors.border }]}>
                    {essay.scoreReliability.observation}
                  </Text>
                ) : null}
              </Card>
            </StaggerItem>

            <StaggerItem index={4}>
              <Button
                title="Ver resultado completo"
                variant="dark"
                leftIcon="analytics-outline"
                onPress={() => router.push(`/resultado/${essay.id}`)}
              />
            </StaggerItem>
          </>
        ) : null}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function SummaryChip({ label, value, color, colors }: {
  label: string; value: string; color: string; colors: any;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <Text style={[styles.chipLabel, { color: colors.softText }]}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerInfo: { flex: 1, gap: theme.spacing.xxs },
  studentName: { ...theme.typography.h3 },
  themeText: { ...theme.typography.body },
  infoGroup: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  row: { gap: theme.spacing.xs, paddingBottom: theme.spacing.sm, borderBottomWidth: 1 },
  rowLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  rowValue: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  blockTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0, marginBottom: 10 },
  previewImage: { width: '100%', height: 300, borderRadius: 12 },
  errorCard: { borderWidth: 1 },
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.sm },
  errorIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, flex: 1 },
  errorText: { fontSize: 14, lineHeight: 22 },
  emptyText: { fontSize: 15, lineHeight: 22 },
  // Retry queue
  queueCard: { borderWidth: 1 },
  queueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  queueDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  queueText: { flex: 1, fontSize: 13, lineHeight: 20 },
  // AI CTA
  aiCta: {
    borderRadius: 16,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  aiCtaHeader: { alignItems: 'flex-start' },
  aiCtaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  aiCtaBadgeText: { fontSize: 11, fontWeight: '700' },
  aiCtaTitle: { fontSize: 20, fontWeight: '700', lineHeight: 26, letterSpacing: 0 },
  aiCtaDesc: { fontSize: 15, lineHeight: 22 },
  aiCtaSteps: { borderRadius: 12, overflow: 'hidden' },
  aiCtaStep: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.sm },
  aiCtaStepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiCtaStepNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  aiCtaStepLabel: { fontSize: 13, lineHeight: 18 },
  // Summary chips
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.sm },
  chip: { flex: 1, borderRadius: 12, padding: theme.spacing.sm, gap: 4, alignItems: 'center' },
  chipLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  chipValue: { fontSize: 16, fontWeight: '700' },
  resumeObs: { fontSize: 13, lineHeight: 20, paddingTop: theme.spacing.sm, borderTopWidth: 1, marginTop: theme.spacing.xs },
});
