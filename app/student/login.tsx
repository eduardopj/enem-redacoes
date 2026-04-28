import { useAppStore } from '@/store/app-store';
import { lookupTurmaByCode } from '@/services/sync/sync-turmas';
import { useAppTheme } from '@/theme/ThemeContext';
import { QRJoinPayload } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The pending turma info — same shape regardless of how the student joined (QR or code)
type PendingTurma = {
  teacherId: string;
  teacherName: string;
  turmaId: string;
  turmaName: string;
};

type Mode = 'choose' | 'qr_scan' | 'confirm' | 'code_entry' | 'personal_code';

export default function StudentLoginScreen() {
  const { colors } = useAppTheme();
  const joinTurmaByQR = useAppStore((s) => s.joinTurmaByQR);
  const loginAsStudent = useAppStore((s) => s.loginAsStudent);

  const [mode, setMode] = useState<Mode>('choose');
  const [pending, setPending] = useState<PendingTurma | null>(null);

  // QR scan
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanLocked = useRef(false);

  // Confirm (name input — used after QR scan OR code lookup)
  const [studentName, setStudentName] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [joining, setJoining] = useState(false);

  // Code entry
  const [turmaCode, setTurmaCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  // Personal code (legacy)
  const [teacherEmail, setTeacherEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [personalError, setPersonalError] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);

  useEffect(() => {
    if (mode === 'qr_scan' && !cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [mode]);

  // ── QR scan handler ──────────────────────────────────────────────────────
  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanLocked.current) return;
    scanLocked.current = true;
    try {
      const payload = JSON.parse(data) as QRJoinPayload;
      if (payload.type !== 'enem-ia-join-v1') throw new Error('QR inválido');
      setPending({
        teacherId: payload.teacherId,
        teacherName: payload.teacherName,
        turmaId: payload.turmaId,
        turmaName: payload.turmaName,
      });
      setStudentName('');
      setConfirmError('');
      setMode('confirm');
    } catch {
      Alert.alert(
        'QR inválido',
        'Este QR Code não pertence ao ENEM IA. Peça ao seu professor o QR correto.',
        [{ text: 'OK', onPress: () => { scanLocked.current = false; } }]
      );
    }
  }

  // ── Code entry handler ────────────────────────────────────────────────────
  async function handleCodeContinue() {
    const code = turmaCode.trim().toUpperCase();
    if (code.length < 6) {
      setCodeError('Digite o código completo.');
      return;
    }
    setCodeError('');
    setLookingUp(true);
    const turmaData = await lookupTurmaByCode(code);
    setLookingUp(false);

    if (!turmaData) {
      setCodeError('Código não encontrado. Verifique com seu professor.');
      return;
    }
    setPending({
      teacherId: turmaData.teacherId,
      teacherName: turmaData.teacherName,
      turmaId: turmaData.turmaId,
      turmaName: turmaData.turmaName,
    });
    setStudentName('');
    setConfirmError('');
    setMode('confirm');
  }

  // ── Confirm join handler ──────────────────────────────────────────────────
  async function handleConfirmJoin() {
    if (!pending || !studentName.trim()) {
      setConfirmError('Digite seu nome completo.');
      return;
    }
    setJoining(true);
    await new Promise((r) => setTimeout(r, 250));
    const result = joinTurmaByQR(
      {
        type: 'enem-ia-join-v1',
        teacherId: pending.teacherId,
        teacherName: pending.teacherName,
        teacherEmail: '',
        turmaId: pending.turmaId,
        turmaName: pending.turmaName,
        joinCode: '',
      },
      studentName
    );
    setJoining(false);
    if (!result.success) {
      setConfirmError((result as any).error);
    } else {
      router.replace('/student/home' as any);
    }
  }

  // ── Personal code handler ─────────────────────────────────────────────────
  async function handlePersonalLogin() {
    setPersonalError('');
    if (!teacherEmail.trim() || !accessCode.trim()) {
      setPersonalError('Preencha todos os campos.');
      return;
    }
    setPersonalLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    const result = loginAsStudent(teacherEmail, accessCode);
    setPersonalLoading(false);
    if (!result.success) {
      setPersonalError((result as any).error);
    } else {
      router.replace('/student/home' as any);
    }
  }

  // ── Back handler ─────────────────────────────────────────────────────────
  function handleBack() {
    if (mode === 'choose') {
      router.back();
    } else if (mode === 'confirm' && turmaCode) {
      setMode('code_entry');
    } else if (mode === 'confirm') {
      scanLocked.current = false;
      setMode('qr_scan');
    } else {
      setMode('choose');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="chevron-back" size={22} color={colors.softText} />
        <Text style={[styles.backLabel, { color: colors.softText }]}>
          {mode === 'choose' ? 'Voltar' : 'Voltar'}
        </Text>
      </Pressable>

      {/* ── MODE: choose ── */}
      {mode === 'choose' && (
        <ScrollView contentContainerStyle={styles.chooseContent} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: '#22C55E18' }]}>
              <Ionicons name="school" size={36} color="#22C55E" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Área do aluno</Text>
            <Text style={[styles.heroSub, { color: colors.mutedText }]}>
              Como você vai entrar na sua turma?
            </Text>
          </View>

          <View style={styles.options}>
            {/* QR Code — primary */}
            <Pressable
              onPress={() => setMode('qr_scan')}
              style={[styles.optionCard, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Ionicons name="qr-code" size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Escanear QR Code</Text>
                <Text style={styles.optionSub}>Aponte a câmera para o QR da sua turma</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Text style={styles.badgeText}>Mais fácil</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0 }} />
            </Pressable>

            {/* Code — secondary */}
            <Pressable
              onPress={() => setMode('code_entry')}
              style={[styles.optionCard, styles.optionCardBorder, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="keypad-outline" size={26} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Entrar com código</Text>
                <Text style={[styles.optionSub, { color: colors.mutedText }]}>Seu professor forneceu um código de 8 letras</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} style={{ flexShrink: 0 }} />
            </Pressable>
          </View>

          {/* Personal code link */}
          <Pressable onPress={() => setMode('personal_code')} style={styles.personalLink}>
            <Text style={[styles.personalLinkText, { color: colors.mutedText }]}>
              Tenho um código de acesso pessoal
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── MODE: qr_scan ── */}
      {mode === 'qr_scan' && (
        <View style={styles.scanContainer}>
          {!cameraPermission?.granted ? (
            <View style={styles.permWrap}>
              <Ionicons name="camera-outline" size={52} color={colors.mutedText} />
              <Text style={[styles.permTitle, { color: colors.text }]}>Câmera necessária</Text>
              <Text style={[styles.permText, { color: colors.mutedText }]}>
                Precisamos da câmera para escanear o QR Code da turma.
              </Text>
              <Pressable
                onPress={requestCameraPermission}
                style={[styles.permBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.permBtnText}>Permitir câmera</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanTop}>
                  <Text style={styles.scanTitle}>Aponte para o QR Code</Text>
                  <Text style={styles.scanSub}>do professor</Text>
                </View>
                <View style={styles.scanFrame}>
                  {(['TL','TR','BL','BR'] as const).map((pos) => (
                    <View key={pos} style={[styles.corner, styles[`corner${pos}`]]} />
                  ))}
                </View>
                <Pressable
                  onPress={() => setMode('code_entry')}
                  style={[styles.switchBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                >
                  <Text style={styles.switchBtnText}>Prefiro digitar o código</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* ── MODE: code_entry ── */}
      {mode === 'code_entry' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formHero}>
              <View style={[styles.heroIcon, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="keypad-outline" size={30} color={colors.accent} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Código da turma</Text>
              <Text style={[styles.heroSub, { color: colors.mutedText }]}>
                Digite o código de 8 letras que seu professor compartilhou.
              </Text>
            </View>

            <View style={[styles.codeInputWrap, { backgroundColor: colors.input, borderColor: codeError ? colors.danger : colors.border }]}>
              <TextInput
                style={[styles.codeInput, { color: colors.text }]}
                placeholder="ABCD1234"
                placeholderTextColor={colors.mutedText}
                value={turmaCode}
                onChangeText={(t) => { setTurmaCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError(''); }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                returnKeyType="go"
                onSubmitEditing={handleCodeContinue}
                autoFocus
              />
            </View>
            {codeError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{codeError}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: lookingUp ? colors.accent + '80' : colors.accent }]}
              onPress={handleCodeContinue}
              disabled={lookingUp}
            >
              {lookingUp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>

            <Pressable onPress={() => setMode('qr_scan')} style={styles.altLink}>
              <Ionicons name="qr-code-outline" size={14} color={colors.accent} />
              <Text style={[styles.altLinkText, { color: colors.accent }]}>Prefiro escanear o QR Code</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── MODE: confirm ── */}
      {mode === 'confirm' && pending && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {/* Turma confirmed card */}
            <View style={[styles.turmaCard, { backgroundColor: '#22C55E0E', borderColor: '#22C55E30' }]}>
              <View style={[styles.turmaCheck, { backgroundColor: '#22C55E18' }]}>
                <Ionicons name="checkmark-circle" size={26} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.turmaLabel, { color: '#16A34A' }]}>Turma encontrada!</Text>
                <Text style={[styles.turmaName, { color: colors.text }]}>{pending.turmaName}</Text>
                <Text style={[styles.turmaTeacher, { color: colors.mutedText }]}>
                  Prof. {pending.teacherName}
                </Text>
              </View>
            </View>

            {/* Name input */}
            <View style={styles.nameSection}>
              <Text style={[styles.nameLabel, { color: colors.text }]}>Qual é o seu nome?</Text>
              <Text style={[styles.nameSub, { color: colors.mutedText }]}>
                Aparecerá nos resultados e no ranking da turma.
              </Text>
              <View style={[styles.nameInputWrap, { backgroundColor: colors.input, borderColor: confirmError ? colors.danger : colors.border }]}>
                <Ionicons name="person-outline" size={18} color={colors.mutedText} />
                <TextInput
                  style={[styles.nameInput, { color: colors.text }]}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.mutedText}
                  value={studentName}
                  onChangeText={(t) => { setStudentName(t); setConfirmError(''); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleConfirmJoin}
                />
              </View>
              {confirmError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{confirmError}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: joining ? colors.accent + '80' : '#22C55E' }]}
              onPress={handleConfirmJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Entrar na turma</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── MODE: personal_code ── */}
      {mode === 'personal_code' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formHero}>
              <View style={[styles.heroIcon, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="key-outline" size={30} color={colors.accent} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Código pessoal</Text>
              <Text style={[styles.heroSub, { color: colors.mutedText }]}>
                Use quando o professor cadastrou você diretamente e forneceu um código individual.
              </Text>
            </View>

            <View style={styles.formFields}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.softText }]}>E-mail do professor</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedText} />
                  <TextInput
                    style={[styles.fieldInputText, { color: colors.text }]}
                    placeholder="professor@escola.com"
                    placeholderTextColor={colors.mutedText}
                    value={teacherEmail}
                    onChangeText={(t) => { setTeacherEmail(t); setPersonalError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.softText }]}>Seu código de acesso</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="key-outline" size={18} color={colors.mutedText} />
                  <TextInput
                    style={[styles.fieldInputText, styles.monoInput, { color: colors.text }]}
                    placeholder="ABC123"
                    placeholderTextColor={colors.mutedText}
                    value={accessCode}
                    onChangeText={(t) => { setAccessCode(t.toUpperCase()); setPersonalError(''); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handlePersonalLogin}
                  />
                </View>
              </View>
            </View>

            {personalError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{personalError}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: personalLoading ? colors.accent + '80' : colors.accent }]}
              onPress={handlePersonalLogin}
              disabled={personalLoading}
            >
              {personalLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const CORNER = 28;
const CORNER_T = 4;
const CORNER_R = 8;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backLabel: { fontSize: 15, fontWeight: '500' },

  // ── Choose ──
  chooseContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center', gap: 28 },
  hero: { alignItems: 'center', gap: 12, paddingTop: 8 },
  heroIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  heroSub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },

  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
  },
  optionCardBorder: { borderWidth: 1.5, shadowOpacity: 0, elevation: 0 },
  optionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  optionSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  personalLink: { alignItems: 'center', paddingVertical: 8 },
  personalLinkText: { fontSize: 13, textDecorationLine: 'underline' },

  // ── Scan ──
  scanContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  scanTop: { alignItems: 'center', gap: 6 },
  scanTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  scanSub: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T, borderTopLeftRadius: CORNER_R },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T, borderTopRightRadius: CORNER_R },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T, borderBottomLeftRadius: CORNER_R },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T, borderBottomRightRadius: CORNER_R },
  switchBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  switchBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── Permission ──
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  permBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Form shared ──
  formContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8, flexGrow: 1, gap: 20 },
  formHero: { alignItems: 'center', gap: 12, paddingTop: 8 },
  codeInputWrap: {
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 20, paddingVertical: 18,
    alignItems: 'center',
  },
  codeInput: { fontSize: 32, fontWeight: '800', letterSpacing: 8, textAlign: 'center' },

  // ── Confirm ──
  turmaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  turmaCheck: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  turmaName: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  turmaTeacher: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  nameSection: { gap: 8 },
  nameLabel: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  nameSub: { fontSize: 13, lineHeight: 19 },
  nameInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  nameInput: { flex: 1, fontSize: 17 },

  // ── Personal code ──
  formFields: { gap: 14 },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '700' },
  fieldInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  fieldInputText: { flex: 1, fontSize: 16 },
  monoInput: { fontSize: 22, fontWeight: '700', letterSpacing: 3 },

  // ── Shared buttons ──
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  altLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  altLinkText: { fontSize: 13, fontWeight: '600' },

  // ── Error ──
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
});
