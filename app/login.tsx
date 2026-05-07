import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const setTeacherProfile = useAppStore((state) => state.setTeacherProfile);
  const [name, setName] = useState(currentTeacher?.name === 'Professor' ? '' : currentTeacher?.name ?? '');
  const [email, setEmail] = useState(currentTeacher?.email?.includes('.local') ? '' : currentTeacher?.email ?? '');
  const [loading, setLoading] = useState(false);

  async function enter() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
    setTeacherProfile(name || 'Professor', email || undefined);
    setLoading(false);
    router.replace('/dashboard');
  }

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.page}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.text }]}>
            <Ionicons name="briefcase-outline" size={26} color="#fff" />
          </View>

          <View style={styles.heroText}>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>ÁREA DO PROFESSOR</Text>
            <Text style={[styles.title, { color: colors.text }]}>Bem-vindo{'\n'}de volta</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Acesse o painel e continue suas correções com IA.
            </Text>
          </View>
        </View>

        {/* Formulário */}
        <Card>
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Identificação</Text>
              <Text style={[styles.formSub, { color: colors.mutedText }]}>
                Seus dados ficam apenas neste dispositivo.
              </Text>
            </View>

            <Input
              label="Seu nome"
              placeholder="Ex: Prof. Ana"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Input
              label="E-mail (opcional)"
              placeholder="para futura sincronização"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <View style={styles.btnWrap}>
              <Button
                title="Entrar no painel"
                variant="dark"
                leftIcon="arrow-forward-outline"
                onPress={enter}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </Card>

        {/* Nota de privacidade */}
        <View style={[styles.privacyRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.mutedText} />
          <Text style={[styles.privacyText, { color: colors.mutedText }]}>
            Sem criação de conta. Dados salvos localmente no dispositivo.
          </Text>
        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing.xl, paddingTop: theme.spacing.sm },

  // Hero
  hero: { alignItems: 'center', gap: 14 },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  heroText: { alignItems: 'center', gap: 6 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '800', lineHeight: 38, textAlign: 'center', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 270 },

  // Form
  form: { gap: theme.spacing.md },
  formHeader: { gap: 4, marginBottom: 4 },
  formTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  formSub: { fontSize: 12, lineHeight: 18 },
  btnWrap: { marginTop: 4 },

  // Privacy
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
