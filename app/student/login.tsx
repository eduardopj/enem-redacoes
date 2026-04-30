import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import { lookupTurmaByCode } from '@/services/sync/sync-turmas';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Mode = 'turma' | 'pessoal';

export default function StudentLoginScreen() {
  const { colors } = useAppTheme();
  const joinTurmaByQR = useAppStore((state) => state.joinTurmaByQR);
  const loginAsStudent = useAppStore((state) => state.loginAsStudent);

  const [mode, setMode] = useState<Mode>('turma');
  const [name, setName] = useState('');
  const [turmaCode, setTurmaCode] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function enterWithTurmaCode() {
    const cleanName = name.trim();
    const code = turmaCode.trim().toUpperCase();
    if (!cleanName || code.length < 6) {
      setError('Informe seu nome e o código da turma.');
      return;
    }

    setLoading(true);
    setError('');
    const turma = await lookupTurmaByCode(code);
    if (!turma) {
      setLoading(false);
      setError('Código não encontrado. Confira com seu professor.');
      return;
    }

    const result = joinTurmaByQR(
      {
        type: 'enem-ia-join-v1',
        teacherId: turma.teacherId,
        teacherName: turma.teacherName,
        teacherEmail: '',
        turmaId: turma.turmaId,
        turmaName: turma.turmaName,
        joinCode: code,
      },
      cleanName
    );
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.replace('/student/home' as any);
  }

  async function enterWithPersonalCode() {
    if (!teacherEmail.trim() || !accessCode.trim()) {
      setError('Informe o e-mail do professor e seu código.');
      return;
    }

    setLoading(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 180));
    const result = loginAsStudent(teacherEmail, accessCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.replace('/student/home' as any);
  }

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.success }]}>
            <Ionicons name="person-outline" size={30} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Aluno</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Entre com o código recebido do professor.
          </Text>
        </View>

        <View style={[styles.segment, { backgroundColor: colors.input }]}>
          <SegmentButton label="Turma" active={mode === 'turma'} onPress={() => { setMode('turma'); setError(''); }} />
          <SegmentButton label="Código pessoal" active={mode === 'pessoal'} onPress={() => { setMode('pessoal'); setError(''); }} />
        </View>

        <Card>
          <View style={styles.form}>
            {mode === 'turma' ? (
              <>
                <Input
                  label="Seu nome"
                  placeholder="Nome completo"
                  leftIcon="person-outline"
                  value={name}
                  onChangeText={(value) => { setName(value); setError(''); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Input
                  label="Código da turma"
                  placeholder="ABCD1234"
                  leftIcon="keypad-outline"
                  value={turmaCode}
                  onChangeText={(value) => { setTurmaCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                />
                <Button
                  title="Entrar na turma"
                  leftIcon="arrow-forward-outline"
                  onPress={enterWithTurmaCode}
                  loading={loading}
                />
              </>
            ) : (
              <>
                <Input
                  label="E-mail do professor"
                  placeholder="professor@escola.com"
                  leftIcon="mail-outline"
                  value={teacherEmail}
                  onChangeText={(value) => { setTeacherEmail(value); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Input
                  label="Seu código"
                  placeholder="ABC123"
                  leftIcon="key-outline"
                  value={accessCode}
                  onChangeText={(value) => { setAccessCode(value.toUpperCase()); setError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                />
                <Button
                  title="Entrar"
                  leftIcon="arrow-forward-outline"
                  onPress={enterWithPersonalCode}
                  loading={loading}
                />
              </>
            )}

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, { backgroundColor: active ? colors.surface : 'transparent' }]}
    >
      <Text style={[styles.segmentText, { color: active ? colors.text : colors.mutedText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing.lg, paddingTop: theme.spacing.md },
  hero: { alignItems: 'center', gap: 8 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...theme.shadows.card,
  },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  segment: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  segmentButton: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '800' },
  form: { gap: theme.spacing.md },
  errorBox: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
