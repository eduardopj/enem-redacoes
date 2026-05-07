import { StudentRoute } from '@/components/auth/StudentRoute';
import { Button, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { EssayInputMode, ThemeItem } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── ENEM themes list ─────────────────────────────────────────────────────────

const ENEM_THEMES = [
  { year: '2024', title: 'Invisibilidade e registro civil: desafios para a cidadania no Brasil', category: 'Cidadania e Direitos' },
  { year: '2023', title: 'Desafios para o enfrentamento da invisibilidade da violência contra os idosos no Brasil', category: 'Sociedade e Saúde' },
  { year: '2022', title: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', category: 'Diversidade e Cultura' },
  { year: '2021', title: 'Invisibilidade e registro civil: desafios para a cidadania no Brasil', category: 'Cidadania e Direitos' },
  { year: '2020', title: 'O estigma associado às doenças mentais na sociedade brasileira', category: 'Saúde e Sociedade' },
  { year: '2019', title: 'Democratização do acesso ao cinema no Brasil', category: 'Cultura e Educação' },
  { year: '2018', title: 'Manipulação do comportamento do usuário pelo controle de dados na internet', category: 'Tecnologia e Sociedade' },
  { year: '2017', title: 'Desafios para a formação educacional de surdos no Brasil', category: 'Educação e Inclusão' },
  { year: '2016', title: 'Caminhos para combater a intolerância religiosa no Brasil', category: 'Direitos Humanos' },
  { year: '2015', title: 'A persistência da violência contra a mulher na sociedade brasileira', category: 'Direitos Humanos' },
  { year: '2014', title: 'Publicidade infantil em questão no Brasil', category: 'Consumo e Sociedade' },
  { year: '2013', title: 'Efeitos da implantação da Lei Seca no Brasil', category: 'Saúde e Legislação' },
  { year: '2012', title: 'O movimento imigratório para o Brasil no século XXI', category: 'Sociedade e Cultura' },
];

const MODE_OPTIONS: { key: EssayInputMode; icon: string; label: string; sub: string }[] = [
  { key: 'manuscrita', icon: 'camera-outline',   label: 'Foto',    sub: 'Manuscrita ou impressa' },
  { key: 'digitada',   icon: 'create-outline',   label: 'Digitar', sub: 'Escreva no app' },
  { key: 'upload',     icon: 'document-outline', label: 'Upload',  sub: 'Arquivo de imagem' },
];

// ─── Theme picker ─────────────────────────────────────────────────────────────

function ThemePickerModal({
  visible,
  teacherThemes,
  onSelect,
  onClose,
}: {
  visible: boolean;
  teacherThemes: ThemeItem[];
  onSelect: (title: string) => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');

  const allThemes = useMemo(() => {
    const teacher = teacherThemes.map(t => ({ year: 'Professor', title: t.title, category: t.category }));
    return [...teacher, ...ENEM_THEMES];
  }, [teacherThemes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allThemes;
    const q = search.trim().toLowerCase();
    return allThemes.filter(t =>
      t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [allThemes, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Escolher tema</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.softText} />
          </Pressable>
        </View>

        <View style={[styles.modalSearch, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedText} />
          <TextInput
            style={[styles.modalSearchInput, { color: colors.text }]}
            placeholder="Buscar tema..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        {/* Tema Livre */}
        <Pressable
          onPress={() => { onSelect('Tema Livre'); onClose(); }}
          style={[styles.freeThemeItem, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}
        >
          <View style={[styles.freeThemeIcon, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.freeThemeTitle, { color: colors.accent }]}>Tema Livre</Text>
            <Text style={[styles.freeThemeSub, { color: colors.mutedText }]}>
              A IA identifica automaticamente o tema da sua redação
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </Pressable>

        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.modalList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { onSelect(item.title); onClose(); }}
              style={[styles.themeItem, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.themeItemTop}>
                  <View style={[styles.yearPill, {
                    backgroundColor: item.year === 'Professor' ? colors.accent + '14' : colors.input,
                  }]}>
                    <Text style={[styles.yearPillText, {
                      color: item.year === 'Professor' ? colors.accent : colors.mutedText,
                    }]}>
                      {item.year === 'Professor' ? 'Prof.' : item.year}
                    </Text>
                  </View>
                  <View style={[styles.catPill, { backgroundColor: colors.input }]}>
                    <Text style={[styles.catPillText, { color: colors.mutedText }]}>{item.category}</Text>
                  </View>
                </View>
                <Text style={[styles.themeItemTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.accent} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StudentNovaScreen() {
  const { colors } = useAppTheme();
  const { themeTitle: initialTheme } = useLocalSearchParams<{ themeTitle?: string }>();
  const currentStudent = useAppStore(s => s.currentStudent);
  const themes = useAppStore(s => s.themes);
  const addEssay = useAppStore(s => s.addEssay);
  const evaluateEssayWithOpenAI = useAppStore(s => s.evaluateEssayWithOpenAI);

  const [mode, setMode] = useState<EssayInputMode>('manuscrita');
  const [themeTitle, setThemeTitle] = useState(initialTheme ? decodeURIComponent(initialTheme) : '');
  const [imageUri, setImageUri] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [essayText, setEssayText] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const textInputRef = useRef<TextInput>(null);

  const teacherThemes = useMemo(
    () => themes.filter(t => t.teacherId === currentStudent?.teacherId),
    [themes, currentStudent]
  );

  const hasContent =
    mode === 'digitada'
      ? essayText.trim().length >= 100
      : imageUri.length > 0;

  const canSubmit = themeTitle.trim().length > 0 && hasContent;

  // ── Image handlers ──────────────────────────────────────────────────────────

  function clearImage() {
    setImageUri('');
    setImageName('');
    setImageMimeType('image/jpeg');
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.68, allowsEditing: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'redacao.jpg');
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.72,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageName(asset.fileName ?? 'redacao.jpg');
    setImageMimeType(asset.mimeType ?? 'image/jpeg');
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageName(asset.name ?? 'redacao.jpg');
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
    }
  }

  // ── Mode change ─────────────────────────────────────────────────────────────

  function handleModeChange(newMode: EssayInputMode) {
    if (newMode === mode) return;
    Haptics.selectionAsync();
    setMode(newMode);
    clearImage();
    setEssayText('');
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);

    const essayId = addEssay({
      themeTitle: themeTitle.trim(),
      inputMode: mode,
      essayText: mode === 'digitada' ? essayText.trim() : undefined,
      imageUri: mode !== 'digitada' ? imageUri : undefined,
      imageName: mode !== 'digitada' ? imageName : undefined,
      imageMimeType: mode !== 'digitada' ? imageMimeType : undefined,
    });

    if (!essayId) {
      Alert.alert('Erro', 'Não foi possível enviar sua redação. Tente novamente.');
      setSubmitting(false);
      return;
    }

    evaluateEssayWithOpenAI(essayId).catch(() => {});
    router.replace(`/redacao/${essayId}` as any);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <StudentRoute>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScreenContainer showStudentNav>
          {/* Header */}
          <View style={styles.titleRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Enviar redação</Text>
            <Text style={[styles.title, { color: colors.text }]}>Nova redação</Text>
          </View>

          {/* ── Step 1: Mode selector ── */}
          <View style={[styles.modeCard, { backgroundColor: colors.surface }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.accent + '18' }]}>
                <Text style={[styles.stepNum, { color: colors.accent }]}>1</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Como você vai enviar?</Text>
            </View>
            <View style={styles.modeRow}>
              {MODE_OPTIONS.map(opt => {
                const active = mode === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleModeChange(opt.key)}
                    style={[
                      styles.modeOption,
                      {
                        backgroundColor: active ? colors.accent : colors.input,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={active ? '#fff' : colors.mutedText}
                    />
                    <Text style={[styles.modeLabel, { color: active ? '#fff' : colors.text }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.modeSub, { color: active ? 'rgba(255,255,255,0.75)' : colors.mutedText }]}>
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Step 2: Theme ── */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: themeTitle ? colors.success + '18' : colors.accent + '18' }]}>
                {themeTitle
                  ? <Ionicons name="checkmark" size={14} color={colors.success} />
                  : <Text style={[styles.stepNum, { color: colors.accent }]}>2</Text>
                }
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Escolha o tema</Text>
            </View>

            {themeTitle ? (
              <View style={[styles.selectedTheme, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Ionicons name="bookmark" size={16} color={colors.accent} />
                <Text style={[styles.selectedThemeText, { color: colors.text }]} numberOfLines={3}>
                  {themeTitle}
                </Text>
                <Pressable onPress={() => setThemeTitle('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.mutedText} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowThemePicker(true)}
                style={[styles.pickThemeBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              >
                <Ionicons name="list-outline" size={18} color={colors.accent} />
                <Text style={[styles.pickThemeBtnText, { color: colors.accent }]}>Selecionar tema</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
              </Pressable>
            )}
          </Card>

          {/* ── Step 3: Content (mode-dependent) ── */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: hasContent ? colors.success + '18' : colors.accent + '18' }]}>
                {hasContent
                  ? <Ionicons name="checkmark" size={14} color={colors.success} />
                  : <Text style={[styles.stepNum, { color: colors.accent }]}>3</Text>
                }
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>
                {mode === 'manuscrita' && 'Foto da redação'}
                {mode === 'digitada'   && 'Digite sua redação'}
                {mode === 'upload'     && 'Arquivo da redação'}
              </Text>
            </View>

            {/* ── Foto mode ── */}
            {mode === 'manuscrita' && (
              imageUri ? (
                <View>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.previewImage, { borderColor: colors.border }]}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={clearImage}
                    style={[styles.removeBtn, { backgroundColor: colors.dangerSoft }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[styles.removeBtnText, { color: colors.danger }]}>Remover foto</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.photoButtons}>
                    <Pressable
                      onPress={takePhoto}
                      style={[styles.photoBtnPrimary, { backgroundColor: colors.text }]}
                    >
                      <Ionicons name="camera-outline" size={20} color="#fff" />
                      <Text style={styles.photoBtnPrimaryText}>Tirar foto</Text>
                    </Pressable>
                    <Pressable
                      onPress={pickFromGallery}
                      style={[styles.photoBtnSecondary, { backgroundColor: colors.input, borderColor: colors.border }]}
                    >
                      <Ionicons name="images-outline" size={20} color={colors.accent} />
                      <Text style={[styles.photoBtnSecondaryText, { color: colors.accent }]}>Galeria</Text>
                    </Pressable>
                  </View>
                  <View style={[styles.hint, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} />
                    <Text style={[styles.hintText, { color: colors.mutedText }]}>
                      Boa iluminação, folha plana e texto legível para melhor resultado.
                    </Text>
                  </View>
                </>
              )
            )}

            {/* ── Digitar mode ── */}
            {mode === 'digitada' && (
              <>
                <View style={[
                  styles.textAreaWrapper,
                  {
                    backgroundColor: colors.input,
                    borderColor: essayText.trim().length >= 100 ? colors.success : colors.border,
                  },
                ]}>
                  <TextInput
                    ref={textInputRef}
                    style={[styles.textArea, { color: colors.text }]}
                    placeholder="Digite aqui o texto completo da sua redação. Mantenha os parágrafos organizados. A IA avaliará ortografia, argumentação, coesão e proposta de intervenção."
                    placeholderTextColor={colors.mutedText}
                    multiline
                    textAlignVertical="top"
                    value={essayText}
                    onChangeText={setEssayText}
                    autoCorrect={false}
                    autoCapitalize="sentences"
                  />
                  <View style={[styles.charCountRow, { borderTopColor: colors.border }]}>
                    <Text style={[
                      styles.charCount,
                      { color: essayText.trim().length >= 100 ? colors.success : colors.mutedText },
                    ]}>
                      {essayText.trim().length} caracteres
                      {essayText.trim().length < 100 && ` • mínimo 100`}
                    </Text>
                    {essayText.trim().length > 0 && (
                      <Pressable onPress={() => setEssayText('')} hitSlop={8}>
                        <Text style={[styles.clearText, { color: colors.danger }]}>Limpar</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <View style={[styles.hint, { backgroundColor: colors.input, borderColor: colors.border, marginTop: 10 }]}>
                  <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                  <Text style={[styles.hintText, { color: colors.mutedText }]}>
                    Preserve seus erros originais — a IA avalia a escrita real, não corrigida.
                  </Text>
                </View>
              </>
            )}

            {/* ── Upload mode ── */}
            {mode === 'upload' && (
              imageUri ? (
                <View>
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.previewImage, { borderColor: colors.border }]}
                    contentFit="cover"
                  />
                  <Text style={[styles.fileName, { color: colors.mutedText }]} numberOfLines={1}>
                    {imageName}
                  </Text>
                  <Pressable
                    onPress={clearImage}
                    style={[styles.removeBtn, { backgroundColor: colors.dangerSoft }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[styles.removeBtnText, { color: colors.danger }]}>Remover arquivo</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={pickFile}
                    style={[styles.uploadBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
                  >
                    <View style={[styles.uploadIconWrap, { backgroundColor: colors.accent + '14' }]}>
                      <Ionicons name="cloud-upload-outline" size={26} color={colors.accent} />
                    </View>
                    <Text style={[styles.uploadBtnTitle, { color: colors.text }]}>Selecionar arquivo</Text>
                    <Text style={[styles.uploadBtnSub, { color: colors.mutedText }]}>
                      JPG, PNG ou WebP • Imagem da redação
                    </Text>
                  </Pressable>
                  <View style={[styles.hint, { backgroundColor: colors.input, borderColor: colors.border, marginTop: 10 }]}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} />
                    <Text style={[styles.hintText, { color: colors.mutedText }]}>
                      Selecione a imagem da redação salva nos seus arquivos ou Downloads.
                    </Text>
                  </View>
                </>
              )
            )}
          </Card>

          {/* ── Step 4: Submit ── */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.accent + '18' }]}>
                <Text style={[styles.stepNum, { color: colors.accent }]}>4</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Enviar para a IA</Text>
            </View>

            <View style={[styles.aiInfoBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
              {[
                mode === 'manuscrita' || mode === 'upload'
                  ? 'Transcrição automática do manuscrito'
                  : 'Análise do texto digitado',
                'Avaliação das 5 competências ENEM',
                'Diagnóstico detalhado por competência',
                'Plano de melhoria personalizado',
                'Análise de vocabulário e sugestões',
              ].map((item, i) => (
                <View key={i} style={styles.aiInfoRow}>
                  <View style={[styles.aiInfoDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.aiInfoText, { color: colors.softText }]}>{item}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Enviar para correção com IA"
              leftIcon="sparkles-outline"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
            />

            {!canSubmit && (
              <Text style={[styles.disabledHint, { color: colors.mutedText }]}>
                {!themeTitle
                  ? 'Selecione o tema para continuar'
                  : mode === 'digitada'
                  ? `Digite ao menos 100 caracteres (${essayText.trim().length}/100)`
                  : 'Adicione a imagem da redação'}
              </Text>
            )}
          </Card>

          <ThemePickerModal
            visible={showThemePicker}
            teacherThemes={teacherThemes}
            onSelect={setThemeTitle}
            onClose={() => setShowThemePicker(false)}
          />
        </ScreenContainer>
      </KeyboardAvoidingView>
    </StudentRoute>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  titleRow: { paddingTop: 4, gap: 4, marginBottom: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0, lineHeight: 32 },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepBadge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 13, fontWeight: '800' },
  stepLabel: { fontSize: 15, fontWeight: '700' },

  // Mode selector
  modeCard: { borderRadius: 18, padding: 18, gap: 14, marginBottom: 12, shadowColor: '#101828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeOption: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', gap: 6,
  },
  modeLabel: { fontSize: 13, fontWeight: '700' },
  modeSub: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  // Theme
  selectedTheme: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  selectedThemeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  pickThemeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  pickThemeBtnText: { flex: 1, fontSize: 15, fontWeight: '600' },

  // Photo
  photoButtons: { flexDirection: 'row', gap: 10 },
  photoBtnPrimary: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  photoBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  photoBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5,
  },
  photoBtnSecondaryText: { fontSize: 14, fontWeight: '700' },
  previewImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  removeBtn: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  removeBtnText: { fontSize: 12, fontWeight: '600' },
  fileName: { fontSize: 12, marginBottom: 6, marginTop: -4 },

  // Text area
  textAreaWrapper: { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  textArea: { minHeight: 240, padding: 14, fontSize: 15, lineHeight: 24 },
  charCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  charCount: { fontSize: 12, fontWeight: '500' },
  clearText: { fontSize: 12, fontWeight: '600' },

  // Upload
  uploadBtn: {
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', gap: 8, paddingVertical: 28,
  },
  uploadIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  uploadBtnTitle: { fontSize: 15, fontWeight: '700' },
  uploadBtnSub: { fontSize: 12 },

  // Hint
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 10 },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17 },

  // AI info
  aiInfoBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginBottom: 14 },
  aiInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiInfoDot: { width: 6, height: 6, borderRadius: 3 },
  aiInfoText: { fontSize: 13, lineHeight: 18 },
  disabledHint: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Modal
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  modalSearch: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginHorizontal: 16, marginVertical: 12 },
  modalSearchInput: { flex: 1, fontSize: 15 },
  modalList: { paddingHorizontal: 16, paddingBottom: 40, gap: 0 },
  freeThemeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginVertical: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  freeThemeIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  freeThemeTitle: { fontSize: 15, fontWeight: '700' },
  freeThemeSub: { fontSize: 12, lineHeight: 17 },
  themeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  themeItemTop: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  yearPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  yearPillText: { fontSize: 10, fontWeight: '700' },
  catPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  catPillText: { fontSize: 10, fontWeight: '500' },
  themeItemTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
