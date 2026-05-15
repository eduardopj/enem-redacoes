import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'choose' | 'code' | 'personal' | 'qr';

// ─── QR Scanner ───────────────────────────────────────────────────────────────

function QRScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  if (!permission?.granted) {
    return (
      <View style={[qrStyles.permWrap, { backgroundColor: '#000' }]}>
        <Ionicons name="camera-off-outline" size={48} color="#fff" style={{ marginBottom: 16 }} />
        <Text style={qrStyles.permText}>Precisamos da câmera para escanear o QR Code</Text>
        <Pressable onPress={requestPermission} style={qrStyles.permBtn}>
          <Text style={qrStyles.permBtnText}>Permitir câmera</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[qrStyles.permBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' }]}>
          <Text style={[qrStyles.permBtnText, { color: '#fff' }]}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanned.current) return;
          scanned.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onScan(data);
        }}
      />
      {/* Overlay */}
      <View style={qrStyles.overlay}>
        <View style={qrStyles.topOverlay} />
        <View style={qrStyles.middleRow}>
          <View style={qrStyles.sideOverlay} />
          <View style={qrStyles.scanBox}>
            <View style={[qrStyles.corner, qrStyles.topLeft]} />
            <View style={[qrStyles.corner, qrStyles.topRight]} />
            <View style={[qrStyles.corner, qrStyles.bottomLeft]} />
            <View style={[qrStyles.corner, qrStyles.bottomRight]} />
          </View>
          <View style={qrStyles.sideOverlay} />
        </View>
        <View style={qrStyles.bottomOverlay}>
          <Text style={qrStyles.scanHint}>Aponte para o QR Code do professor</Text>
          <Pressable onPress={onClose} style={qrStyles.cancelBtn}>
            <Ionicons name="close" size={20} color="#fff" />
            <Text style={qrStyles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const qrStyles = StyleSheet.create({
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  permBtn: { backgroundColor: '#6366F1', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center' },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: 260 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanBox: { width: 260, height: 260 },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 24, gap: 16 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanHint: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10 },
  cancelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StudentLoginScreen() {
  const { colors } = useAppTheme();
  const joinTurmaByQR = useAppStore((s) => s.joinTurmaByQR);
  const joinTurmaByCode = useAppStore((s) => s.joinTurmaByCode);
  const loginAsStudent = useAppStore((s) => s.loginAsStudent);

  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [turmaCode, setTurmaCode] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  function goStep(s: Step) {
    setError('');
    setStep(s);
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  function formatBirthDate(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function parseBirthDate(ddmmyyyy: string): string | null {
    const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    if (year < 1990 || year > 2015) return null;
    return `${yyyy}-${mm}-${dd}`;
  }

  async function handleCodeJoin() {
    const cleanName = name.trim();
    const code = turmaCode.trim().toUpperCase();
    const bd = parseBirthDate(birthDate);

    if (!cleanName) return setError('Digite seu nome completo.');
    if (code.length < 6) return setError('Código da turma precisa ter 6+ caracteres.');
    if (!bd) return setError('Data de nascimento inválida. Use DD/MM/AAAA.');

    setLoading(true);
    setError('');
    const result = await joinTurmaByCode(code, cleanName, bd);
    setLoading(false);
    if (!result.success) return setError(result.error);
    router.replace('/student/home' as any);
  }

  async function handlePersonalJoin() {
    if (!teacherEmail.trim()) return setError('Informe o e-mail do professor.');
    if (!accessCode.trim()) return setError('Informe seu código de acesso.');

    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 180));
    const result = loginAsStudent(teacherEmail.trim().toLowerCase(), accessCode.trim().toUpperCase());
    setLoading(false);
    if (!result.success) return setError(result.error);
    router.replace('/student/home' as any);
  }

  async function handleQRScan(data: string) {
    setShowQR(false);
    try {
      const payload = JSON.parse(data);
      if (payload?.type !== 'enem-ia-join-v1') {
        return Alert.alert('QR inválido', 'Este QR Code não é de uma turma Enem IA.');
      }
      // Ask for name and birthdate after scan
      goStep('code');
      setTurmaCode(payload.joinCode ?? '');
    } catch {
      Alert.alert('QR inválido', 'Não foi possível ler este QR Code.');
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <Modal visible={showQR} animationType="slide" statusBarTranslucent>
        <QRScanner onScan={handleQRScan} onClose={() => setShowQR(false)} />
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Back button */}
          {step !== 'choose' && (
            <Pressable onPress={() => goStep('choose')} style={s.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color={colors.softText} />
              <Text style={[s.backText, { color: colors.softText }]}>Voltar</Text>
            </Pressable>
          )}

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.logoGradient}>
              <Text style={s.logoEmoji}>🎓</Text>
            </View>
            <Text style={[s.brand, { color: colors.mutedText }]}>ENEM IA</Text>
            <Text style={[s.title, { color: colors.text }]}>
              {step === 'choose' ? 'Área do aluno' : step === 'code' ? 'Entrar na turma' : 'Código pessoal'}
            </Text>
            <Text style={[s.subtitle, { color: colors.mutedText }]}>
              {step === 'choose'
                ? 'Como você quer entrar?'
                : step === 'code'
                ? 'Use o código que o professor compartilhou'
                : 'Use seu código de acesso individual'}
            </Text>
          </View>

          <Animated.View style={{ opacity: step === 'choose' ? 1 : fadeAnim }}>
            {/* ── CHOOSE MODE ── */}
            {step === 'choose' && (
              <View style={s.options}>
                <OptionCard
                  emoji="📱"
                  title="Escanear QR Code"
                  desc="Aponte a câmera para o QR Code da turma"
                  accent="#6366F1"
                  onPress={() => setShowQR(true)}
                />
                <OptionCard
                  emoji="🔑"
                  title="Código da turma"
                  desc="Digite o código que o professor te enviou"
                  accent="#10B981"
                  onPress={() => goStep('code')}
                />
                <OptionCard
                  emoji="✉️"
                  title="Código pessoal"
                  desc="E-mail do professor + seu código individual"
                  accent="#F59E0B"
                  onPress={() => goStep('personal')}
                />
              </View>
            )}

            {/* ── CODE MODE ── */}
            {step === 'code' && (
              <View style={s.form}>
                <Field
                  label="Seu nome completo"
                  placeholder="Como aparecerá para o professor"
                  value={name}
                  onChangeText={v => { setName(v); setError(''); }}
                  icon="person-outline"
                  autoCapitalize="words"
                  colors={colors}
                />
                <Field
                  label="Data de nascimento"
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChangeText={v => { setBirthDate(formatBirthDate(v)); setError(''); }}
                  icon="calendar-outline"
                  keyboardType="number-pad"
                  colors={colors}
                />
                <Field
                  label="Código da turma"
                  placeholder="Ex: ABC123"
                  value={turmaCode}
                  onChangeText={v => { setTurmaCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
                  icon="keypad-outline"
                  autoCapitalize="characters"
                  maxLength={8}
                  colors={colors}
                />

                {error ? <ErrorBox msg={error} colors={colors} /> : null}

                <ActionBtn title="Entrar na turma" loading={loading} onPress={handleCodeJoin} accent="#6366F1" />

                <Pressable onPress={() => setShowQR(true)} style={s.qrBtn}>
                  <Ionicons name="qr-code-outline" size={16} color="#6366F1" />
                  <Text style={[s.qrBtnText, { color: '#6366F1' }]}>Escanear QR Code</Text>
                </Pressable>
              </View>
            )}

            {/* ── PERSONAL MODE ── */}
            {step === 'personal' && (
              <View style={s.form}>
                <Field
                  label="E-mail do professor"
                  placeholder="professor@escola.com"
                  value={teacherEmail}
                  onChangeText={v => { setTeacherEmail(v); setError(''); }}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  colors={colors}
                />
                <Field
                  label="Seu código de acesso"
                  placeholder="ABC123"
                  value={accessCode}
                  onChangeText={v => { setAccessCode(v.toUpperCase()); setError(''); }}
                  icon="key-outline"
                  autoCapitalize="characters"
                  maxLength={6}
                  colors={colors}
                />

                {error ? <ErrorBox msg={error} colors={colors} /> : null}

                <ActionBtn title="Entrar" loading={loading} onPress={handlePersonalJoin} accent="#F59E0B" />
              </View>
            )}
          </Animated.View>

          <Text style={[s.footer, { color: colors.mutedText }]}>
            Enem IA · Área exclusiva para alunos
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({ emoji, title, desc, accent, onPress }: { emoji: string; title: string; desc: string; accent: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, stiffness: 300, damping: 18, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, stiffness: 300, damping: 18, useNativeDriver: true }).start()}
        style={[s.optCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[s.optEmoji, { backgroundColor: accent + '18' }]}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.optTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[s.optDesc, { color: colors.mutedText }]}>{desc}</Text>
        </View>
        <View style={[s.optArrow, { backgroundColor: accent + '18' }]}>
          <Ionicons name="chevron-forward" size={16} color={accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Field({ label, icon, colors, ...props }: { label: string; icon: string; colors: any; [k: string]: any }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, { color: colors.softText }]}>{label}</Text>
      <View style={[s.fieldRow, { backgroundColor: colors.input, borderColor: focused ? '#6366F1' : colors.border }]}>
        <Ionicons name={icon as any} size={17} color={focused ? '#6366F1' : colors.mutedText} />
        <TextInput
          {...props}
          style={[s.fieldInput, { color: colors.text }]}
          placeholderTextColor={colors.mutedText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

function ErrorBox({ msg, colors }: { msg: string; colors: any }) {
  return (
    <View style={[s.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
      <Text style={[s.errorText, { color: '#DC2626' }]}>{msg}</Text>
    </View>
  );
}

function ActionBtn({ title, loading, onPress, accent }: { title: string; loading: boolean; onPress: () => void; accent: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, stiffness: 300, damping: 18, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, stiffness: 300, damping: 18, useNativeDriver: true }).start()}
        style={[s.actionBtn, { backgroundColor: accent, opacity: loading ? 0.7 : 1 }]}
      >
        <Text style={s.actionBtnText}>{loading ? 'Aguarde...' : title}</Text>
        {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 16, paddingBottom: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontWeight: '600' },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 28, gap: 6 },
  logoGradient: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  logoEmoji: { fontSize: 38 },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5 },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 280 },
  options: { gap: 12, marginBottom: 24 },
  optCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1.5, padding: 16,
    shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  optEmoji: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 2 },
  optDesc: { fontSize: 12, lineHeight: 17 },
  optArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  form: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14,
  },
  fieldInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  qrBtnText: { fontSize: 14, fontWeight: '600' },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 32, fontWeight: '500' },
});
