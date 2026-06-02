import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import {
  forgotPasswordRequest,
  resetPasswordRequest,
} from '@/services/auth/backend-auth';
import { hashPassword } from '@/utils/crypto';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode() {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) {
      setError('Digite seu e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordRequest(trimEmail);
      setStep('code');
    } catch {
      // Always show same message — backend returns 200 regardless to prevent enumeration
      setStep('code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    const trimCode = code.trim();
    if (!trimCode || trimCode.length !== 6) {
      setError('Digite o código de 6 dígitos.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const trimEmail = email.trim().toLowerCase();
      const newHash = await hashPassword(newPassword, trimEmail);
      await resetPasswordRequest(trimEmail, trimCode, newHash);
      setStep('success');
    } catch (err: any) {
      setError(err?.message ?? 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.page}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: step === 'success' ? colors.success : colors.accent }]}>
            <Ionicons
              name={step === 'success' ? 'checkmark-circle' : 'key-outline'}
              size={26}
              color="#fff"
            />
          </View>
          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>RECUPERAÇÃO DE SENHA</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 'email' && 'Esqueci\nminha senha'}
            {step === 'code' && 'Digite\no código'}
            {step === 'success' && 'Senha\nredefinida!'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {step === 'email' && 'Informe seu e-mail e enviaremos um código de verificação.'}
            {step === 'code' && `Enviamos um código para ${email.trim().toLowerCase()}. Verifique sua caixa de entrada.`}
            {step === 'success' && 'Sua senha foi alterada com sucesso. Faça login com a nova senha.'}
          </Text>
        </View>

        {/* Passo 1: e-mail */}
        {step === 'email' && (
          <Card>
            <View style={styles.form}>
              {error ? <ErrorBox colors={colors} message={error} /> : null}

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
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
                accessibilityLabel="Campo de e-mail"
              />

              <Button
                title="Enviar código"
                variant="dark"
                leftIcon="send-outline"
                onPress={handleSendCode}
                loading={loading}
                fullWidth
              />
            </View>
          </Card>
        )}

        {/* Passo 2: código + nova senha */}
        {step === 'code' && (
          <Card>
            <View style={styles.form}>
              {error ? <ErrorBox colors={colors} message={error} /> : null}

              <Input
                label="Código de 6 dígitos"
                placeholder="000000"
                leftIcon="shield-checkmark-outline"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                returnKeyType="next"
                accessibilityLabel="Campo de código de verificação"
              />
              <Input
                label="Nova senha"
                placeholder="Mínimo 6 caracteres"
                leftIcon="lock-closed-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                textContentType="newPassword"
                returnKeyType="next"
                accessibilityLabel="Campo de nova senha"
              />
              <Input
                label="Confirmar nova senha"
                placeholder="Repita a senha"
                leftIcon="lock-closed-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                accessibilityLabel="Campo de confirmar nova senha"
              />

              <Button
                title="Redefinir senha"
                variant="dark"
                leftIcon="checkmark-circle-outline"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
              />

              <Pressable
                onPress={handleSendCode}
                style={styles.resendBtn}
                disabled={loading}
                accessibilityLabel="Reenviar código"
                accessibilityRole="button"
              >
                <Text style={[styles.resendText, { color: colors.accent }]}>
                  Reenviar código
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Passo 3: sucesso */}
        {step === 'success' && (
          <Card>
            <View style={styles.form}>
              <Button
                title="Ir para o login"
                variant="dark"
                leftIcon="log-in-outline"
                onPress={() => router.replace('/')}
                fullWidth
              />
            </View>
          </Card>
        )}

        {/* Link de volta ao login */}
        {step !== 'success' && (
          <View style={styles.loginRow}>
            <Text style={[styles.loginPrompt, { color: colors.mutedText }]}>
              Lembrou a senha?
            </Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityLabel="Voltar para login"
              accessibilityRole="button"
            >
              <Text style={[styles.loginLink, { color: colors.accent }]}>Entrar</Text>
            </Pressable>
          </View>
        )}

      </View>
    </ScreenContainer>
  );
}

function ErrorBox({ colors, message }: { colors: any; message: string }) {
  return (
    <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
      <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
      <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
    </View>
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
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },

  form: { gap: theme.spacing.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },

  resendBtn: { alignItems: 'center', paddingVertical: 4 },
  resendText: { fontSize: 13, fontWeight: '600' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  loginPrompt: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});
