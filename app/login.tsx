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
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="briefcase-outline" size={30} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Professor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Entre no painel e continue suas correções.
          </Text>
        </View>

        <Card>
          <View style={styles.form}>
            <Input
              label="Nome"
              placeholder="Professor"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Input
              label="E-mail"
              placeholder="opcional"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Button
              title="Entrar no painel"
              leftIcon="arrow-forward-outline"
              onPress={enter}
              loading={loading}
            />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing.xl, paddingTop: theme.spacing.md },
  hero: { alignItems: 'center', gap: 8 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...theme.shadows.strong,
  },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  form: { gap: theme.spacing.md },
});
