import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { AppColors } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const IMAGE_QUALITY_THRESHOLD_KB = 150;

// ─── Indicador de progresso ──────────────────────────────────────────────────

function ProgressBar({ steps }: { steps: boolean[] }) {
  const { colors } = useAppTheme();
  const done = steps.filter(Boolean).length;

  return (
    <View style={pStyles.wrap}>
      {steps.map((complete, i) => (
        <View key={i} style={pStyles.row}>
          <View
            style={[
              pStyles.dot,
              complete
                ? { backgroundColor: colors.accent }
                : done >= i
                ? { backgroundColor: colors.border, borderWidth: 2, borderColor: colors.accent }
                : { backgroundColor: colors.border },
            ]}
          >
            {complete ? (
              <Ionicons name="checkmark" size={10} color="#fff" />
            ) : (
              <Text style={[pStyles.dotNum, { color: done >= i ? colors.accent : colors.mutedText }]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < steps.length - 1 ? (
            <View style={[pStyles.line, { backgroundColor: complete ? colors.accent : colors.border }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const pStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, paddingVertical: theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotNum: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  line: { width: 40, height: 2, marginHorizontal: 4 },
});

// ─── Chip de seleção feita ───────────────────────────────────────────────────

function SelectedChip({ label, onClear, colors }: { label: string; onClear: () => void; colors: AppColors }) {
  return (
    <View style={[cStyles.chip, { backgroundColor: colors.successSoft, borderColor: colors.success + '50' }]}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={[cStyles.chipText, { color: colors.success }]} numberOfLines={1}>{label}</Text>
      <Pressable onPress={onClear} hitSlop={10} style={cStyles.clearBtn}>
        <Ionicons name="close-circle" size={16} color={colors.success} />
      </Pressable>
    </View>
  );
}

const cStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { flex: 1, fontSize: 14, fontWeight: '600' },
  clearBtn: { marginLeft: 2 },
});

// ─── Tela principal ──────────────────────────────────────────────────────────

export default function NovaRedacaoScreen() {
  const { colors } = useAppTheme();
  const { studentId: studentIdParam, themeId: themeIdParam } = useLocalSearchParams<{
    studentId?: string;
    themeId?: string;
  }>();

  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const themes = useAppStore((state) => state.themes);
  const addEssay = useAppStore((state) => state.addEssay);
  const evaluateEssayWithOpenAI = useAppStore((state) => state.evaluateEssayWithOpenAI);

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((s) => s.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const availableThemes = useMemo(() => {
    if (!currentTeacher) return [];
    return themes.filter((t) => t.teacherId === currentTeacher.id);
  }, [currentTeacher, themes]);

  const [selectedStudentId, setSelectedStudentId] = useState(studentIdParam ?? '');
  const [selectedThemeId, setSelectedThemeId] = useState(themeIdParam ?? '');
  const [imageUri, setImageUri] = useState('');
  const [imageName, setImageName] = useState('');
  const [documentUri, setDocumentUri] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (studentIdParam) setSelectedStudentId(studentIdParam); }, [studentIdParam]);
  useEffect(() => { if (themeIdParam) setSelectedThemeId(themeIdParam); }, [themeIdParam]);

  const selectedStudent = teacherStudents.find((s) => s.id === selectedStudentId);
  const selectedTheme = availableThemes.find((t) => t.id === selectedThemeId);
  const hasFile = Boolean(imageUri || documentUri);

  const stepsDone = [Boolean(selectedStudentId), Boolean(selectedThemeId), hasFile];
  const canSubmit = stepsDone.every(Boolean);

  // ── Handlers de arquivo ─────────────────────────────────────────────────

  async function checkImageQuality(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      if (info.exists && 'size' in info && typeof info.size === 'number') {
        if (info.size < IMAGE_QUALITY_THRESHOLD_KB * 1024) {
          return new Promise((resolve) =>
            Alert.alert(
              'Imagem pequena',
              `Apenas ${Math.round(info.size! / 1024)}KB detectados. Imagens muito pequenas podem reduzir a precisão da IA.`,
              [
                { text: 'Escolher outra', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Usar assim mesmo', onPress: () => resolve(true) },
              ]
            )
          );
        }
      }
    } catch { /* deixa passar */ }
    return true;
  }

  const clearFile = () => {
    setImageUri('');
    setImageName('');
    setDocumentUri('');
    setDocumentName('');
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o uso da câmera nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (!(await checkImageQuality(asset.uri))) return;
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'foto-redacao.jpg');
    setDocumentUri('');
    setDocumentName('');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (!(await checkImageQuality(asset.uri))) return;
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'imagem-redacao.jpg');
    setDocumentUri('');
    setDocumentName('');
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setDocumentUri(asset.uri);
    setDocumentName(asset.name ?? 'arquivo-redacao');
    setImageUri('');
    setImageName('');
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTheme || !hasFile) return;

    const essayId = addEssay({
      studentId: selectedStudent.id,
      themeTitle: selectedTheme.title,
      imageUri: imageUri || undefined,
      imageName: imageName || undefined,
      documentUri: documentUri || undefined,
      documentName: documentName || undefined,
    });

    if (!essayId) {
      Alert.alert('Erro', 'Não foi possível criar a redação. Tente novamente.');
      return;
    }

    router.replace(`/redacao/${essayId}`);

    if (autoCorrect && imageUri) {
      setSubmitting(true);
      try {
        await evaluateEssayWithOpenAI(essayId);
      } catch {
        // erro tratado dentro do store (retry queue, feedback no essay)
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="NOVA REDAÇÃO"
          title="Enviar redação"
          subtitle="Siga as etapas abaixo para enviar e corrigir."
        />

        {/* Progresso */}
        <ProgressBar steps={stepsDone} />

        {/* ── ETAPA 1: ALUNO ─────────────────────────────────────────────── */}
        <SectionBlock
          number="1"
          label="ALUNO"
          done={stepsDone[0]}
          colors={colors}
        >
          {stepsDone[0] && selectedStudent ? (
            <SelectedChip
              label={`${selectedStudent.name} · ${selectedStudent.className}`}
              onClear={() => setSelectedStudentId('')}
              colors={colors}
            />
          ) : teacherStudents.length === 0 ? (
            <EmptyAction
              message="Nenhum aluno cadastrado ainda."
              buttonLabel="Cadastrar aluno"
              onPress={() => router.push('/novo-aluno')}
              colors={colors}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {teacherStudents.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedStudentId(s.id)}
                  style={[
                    styles.studentCard,
                    {
                      borderColor: selectedStudentId === s.id ? colors.accent : colors.border,
                      backgroundColor: selectedStudentId === s.id ? colors.accent + '10' : colors.input,
                    },
                  ]}
                >
                  <View style={[styles.studentAvatar, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="person" size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={2}>{s.name}</Text>
                  <Text style={[styles.studentClass, { color: colors.mutedText }]} numberOfLines={1}>{s.className}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </SectionBlock>

        {/* ── ETAPA 2: TEMA ──────────────────────────────────────────────── */}
        <SectionBlock
          number="2"
          label="TEMA"
          done={stepsDone[1]}
          locked={!stepsDone[0]}
          colors={colors}
        >
          {!stepsDone[0] ? (
            <Text style={[styles.lockedText, { color: colors.mutedText }]}>
              Selecione um aluno primeiro.
            </Text>
          ) : stepsDone[1] && selectedTheme ? (
            <SelectedChip
              label={selectedTheme.title}
              onClear={() => setSelectedThemeId('')}
              colors={colors}
            />
          ) : availableThemes.length === 0 ? (
            <EmptyAction
              message="Nenhum tema cadastrado ainda."
              buttonLabel="Cadastrar tema"
              onPress={() => router.push('/novo-tema')}
              colors={colors}
            />
          ) : (
            <View style={styles.themeList}>
              {availableThemes.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedThemeId(t.id)}
                  style={[
                    styles.themeRow,
                    {
                      borderColor: selectedThemeId === t.id ? colors.accent : colors.border,
                      backgroundColor: selectedThemeId === t.id ? colors.accent + '08' : colors.surface,
                    },
                  ]}
                >
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeTitle, { color: colors.text }]} numberOfLines={2}>{t.title}</Text>
                    <Text style={[styles.themeCategory, { color: colors.mutedText }]}>{t.category}</Text>
                  </View>
                  <View style={[
                    styles.themeRadio,
                    { borderColor: selectedThemeId === t.id ? colors.accent : colors.border },
                    selectedThemeId === t.id && { backgroundColor: colors.accent },
                  ]}>
                    {selectedThemeId === t.id ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </SectionBlock>

        {/* ── ETAPA 3: ARQUIVO ───────────────────────────────────────────── */}
        <SectionBlock
          number="3"
          label="ARQUIVO DA REDAÇÃO"
          done={stepsDone[2]}
          locked={!stepsDone[1]}
          colors={colors}
        >
          {!stepsDone[1] ? (
            <Text style={[styles.lockedText, { color: colors.mutedText }]}>
              Selecione um tema primeiro.
            </Text>
          ) : hasFile ? (
            <View style={styles.filePreview}>
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.previewImage, { borderColor: colors.border }]}
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={[styles.docFileRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="document-text-outline" size={28} color={colors.accent} />
                  <View style={styles.docFileInfo}>
                    <Text style={[styles.docFileName, { color: colors.text }]} numberOfLines={2}>{documentName}</Text>
                    <Text style={[styles.docFileHint, { color: colors.mutedText }]}>Documento selecionado</Text>
                  </View>
                </View>
              )}
              <Pressable
                onPress={clearFile}
                style={[styles.retakeBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="refresh-outline" size={15} color={colors.softText} />
                <Text style={[styles.retakeBtnText, { color: colors.softText }]}>Usar outro arquivo</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.uploadZone}>
              {/* Câmera — ação principal */}
              <Pressable
                onPress={handleTakePhoto}
                style={[styles.cameraBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.cameraBtnText}>Fotografar redação</Text>
                <Text style={styles.cameraBtnSub}>Recomendado — melhor para a IA</Text>
              </Pressable>

              {/* Opções secundárias */}
              <View style={styles.secondaryUploads}>
                <Pressable
                  onPress={handlePickImage}
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Ionicons name="images-outline" size={20} color={colors.softText} />
                  <Text style={[styles.secondaryBtnText, { color: colors.softText }]}>Galeria</Text>
                </Pressable>
                <Pressable
                  onPress={handlePickDocument}
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Ionicons name="document-outline" size={20} color={colors.softText} />
                  <Text style={[styles.secondaryBtnText, { color: colors.softText }]}>Documento</Text>
                </Pressable>
              </View>
            </View>
          )}
        </SectionBlock>

        {/* ── AÇÃO FINAL ─────────────────────────────────────────────────── */}
        {canSubmit ? (
          <Card style={styles.actionCard}>
            {/* Resumo compacto */}
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="person-outline" size={14} color={colors.mutedText} />
              <Text style={[styles.summaryText, { color: colors.text }]}>{selectedStudent?.name}</Text>
              <Text style={[styles.summaryDot, { color: colors.border }]}>·</Text>
              <Text style={[styles.summaryText, { color: colors.mutedText }]}>{selectedStudent?.className}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: colors.border, marginBottom: theme.spacing.md }]}>
              <Ionicons name="book-outline" size={14} color={colors.mutedText} />
              <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>{selectedTheme?.title}</Text>
            </View>

            {/* Toggle correção automática — só se for imagem */}
            {imageUri ? (
              <Pressable
                onPress={() => setAutoCorrect((v) => !v)}
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: autoCorrect ? colors.accent + '10' : colors.input,
                    borderColor: autoCorrect ? colors.accent + '60' : colors.border,
                  },
                ]}
              >
                <View style={styles.toggleLeft}>
                  <Ionicons name="sparkles-outline" size={18} color={autoCorrect ? colors.accent : colors.mutedText} />
                  <View style={styles.toggleText}>
                    <Text style={[styles.toggleTitle, { color: autoCorrect ? colors.text : colors.softText }]}>
                      Corrigir com IA ao salvar
                    </Text>
                    <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                      {autoCorrect ? 'A IA inicia assim que o envio for salvo.' : 'Você poderá iniciar a correção depois.'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.track, { backgroundColor: autoCorrect ? colors.accent : colors.border }]}>
                  <View style={[styles.thumb, autoCorrect && styles.thumbOn]} />
                </View>
              </Pressable>
            ) : (
              <View style={[styles.docNotice, { backgroundColor: colors.infoSoft, borderColor: colors.info + '40' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                <Text style={[styles.docNoticeText, { color: colors.info }]}>
                  Correção com IA requer uma imagem. Documentos são salvos para referência.
                </Text>
              </View>
            )}

            <Button
              title={autoCorrect && imageUri ? 'Salvar e corrigir com IA' : 'Salvar redação'}
              leftIcon={autoCorrect && imageUri ? 'sparkles-outline' : 'checkmark-outline'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
            />
          </Card>
        ) : null}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Bloco de seção ──────────────────────────────────────────────────────────

function SectionBlock({
  number,
  label,
  done,
  locked = false,
  colors,
  children,
}: {
  number: string;
  label: string;
  done: boolean;
  locked?: boolean;
  colors: AppColors;
  children: React.ReactNode;
}) {
  return (
    <View style={[
      bStyles.block,
      {
        borderColor: done ? colors.success + '60' : locked ? colors.border : colors.border,
        backgroundColor: locked ? colors.input + '80' : colors.surface,
        opacity: locked ? 0.7 : 1,
      },
    ]}>
      <View style={bStyles.header}>
        <View style={[
          bStyles.numBadge,
          {
            backgroundColor: done ? colors.success : locked ? colors.border : colors.accent + '20',
            borderColor: done ? colors.success : locked ? colors.border : colors.accent + '60',
          },
        ]}>
          {done ? (
            <Ionicons name="checkmark" size={12} color="#fff" />
          ) : (
            <Text style={[bStyles.num, { color: locked ? colors.mutedText : colors.accent }]}>{number}</Text>
          )}
        </View>
        <Text style={[bStyles.label, { color: done ? colors.success : locked ? colors.mutedText : colors.softText }]}>
          {label}
        </Text>
        {done ? <Text style={[bStyles.doneTag, { color: colors.success }]}>✓ Pronto</Text> : null}
      </View>
      <View style={bStyles.body}>{children}</View>
    </View>
  );
}

const bStyles = StyleSheet.create({
  block: { borderWidth: 1, borderRadius: 6, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: theme.spacing.md, paddingBottom: theme.spacing.sm },
  numBadge: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  label: { flex: 1, fontSize: 11, fontWeight: '700', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.4 },
  doneTag: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  body: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md },
});

// ─── Estado vazio com ação ────────────────────────────────────────────────────

function EmptyAction({ message, buttonLabel, onPress, colors }: {
  message: string; buttonLabel: string; onPress: () => void; colors: AppColors;
}) {
  return (
    <View style={eStyles.wrap}>
      <Text style={[eStyles.msg, { color: colors.mutedText }]}>{message}</Text>
      <Button title={buttonLabel} leftIcon="add-outline" onPress={onPress} />
    </View>
  );
}

const eStyles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  msg: { ...theme.typography.bodySmall, lineHeight: 20 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  lockedText: { ...theme.typography.bodySmall, lineHeight: 20 },

  // Alunos
  hList: { gap: theme.spacing.sm, paddingVertical: 2, paddingRight: theme.spacing.sm },
  studentCard: { width: 130, borderWidth: 1.5, borderRadius: 8, padding: theme.spacing.md, gap: theme.spacing.xs, alignItems: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  studentName: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  studentClass: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Temas
  themeList: { gap: theme.spacing.sm },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderWidth: 1.5, borderRadius: 8, padding: theme.spacing.md },
  themeInfo: { flex: 1, gap: 3 },
  themeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  themeCategory: { fontSize: 12, lineHeight: 16 },
  themeRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Upload
  uploadZone: { gap: theme.spacing.md },
  cameraBtn: { borderRadius: 10, borderWidth: 0, padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.xs },
  cameraBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  cameraBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 16 },
  secondaryUploads: { flexDirection: 'row', gap: theme.spacing.sm },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, borderWidth: 1, borderRadius: 8, paddingVertical: theme.spacing.md },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },

  // Preview de arquivo
  filePreview: { gap: theme.spacing.sm },
  previewWrap: {},
  previewImage: { width: '100%', height: 260, borderRadius: 8, borderWidth: 1 },
  docFileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderWidth: 1, borderRadius: 8, padding: theme.spacing.md },
  docFileInfo: { flex: 1, gap: 3 },
  docFileName: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  docFileHint: { fontSize: 12 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, borderWidth: 1, borderRadius: 8, paddingVertical: theme.spacing.sm },
  retakeBtnText: { fontSize: 13, fontWeight: '500' },

  // Ação final
  actionCard: { gap: theme.spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: theme.spacing.xs, borderBottomWidth: 1 },
  summaryText: { fontSize: 13, fontWeight: '500', flex: 1 },
  summaryDot: { fontSize: 16 },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderWidth: 1, borderRadius: 8, padding: theme.spacing.md },
  toggleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  toggleText: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  toggleDesc: { fontSize: 12, lineHeight: 18 },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbOn: { alignSelf: 'flex-end' },

  // Aviso documento
  docNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, borderWidth: 1, borderRadius: 8, padding: theme.spacing.md },
  docNoticeText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
