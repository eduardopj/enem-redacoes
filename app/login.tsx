import { Button, Card, Input, ScreenContainer, StaggerItem } from '@/components/ui';
import { LoginFormData, loginSchema } from '@/features/auth/schemas';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const login = useAppStore((state) => state.login);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = login(data.email, data.password);
    if (!result.success) {
      setError('password', { message: result.error });
      return;
    }
    router.replace('/dashboard');
  };

  return (
    <ScreenContainer showHomeButton={false}>
      <View style={styles.page}>
        <StaggerItem index={0}>
          <View style={styles.hero}>
            <Text style={[styles.kicker, { color: colors.accent }]}>ACESSO DO PROFESSOR</Text>
            <Text style={[styles.title, { color: colors.text }]}>Entrar</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Acesse seu painel e continue o fluxo de correção.
            </Text>
          </View>
        </StaggerItem>

        <StaggerItem index={1}>
          <Card>
            <View style={styles.topBadge}>
              <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
              <Text style={[styles.topBadgeText, { color: colors.softText }]}>
                AMBIENTE DO PROFESSOR
              </Text>
            </View>

            <View style={styles.form}>
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
                    placeholder="Digite sua senha"
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

              <Button
                title="Entrar"
                leftIcon="arrow-forward-outline"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={!isValid}
              />

              <Button
                title="Criar conta"
                variant="secondary"
                onPress={() => router.push('/cadastro')}
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
