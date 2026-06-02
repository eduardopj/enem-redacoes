import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SectionBlock, StepFile, StepReview, StepStudent, StepTheme } from '@/components/nova-redacao';
import { AppHeader, ScreenContainer, StepIndicator } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const IMAGE_QUALITY_THRESHOLD_KB = 150;
const MAX_IMAGE_SIZE_MB = 10;
const CAMERA_IMAGE_QUALITY = 0.68;
const LIBRARY_IMAGE_QUALITY = 0.72;

const STEP_LABELS = ['Aluno', 'Tema', 'Foto', 'Revisar'];

const FREE_THEME_ID = '__tema_livre__';
const FREE_THEME_ITEM = { id: FREE_THEME_ID, title: 'Tema Livre', category: 'A IA identifica o tema automaticamente' };

export default function NovaRedacaoScreen() {
  const { colors } = useAppTheme();
  const { studentId: studentIdParam, themeId: themeIdParam } = useLocalSearchParams<{
    studentId?: string;
    themeId?: string;
  }>();

  const { currentTeacher, students, themes, turmas, addEssay, evaluateEssayWithOpenAI } =
    useAppStore(
      useShallow((state) => ({
        currentTeacher: state.currentTeacher,
        students: state.students,
        themes: state.themes,
        turmas: state.turmas,
        addEssay: state.addEssay,
        evaluateEssayWithOpenAI: state.evaluateEssayWithOpenAI,
      }))
    );

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
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
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
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && 'size' in info && typeof info.size === 'number') {
        const sizeMb = info.size / 1024 / 1024;
        if (sizeMb > MAX_IMAGE_SIZE_MB) {
          Alert.alert(
            'Imagem muito pesada',
            `A foto tem ${sizeMb.toFixed(1)}MB. Para a correção funcionar melhor, tire outra foto em boa luz ou escolha uma imagem menor.`
          );
          return false;
        }

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
    setImageMimeType('image/jpeg');
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o uso da câmera nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: CAMERA_IMAGE_QUALITY,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (!(await checkImageQuality(asset.uri))) return;
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'foto-redacao.jpg');
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher a imagem da redação.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: LIBRARY_IMAGE_QUALITY,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if (!(await checkImageQuality(asset.uri))) return;
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'imagem-redacao.jpg');
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTheme || !hasFile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const essayId = addEssay({
      studentId: selectedStudent.id,
      themeTitle: selectedTheme.title,
      imageUri: imageUri || undefined,
      imageName: imageName || undefined,
      imageMimeType,
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
      <ScreenContainer showBack topBarTitle="Nova Redação">
        <AppHeader
          eyebrow="Nova redação"
          title="Enviar redação"
          subtitle="Siga as etapas abaixo"
        />

        {/* Progresso */}
        <StepIndicator steps={stepsDone} labels={STEP_LABELS} colors={colors} />

        {/* ── ETAPA 1: ALUNO ─────────────────────────────────────────────── */}
        <SectionBlock number="1" label="Aluno" done={stepsDone[0]} colors={colors}>
          <StepStudent
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            teacherStudents={teacherStudents}
            filteredStudents={filteredStudents}
            myTurmas={myTurmas}
            filterTurmaId={filterTurmaId}
            setFilterTurmaId={setFilterTurmaId}
            selectedStudent={selectedStudent}
            stepsDone={stepsDone}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 2: TEMA ──────────────────────────────────────────────── */}
        <SectionBlock number="2" label="Tema" done={stepsDone[1]} locked={!stepsDone[0]} colors={colors}>
          <StepTheme
            selectedThemeId={selectedThemeId}
            setSelectedThemeId={setSelectedThemeId}
            availableThemes={availableThemes}
            selectedTheme={selectedTheme}
            selectedStudentId={selectedStudentId}
            stepsDone={stepsDone}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 3: ARQUIVO ───────────────────────────────────────────── */}
        <SectionBlock number="3" label="Arquivo da redação" done={stepsDone[2]} locked={!stepsDone[1]} colors={colors}>
          <StepFile
            imageUri={imageUri}
            hasFile={hasFile}
            stepsDone={stepsDone}
            onTakePhoto={handleTakePhoto}
            onPickImage={handlePickImage}
            onClearFile={clearFile}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 4: REVISAR ───────────────────────────────────────────── */}
        <SectionBlock number="4" label="Revisar e salvar" done={false} locked={!canSubmit} colors={colors}>
          <StepReview
            selectedStudent={selectedStudent}
            selectedTheme={selectedTheme}
            imageUri={imageUri}
            imageName={imageName}
            autoCorrect={autoCorrect}
            setAutoCorrect={setAutoCorrect}
            canSubmit={canSubmit}
            onSubmit={handleSubmit}
            colors={colors}
          />
        </SectionBlock>
      </ScreenContainer>
    </ProtectedRoute>
  );
}
