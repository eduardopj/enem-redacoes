import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const login = useAppStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const trimEmail = email.trim();
    if (!trimEmail || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(trimEmail, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Não foi possível entrar.');
    } else {
      router.replace('/dashboard');
    }
  }

  return (
    <ScreenContainer showBack={false} showHomeButton={false} showFooter={false}>
      <View style={styles.page}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="school" size={28} color="#fff" />
          </View>
          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>ÁREA DO PROFESSOR</Text>
          <Text style={[styles.title, { color: colors.text }]}>Bem-vindo{'\n'}de volta</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Acesse o painel e continue suas correções com IA.
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
              label="E-mail"
              placeholder="professor@escola.com"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Campo de e-mail"
            />
            <Input
              label="Senha"
              placeholder="Sua senha"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((v) => !v)}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              accessibilityLabel="Campo de senha"
            />

            <Button
              title="Entrar"
              variant="dark"
              leftIcon="arrow-forward-outline"
              onPress={handleLogin}
              loading={loading}
              fullWidth
            />

            <Pressable
              onPress={() => router.push('/forgot-password' as any)}
              style={styles.forgotBtn}
              accessibilityLabel="Esqueci minha senha"
              accessibilityRole="button"
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>
                Esqueci minha senha
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Link para cadastro */}
        <View style={styles.signupRow}>
          <Text style={[styles.signupPrompt, { color: colors.mutedText }]}>
            Primeira vez?
          </Text>
          <Pressable
            onPress={() => router.push('/signup' as any)}
            hitSlop={8}
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
          >
            <Text style={[styles.signupLink, { color: colors.accent }]}>Criar conta</Text>
          </Pressable>
        </View>

        {/* Privacy note */}
        <Pressable
          onPress={() => router.push('/privacy-policy' as any)}
          style={[styles.privacyRow, { backgroundColor: colors.input, borderColor: colors.border }]}
          accessibilityLabel="Abrir política de privacidade"
          accessibilityRole="link"
        >
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.mutedText} />
          <Text style={[styles.privacyText, { color: colors.mutedText }]}>
            Seus dados são protegidos e nunca compartilhados.{' '}
            <Text style={{ color: colors.accent }}>Política de privacidade</Text>
          </Text>
        </Pressable>

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

  forgotBtn: { alignItems: 'center', paddingVertical: 4 },
  forgotText: { fontSize: 13, fontWeight: '600' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  signupPrompt: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '700' },

  privacyRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
