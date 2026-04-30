import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { AppColors, theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const IMAGE_QUALITY_THRESHOLD_KB = 150;

// ─── Indicador de progresso ──────────────────────────────────────────────────

const STEP_LABELS = ['Aluno', 'Tema', 'Foto', 'Revisar'];

function StepIndicator({ steps }: { steps: boolean[] }) {
  const { colors } = useAppTheme();
  const done = steps.filter(Boolean).length;

  return (
    <View style={pStyles.wrap}>
      {steps.map((complete, i) => {
        const isActive = !complete && done >= i;
        return (
          <React.Fragment key={i}>
            <View style={pStyles.stepCol}>
              <View
                style={[
                  pStyles.dot,
                  complete
                    ? { backgroundColor: colors.accent }
                    : isActive
                    ? { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accent }
                    : { backgroundColor: colors.border },
                ]}
              >
                {complete ? (
                  <Ionicons name="checkmark" size={11} color="#fff" />
                ) : (
                  <Text style={[pStyles.dotNum, { color: isActive ? colors.accent : colors.mutedText }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  pStyles.stepLabel,
                  {
                    color: complete ? colors.accent : isActive ? colors.text : colors.mutedText,
                    fontWeight: complete || isActive ? '700' : '500',
                  },
                ]}
              >
                {STEP_LABELS[i]}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View style={[pStyles.line, { backgroundColor: complete ? colors.accent : colors.border }]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const pStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 8 },
  stepCol: { alignItems: 'center', gap: 5, minWidth: 56 },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dotNum: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 10, letterSpacing: 0.2, lineHeight: 13 },
  line: { flex: 1, height: 2, borderRadius: 1, marginTop: 13 },
});

// ─── Chip de seleção ─────────────────────────────────────────────────────────

function SelectedChip({ label, onClear, colors }: { label: string; onClear: () => void; colors: AppColors }) {
  return (
    <View style={[cStyles.chip, { backgroundColor: colors.accent + '14', borderWidth: 1, borderColor: colors.accent + '30' }]}>
      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
      <Text style={[cStyles.chipText, { color: colors.accent }]} numberOfLines={1}>{label}</Text>
      <Pressable onPress={onClear} hitSlop={10}>
        <Ionicons name="close-circle" size={16} color={colors.accent + '80'} />
      </Pressable>
    </View>
  );
}

const cStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { flex: 1, fontSize: 14, fontWeight: '600' },
});

// ─── Tela principal ──────────────────────────────────────────────────────────

const FREE_THEME_ID = '__tema_livre__';
const FREE_THEME_ITEM = { id: FREE_THEME_ID, title: 'Tema Livre', category: 'A IA identifica o tema automaticamente' };

export default function NovaRedacaoScreen() {
  const { colors } = useAppTheme();
  const { studentId: studentIdParam, themeId: themeIdParam } = useLocalSearchParams<{
    studentId?: string;
    themeId?: string;
  }>();

  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const themes = useAppStore((state) => state.themes);
  const turmas = useAppStore((state) => state.turmas);
  const addEssay = useAppStore((state) => state.addEssay);
  const evaluateEssayWithOpenAI = useAppStore((state) => state.evaluateEssayWithOpenAI);

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((s) => s.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const availableThemes = useMemo(() => {
    if (!currentTeacher) return [];
    return themes.filter((t) => t.teacherId === currentTeacher.id);
  }, [currentTeacher, themes]);

  const [selectedStudentId, setSelectedStudentId] = useState(studentIdParam ?? '');
  const [selectedThemeId, setSelectedThemeId] = useState(themeIdParam ?? '');
  const [filterTurmaId, setFilterTurmaId] = useState<string>('');
  const [imageUri, setImageUri] = useState('');
  const [imageName, setImageName] = useState('');
  const [autoCorrect, setAutoCorrect] = useState(true);

  useEffect(() => { if (studentIdParam) setSelectedStudentId(studentIdParam); }, [studentIdParam]);
  useEffect(() => { if (themeIdParam) setSelectedThemeId(themeIdParam); }, [themeIdParam]);

  const selectedStudent = teacherStudents.find((s) => s.id === selectedStudentId);
  const selectedTheme = selectedThemeId === FREE_THEME_ID
    ? FREE_THEME_ITEM
    : availableThemes.find((t) => t.id === selectedThemeId);
  const hasFile = Boolean(imageUri);

  const filteredStudents = useMemo(() => {
    if (!filterTurmaId) return teacherStudents;
    return teacherStudents.filter((s) => s.turmaId === filterTurmaId);
  }, [teacherStudents, filterTurmaId]);

  const step1Done = Boolean(selectedStudentId);
  const step2Done = step1Done && Boolean(selectedThemeId);
  const step3Done = step2Done && hasFile;
  const stepsDone = [step1Done, step2Done, step3Done, false];
  const canSubmit = step3Done;

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
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (!(await checkImageQuality(asset.uri))) return;
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'imagem-redacao.jpg');
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTheme || !hasFile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const essayId = addEssay({
      studentId: selectedStudent.id,
      themeTitle: selectedTheme.title,
      imageUri: imageUri || undefined,
      imageName: imageName || undefined,
    });

    if (!essayId) {
      Alert.alert('Erro', 'Não foi possível criar a redação. Tente novamente.');
      return;
    }

    if (autoCorrect && imageUri) {
      evaluateEssayWithOpenAI(essayId).catch(() => {});
    }

    router.replace(`/redacao/${essayId}`);
  };

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Nova redação"
          title="Enviar redação"
          subtitle="Siga as etapas abaixo"
        />

        {/* Progresso */}
        <StepIndicator steps={stepsDone} />

        {/* ── ETAPA 1: ALUNO ─────────────────────────────────────────────── */}
        <SectionBlock number="1" label="Aluno" done={stepsDone[0]} colors={colors}>
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
            <>
              {/* Filtro por turma */}
              {myTurmas.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.turmaFilterRow} style={{ flexGrow: 0, marginBottom: 10 }}>
                  <Pressable
                    onPress={() => setFilterTurmaId('')}
                    style={[styles.turmaFilterChip, !filterTurmaId
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.input, borderColor: colors.border }]}
                  >
                    <Text style={[styles.turmaFilterText, { color: !filterTurmaId ? '#fff' : colors.softText }]}>Todos</Text>
                  </Pressable>
                  {myTurmas.map((t) => {
                    const active = filterTurmaId === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setFilterTurmaId(active ? '' : t.id)}
                        style={[styles.turmaFilterChip, active
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: colors.input, borderColor: colors.border }]}
                      >
                        <Ionicons name="school-outline" size={11} color={active ? '#fff' : colors.mutedText} />
                        <Text style={[styles.turmaFilterText, { color: active ? '#fff' : colors.softText }]}>{t.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hList}
              >
                {filteredStudents.map((s) => {
                  const initials = s.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedStudentId(s.id)}
                      style={[
                        styles.studentCard,
                        {
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.accent + '0E' : colors.input,
                        },
                      ]}
                    >
                      <View style={[styles.studentAvatar, { backgroundColor: isSelected ? colors.accent : colors.mutedText + '30' }]}>
                        <Text style={[styles.studentInitials, { color: isSelected ? '#fff' : colors.softText }]}>{initials}</Text>
                      </View>
                      <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={2}>{s.name}</Text>
                      <Text style={[styles.studentClass, { color: colors.mutedText }]} numberOfLines={1}>{s.className}</Text>
                    </Pressable>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <View style={[styles.noStudentHint, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <Text style={[styles.noStudentText, { color: colors.mutedText }]}>Nenhum aluno nesta turma.</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SectionBlock>

        {/* ── ETAPA 2: TEMA ──────────────────────────────────────────────── */}
        <SectionBlock number="2" label="Tema" done={stepsDone[1]} locked={!stepsDone[0]} colors={colors}>
          {!stepsDone[0] ? (
            <View style={styles.lockedHint}>
              <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
              <Text style={[styles.lockedText, { color: colors.mutedText }]}>Selecione um aluno na etapa anterior.</Text>
            </View>
          ) : stepsDone[1] && selectedTheme ? (
            <SelectedChip
              label={selectedTheme.title}
              onClear={() => setSelectedThemeId('')}
              colors={colors}
            />
          ) : (
            <View style={styles.themeList}>
              <FreeThemeRow
                selected={selectedThemeId === FREE_THEME_ID}
                onPress={() => setSelectedThemeId(FREE_THEME_ID)}
                colors={colors}
              />
              {availableThemes.map((t) => {
                const isSelected = selectedThemeId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedThemeId(t.id)}
                    style={[
                      styles.themeRow,
                      {
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: isSelected ? colors.accent + '08' : colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeTitle, { color: colors.text }]} numberOfLines={2}>{t.title}</Text>
                      <Text style={[styles.themeCategory, { color: colors.mutedText }]}>{t.category}</Text>
                    </View>
                    <View style={[
                      styles.themeRadio,
                      { borderColor: isSelected ? colors.accent : colors.border },
                      isSelected && { backgroundColor: colors.accent },
                    ]}>
                      {isSelected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => router.push(selectedStudentId ? `/novo-tema?selectForStudentId=${selectedStudentId}` : '/novo-tema')}
                style={[styles.addThemeInline, { borderColor: colors.border, backgroundColor: colors.input }]}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                <Text style={[styles.addThemeInlineText, { color: colors.accent }]}>
                  Cadastrar outro tema
                </Text>
              </Pressable>
            </View>
          )}
        </SectionBlock>

        {/* ── ETAPA 3: ARQUIVO ───────────────────────────────────────────── */}
        <SectionBlock number="3" label="Arquivo da redação" done={stepsDone[2]} locked={!stepsDone[1]} colors={colors}>
          {!stepsDone[1] ? (
            <View style={styles.lockedHint}>
              <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
              <Text style={[styles.lockedText, { color: colors.mutedText }]}>Selecione um tema na etapa anterior.</Text>
            </View>
          ) : hasFile ? (
            <View style={styles.filePreview}>
              <Image
                source={{ uri: imageUri }}
                style={[styles.previewImage, { borderRadius: 12 }]}
                contentFit="contain"
              />
              <Button
                title="Usar outro arquivo"
                variant="secondary"
                leftIcon="refresh-outline"
                onPress={clearFile}
                size="sm"
              />
            </View>
          ) : (
            <View style={styles.uploadZone}>
              {/* Câmera — ação principal */}
              <Pressable
                onPress={handleTakePhoto}
                style={[styles.cameraBtn, { backgroundColor: colors.text }]}
              >
                <View style={[styles.cameraIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="camera" size={28} color="#fff" />
                </View>
                <Text style={styles.cameraBtnText}>Fotografar redação</Text>
                <Text style={styles.cameraBtnSub}>Recomendado — melhor para a IA</Text>
              </Pressable>

              {/* Opções secundárias */}
              <View style={styles.secondaryUploads}>
                <Pressable
                  onPress={handlePickImage}
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.secIcon, { backgroundColor: colors.input }]}>
                    <Ionicons name="images-outline" size={18} color={colors.softText} />
                  </View>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Galeria</Text>
                </Pressable>
              </View>
              <View style={[styles.docNotice, { backgroundColor: colors.infoSoft, borderRadius: 12 }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                <Text style={[styles.docNoticeText, { color: colors.info }]}>
                  Por enquanto, a IA corrige imagens. Use foto nítida, folha inteira e boa iluminação.
                </Text>
              </View>
              <PhotoQualityTips colors={colors} />
            </View>
          )}
        </SectionBlock>

        {/* ── AÇÃO FINAL ─────────────────────────────────────────────────── */}
        <SectionBlock number="4" label="Revisar e salvar" done={false} locked={!canSubmit} colors={colors}>
          {!canSubmit ? (
            <View style={styles.lockedHint}>
              <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
              <Text style={[styles.lockedText, { color: colors.mutedText }]}>Complete aluno, tema e foto para revisar o envio.</Text>
            </View>
          ) : (
          <>
            {/* Resumo */}
            <View style={[styles.reviewPanel, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '14' }]}>
                  <Ionicons name="person-outline" size={14} color={colors.accent} />
                </View>
                <Text style={[styles.summaryText, { color: colors.text }]}>{selectedStudent?.name}</Text>
                <Text style={[styles.summaryMeta, { color: colors.mutedText }]}>{selectedStudent?.className}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.info + '14' }]}>
                  <Ionicons name="book-outline" size={14} color={colors.info} />
                </View>
                <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>{selectedTheme?.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.success + '14' }]}>
                  <Ionicons name="image-outline" size={14} color={colors.success} />
                </View>
                <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>{imageName || 'Imagem anexada'}</Text>
              </View>
            </View>

            {/* Toggle correção automática */}
            {imageUri ? (
              <Pressable
                onPress={() => setAutoCorrect((v) => !v)}
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: autoCorrect ? colors.accent + '0E' : colors.input,
                    borderColor: autoCorrect ? colors.accent + '50' : colors.border,
                  },
                ]}
              >
                <View style={[styles.toggleIcon, { backgroundColor: autoCorrect ? colors.accent + '20' : colors.input }]}>
                  <Ionicons name="sparkles-outline" size={18} color={autoCorrect ? colors.accent : colors.mutedText} />
                </View>
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: autoCorrect ? colors.text : colors.softText }]}>
                    Corrigir com IA ao salvar
                  </Text>
                  <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                    {autoCorrect ? 'A IA inicia assim que o envio for salvo.' : 'Você poderá iniciar depois.'}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: autoCorrect ? colors.accent : colors.border }]}>
                  <View style={[styles.thumb, autoCorrect && styles.thumbOn]} />
                </View>
              </Pressable>
            ) : (
              <View style={[styles.docNotice, { backgroundColor: colors.infoSoft, borderRadius: 12 }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                <Text style={[styles.docNoticeText, { color: colors.info }]}>
                  Correção com IA requer uma imagem. Documentos são salvos para referência.
                </Text>
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <Button
                title={autoCorrect && imageUri ? 'Salvar e corrigir com IA' : 'Salvar redação'}
                leftIcon={autoCorrect && imageUri ? 'sparkles-outline' : 'checkmark-outline'}
                onPress={handleSubmit}
                disabled={!canSubmit}
              />
            </View>
          </>
          )}
        </SectionBlock>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Bloco de seção ──────────────────────────────────────────────────────────

function PhotoQualityTips({ colors }: { colors: AppColors }) {
  const tips = [
    { icon: 'scan-outline' as const, text: 'Folha inteira' },
    { icon: 'sunny-outline' as const, text: 'Boa luz' },
    { icon: 'resize-outline' as const, text: 'Sem cortes' },
    { icon: 'create-outline' as const, text: 'Texto nítido' },
  ];

  return (
    <View style={styles.qualityGrid}>
      {tips.map((tip) => (
        <View key={tip.text} style={[styles.qualityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={tip.icon} size={15} color={colors.accent} />
          <Text style={[styles.qualityText, { color: colors.softText }]}>{tip.text}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionBlock({
  number, label, done, locked = false, colors, children,
}: {
  number: string; label: string; done: boolean; locked?: boolean; colors: AppColors; children: React.ReactNode;
}) {
  return (
    <View style={[
      bStyles.block,
      {
        backgroundColor: colors.surface,
        borderWidth: locked ? 1 : 0,
        borderColor: locked ? colors.border : 'transparent',
      },
    ]}>
      <View style={bStyles.header}>
        <View style={[
          bStyles.numBadge,
          {
            backgroundColor: done
              ? colors.success
              : locked
              ? colors.input
              : colors.accent,
            borderWidth: locked ? 1.5 : 0,
            borderColor: locked ? colors.border : 'transparent',
          },
        ]}>
          {done ? (
            <Ionicons name="checkmark" size={13} color="#fff" />
          ) : locked ? (
            <Ionicons name="lock-closed-outline" size={12} color={colors.mutedText} />
          ) : (
            <Text style={bStyles.num}>{number}</Text>
          )}
        </View>
        <Text style={[bStyles.label, { color: locked ? colors.mutedText : colors.text }]}>
          {label}
        </Text>
        {done ? (
          <View style={[bStyles.doneTag, { backgroundColor: colors.successSoft }]}>
            <Text style={[bStyles.doneText, { color: colors.success }]}>Pronto</Text>
          </View>
        ) : locked ? (
          <View style={[bStyles.lockedTag, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={9} color={colors.mutedText} />
            <Text style={[bStyles.lockedTagText, { color: colors.mutedText }]}>Bloqueado</Text>
          </View>
        ) : null}
      </View>
      <View style={[bStyles.body, locked && bStyles.bodyLocked]} pointerEvents={locked ? 'none' : 'auto'}>
        {children}
      </View>
    </View>
  );
}

const bStyles = StyleSheet.create({
  block: { borderRadius: 16, overflow: 'hidden', shadowColor: '#1B2559', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 12 },
  numBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 12, fontWeight: '700', color: '#fff' },
  label: { flex: 1, fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  doneTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  doneText: { fontSize: 11, fontWeight: '700' },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  lockedTagText: { fontSize: 10, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  bodyLocked: { opacity: 0.45 },
});

// ─── Estado vazio com ação ────────────────────────────────────────────────────

function EmptyAction({ message, buttonLabel, onPress, colors }: {
  message: string; buttonLabel: string; onPress: () => void; colors: AppColors;
}) {
  return (
    <View style={eStyles.wrap}>
      <Text style={[eStyles.msg, { color: colors.mutedText }]}>{message}</Text>
      <Button title={buttonLabel} leftIcon="add-outline" onPress={onPress} size="sm" />
    </View>
  );
}

function FreeThemeRow({ selected, onPress, colors }: {
  selected: boolean; onPress: () => void; colors: AppColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeRow,
        {
          borderColor: selected ? colors.accent : colors.accent + '40',
          backgroundColor: selected ? colors.accent + '10' : colors.accent + '06',
        },
      ]}
    >
      <View style={styles.themeInfo}>
        <View style={styles.freeThemeHeader}>
          <Ionicons name="sparkles" size={13} color={colors.accent} />
          <Text style={[styles.themeTitle, { color: colors.accent }]}>Tema Livre</Text>
        </View>
        <Text style={[styles.themeCategory, { color: colors.mutedText }]}>
          A IA identifica o tema automaticamente
        </Text>
      </View>
      <View style={[
        styles.themeRadio,
        { borderColor: selected ? colors.accent : colors.accent + '60' },
        selected && { backgroundColor: colors.accent },
      ]}>
        {selected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

const eStyles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  msg: { fontSize: 13, lineHeight: 18 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  lockedHint: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { fontSize: 13, lineHeight: 18 },

  // Turma filter
  turmaFilterRow: { flexDirection: 'row', gap: 7, paddingVertical: 2 },
  turmaFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5,
  },
  turmaFilterText: { fontSize: 12, fontWeight: '600' },
  noStudentHint: {
    width: 160, borderRadius: 12, borderWidth: 1.5, padding: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  noStudentText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // Alunos
  hList: { gap: 10, paddingVertical: 2, paddingRight: 4 },
  studentCard: { width: 120, borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 6, alignItems: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  studentInitials: { fontSize: 15, fontWeight: '700' },
  studentName: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  studentClass: { fontSize: 11, textAlign: 'center', lineHeight: 14 },

  // Temas
  themeList: { gap: 8 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 14 },
  themeInfo: { flex: 1, gap: 3 },
  freeThemeHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  themeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  themeCategory: { fontSize: 12, lineHeight: 16 },
  themeRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addThemeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 13,
  },
  addThemeInlineText: { fontSize: 13, fontWeight: '700' },

  // Upload
  uploadZone: { gap: 12 },
  cameraBtn: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  cameraIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cameraBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  cameraBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 16 },
  secondaryUploads: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14 },
  secIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  qualityText: { fontSize: 11, fontWeight: '700' },

  // Preview
  filePreview: { gap: 10 },
  previewImage: { width: '100%', height: 260 },
  docFileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  docIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  docFileInfo: { flex: 1, gap: 3 },
  docFileName: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  docFileHint: { fontSize: 12 },

  // Ação final
  summaryBlock: { gap: 10, marginBottom: 14 },
  reviewPanel: { gap: 10, marginBottom: 14, borderWidth: 1, borderRadius: 14, padding: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  summaryMeta: { fontSize: 12 },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 0 },
  toggleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toggleText: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbOn: { alignSelf: 'flex-end' },

  // Aviso documento
  docNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 0 },
  docNoticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
