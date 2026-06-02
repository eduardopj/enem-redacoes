import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Turma } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Period = Turma['period'];
const PERIODS: { value: Period; label: string; icon: string }[] = [
  { value: 'manhã', label: 'Manhã', icon: 'sunny-outline' },
  { value: 'tarde', label: 'Tarde', icon: 'partly-sunny-outline' },
  { value: 'noite', label: 'Noite', icon: 'moon-outline' },
  { value: 'integral', label: 'Integral', icon: 'time-outline' },
];

export default function NovaTurmaScreen() {
  const { colors } = useAppTheme();
  const addTurma = useAppStore((s) => s.addTurma);
  const generateTurmaJoinCode = useAppStore((s) => s.generateTurmaJoinCode);
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const turmas = useAppStore((s) => s.turmas);

  const [name, setName] = useState('');
  const [period, setPeriod] = useState<Period | undefined>(undefined);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [subject, setSubject] = useState('Língua Portuguesa');
  const [nameError, setNameError] = useState('');

  // After creation
  const [savedTurmaId, setSavedTurmaId] = useState<string | null>(null);

  const savedTurma = savedTurmaId ? turmas.find((t) => t.id === savedTurmaId) ?? null : null;

  function buildQRValue(): string {
    if (!currentTeacher || !savedTurma?.joinCode) return '';
    return JSON.stringify({
      type: 'enem-ia-join-v1',
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      teacherEmail: currentTeacher.email,
      turmaId: savedTurma.id,
      turmaName: savedTurma.name,
      joinCode: savedTurma.joinCode,
    });
  }

  function handleSave() {
    if (!name.trim()) {
      setNameError('Nome da turma é obrigatório.');
      return;
    }
    const turmaId = addTurma({ name: name.trim(), period, year: year.trim() || undefined, subject: subject.trim() || undefined });
    if (!turmaId) return;
    generateTurmaJoinCode(turmaId);
    setSavedTurmaId(turmaId);
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (savedTurma) {
    const qrValue = buildQRValue();
    return (
      <ProtectedRoute>
        <ScreenContainer>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.successScroll}>

            {/* Hero */}
            <View style={[styles.successHero, { backgroundColor: colors.accent }]}>
              <View style={styles.successCheck}>
                <Ionicons name="checkmark-circle" size={36} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Turma criada!</Text>
              <Text style={styles.successTurmaName}>{savedTurma.name}</Text>
              {savedTurma.period && (
                <Text style={styles.successSub}>
                  {savedTurma.period.charAt(0).toUpperCase() + savedTurma.period.slice(1)}
                  {savedTurma.year ? ` · ${savedTurma.year}` : ''}
                </Text>
              )}
            </View>

            {/* QR section */}
            <View style={[styles.qrSection, { backgroundColor: colors.surface }]}>
              <View style={styles.qrSectionHeader}>
                <Ionicons name="qr-code" size={18} color={colors.accent} />
                <Text style={[styles.qrSectionTitle, { color: colors.text }]}>
                  Compartilhe com os alunos
                </Text>
              </View>
              <Text style={[styles.qrSectionSub, { color: colors.mutedText }]}>
                Os alunos escaneiam este QR Code com o app para entrar direto na turma.
              </Text>

              {qrValue !== '' && (
                <View style={styles.qrBox}>
                  <QRCode value={qrValue} size={200} backgroundColor="#FFFFFF" color="#000000" />
                </View>
              )}

              {/* Code fallback */}
              {savedTurma.joinCode && (
                <View style={[styles.codeBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <View style={styles.codeBoxTop}>
                    <Ionicons name="key-outline" size={14} color={colors.mutedText} />
                    <Text style={[styles.codeBoxLabel, { color: colors.mutedText }]}>
                      Ou compartilhe o código:
                    </Text>
                  </View>
                  <Text style={[styles.codeBoxValue, { color: colors.text }]}>
                    {savedTurma.joinCode}
                  </Text>
                </View>
              )}

              {/* Steps */}
              <View style={[styles.steps, { borderTopColor: colors.border }]}>
                <Step n="1" text='Aluno abre o app e toca em "Entrar como aluno"' colors={colors} />
                <Step n="2" text='Escolhe "Escanear QR Code" ou "Entrar com código"' colors={colors} />
                <Step n="3" text="Digita o nome e entra na turma automaticamente" colors={colors} />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.successActions}>
              <Button
                title="Ver painel da turma"
                leftIcon="analytics-outline"
                onPress={() => router.replace(`/turma/${savedTurma.id}` as any)}
              />
              <Pressable
                onPress={() => router.replace('/turmas' as any)}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.softText }]}>Voltar para turmas</Text>
              </Pressable>
            </View>
          </ScrollView>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <ScreenContainer showBack topBarTitle="Nova Turma">
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="people" size={28} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Nova turma</Text>
          <Text style={[styles.sub, { color: colors.mutedText }]}>
            Organize seus alunos por turma para um acompanhamento mais preciso.
          </Text>
        </View>

        <View style={styles.form}>
          <Field label="Nome da turma *" error={nameError}>
            <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: nameError ? colors.danger : colors.border }]}>
              <Ionicons name="school-outline" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: 3º Ano A, 9º Ano B..."
                placeholderTextColor={colors.mutedText}
                value={name}
                onChangeText={(t) => { setName(t); setNameError(''); }}
                returnKeyType="next"
                autoFocus
              />
            </View>
          </Field>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.softText }]}>Período</Text>
            <View style={styles.periodGrid}>
              {PERIODS.map((p) => {
                const active = period === p.value;
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => setPeriod(active ? undefined : p.value)}
                    style={[
                      styles.periodBtn,
                      active
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : { backgroundColor: colors.input, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name={p.icon as any} size={18} color={active ? '#fff' : colors.mutedText} />
                    <Text style={[styles.periodLabel, { color: active ? '#fff' : colors.softText }]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field label="Ano letivo">
            <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="2026"
                placeholderTextColor={colors.mutedText}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </Field>

          <Field label="Disciplina">
            <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Língua Portuguesa"
                placeholderTextColor={colors.mutedText}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="done"
              />
            </View>
          </Field>

          <Button title="Criar turma" leftIcon="people-outline" onPress={handleSave} />
        </View>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.softText }]}>{label}</Text>
      {children}
      {error ? <Text style={[styles.fieldError, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

function Step({ n, text, colors }: { n: string; text: string; colors: any }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={[styles.stepText, { color: colors.softText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Form ──
  header: { alignItems: 'center', gap: 12, marginBottom: 28, paddingTop: 8 },
  headerIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: 0, textAlign: 'center' },
  sub: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  form: { gap: 20, paddingBottom: 40 },
  fieldWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 16 },
  fieldError: { fontSize: 12, lineHeight: 17 },
  periodGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  periodLabel: { fontSize: 13, fontWeight: '600' },

  // ── Success ──
  successScroll: { paddingBottom: 40 },
  successHero: {
    borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 8, marginBottom: 16,
  },
  successCheck: { marginBottom: 4 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0 },
  successTurmaName: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  successSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  qrSection: {
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#09090B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  qrSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrSectionTitle: { fontSize: 16, fontWeight: '700' },
  qrSectionSub: { fontSize: 13, lineHeight: 20, marginTop: -6 },
  qrBox: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  codeBox: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    alignItems: 'center', gap: 6,
  },
  codeBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeBoxLabel: { fontSize: 12, fontWeight: '600' },
  codeBoxValue: { fontSize: 28, fontWeight: '800', letterSpacing: 6 },

  steps: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20 },

  successActions: { gap: 10, marginTop: 8 },
  secondaryBtn: {
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 13, alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
});
