import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignupScreen() {
  const { colors } = useAppTheme();
  const signup = useAppStore((state) => state.signup);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  async function handleSignup() {
    const trimName = name.trim();
    const trimEmail = email.trim();

    if (!trimName || !trimEmail || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    const result = await signup(trimName, trimEmail, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Não foi possível criar a conta.');
    } else {
      router.replace('/dashboard');
    }
  }

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.page}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="person-add" size={26} color="#fff" />
          </View>
          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>ÁREA DO PROFESSOR</Text>
          <Text style={[styles.title, { color: colors.text }]}>Criar{'\n'}sua conta</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Cadastre-se para corrigir redações com IA.
          </Text>
        </View>

        {/* Formulário */}
        <Card>
          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Nome completo"
              placeholder="Seu nome"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              accessibilityLabel="Campo de nome completo"
            />
            <Input
              ref={emailRef}
              label="E-mail"
              placeholder="professor@escola.com"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Campo de e-mail"
            />
            <Input
              ref={passwordRef}
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              accessibilityLabel="Campo de senha"
            />
            <Input
              ref={confirmRef}
              label="Confirmar senha"
              placeholder="Repita a senha"
              leftIcon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              accessibilityLabel="Campo de confirmar senha"
            />

            <Button
              title="Criar conta"
              variant="dark"
              leftIcon="checkmark-circle-outline"
              onPress={handleSignup}
              loading={loading}
              fullWidth
            />
          </View>
        </Card>

        {/* Link para login */}
        <View style={styles.loginRow}>
          <Text style={[styles.loginPrompt, { color: colors.mutedText }]}>
            Já tem conta?
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Entrar na conta"
            accessibilityRole="button"
          >
            <Text style={[styles.loginLink, { color: colors.accent }]}>Entrar</Text>
          </Pressable>
        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing.lg, paddingTop: theme.spacing.sm },

  hero: { alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 38, textAlign: 'center', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 270 },

  form: { gap: theme.spacing.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  loginPrompt: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});
