import { Button, Card, Input, ScreenContainer, StaggerItem } from '@/components/ui';
import { SignupFormData, signupSchema } from '@/features/auth/schemas';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

export default function CadastroScreen() {
  const { colors } = useAppTheme();
  const signup = useAppStore((state) => state.signup);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    const result = signup(data.name, data.email, data.password);
    if (!result.success) {
      setError('email', { message: result.error });
      return;
    }
    router.replace('/dashboard');
  };

  return (
    <ScreenContainer showBack showHomeButton={false}>
      <View style={styles.page}>
        <StaggerItem index={0}>
          <View style={styles.hero}>
            <Text style={[styles.kicker, { color: colors.accent }]}>NOVA CONTA</Text>
            <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Cadastre-se para acessar o painel e corrigir redações com IA.
            </Text>
          </View>
        </StaggerItem>

        <StaggerItem index={1}>
          <Card>
            <View style={styles.topBadge}>
              <Ionicons name="person-add-outline" size={18} color={colors.accent} />
              <Text style={[styles.topBadgeText, { color: colors.softText }]}>
                CADASTRO DO PROFESSOR
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nome completo"
                    placeholder="Seu nome"
                    autoCapitalize="words"
                    autoCorrect={false}
                    leftIcon="person-outline"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    errorText={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="E-mail"
                    placeholder="professor@escola.edu.br"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="mail-outline"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    errorText={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Senha"
                    placeholder="Crie uma senha"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="lock-closed-outline"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    errorText={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirmar senha"
                    placeholder="Repita a senha"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="shield-checkmark-outline"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    errorText={errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                title="Criar conta"
                leftIcon="checkmark-outline"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={!isValid}
              />

              <Button
                title="Já tenho conta"
                variant="secondary"
                onPress={() => router.push('/login')}
              />
            </View>
          </Card>
        </StaggerItem>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
  },
  hero: {
    gap: theme.spacing.xs,
  },
  kicker: { ...theme.typography.monoLabel },
  title: { ...theme.typography.hero },
  subtitle: { ...theme.typography.body, lineHeight: 24 },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  topBadgeText: { ...theme.typography.monoLabel },
  form: { gap: theme.spacing.lg },
});
