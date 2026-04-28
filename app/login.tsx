import { Button, Card, Input, ScreenContainer } from '@/components/ui';
import { LoginFormData, loginSchema } from '@/features/auth/schemas';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const login = useAppStore((state) => state.login);

  const logoScale   = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formY       = useSharedValue(28);

  useEffect(() => {
    logoScale.value   = withSpring(1, { damping: 13, stiffness: 110 });
    logoOpacity.value = withTiming(1, { duration: 400 });
    formOpacity.value = withDelay(250, withTiming(1, { duration: 400 }));
    formY.value       = withDelay(250, withSpring(0, { damping: 18, stiffness: 160 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

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
    <ScreenContainer showHomeButton={false} showFooter={false}>
      <View style={styles.page}>

        {/* Logo / hero */}
        <Animated.View style={[styles.hero, logoStyle]}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="school" size={32} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.mutedText }]}>ENEM IA</Text>
          <Text style={[styles.title, { color: colors.text }]}>Bem-vindo de volta</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Acesse seu painel e continue corrigindo.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={formStyle}>
          <Card>
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
        </Animated.View>

        {/* Footer hint */}
        <Animated.View style={formStyle}>
          <Text style={[styles.hint, { color: colors.mutedText }]}>
            Correção de redações ENEM com inteligência artificial
          </Text>
        </Animated.View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: { gap: theme.spacing.md },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
