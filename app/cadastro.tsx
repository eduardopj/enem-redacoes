import { Button, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function CadastroScreen() {
  const { colors } = useAppTheme();
  const ensureTeacherSession = useAppStore((state) => state.ensureTeacherSession);

  function enter() {
    ensureTeacherSession();
    router.replace('/dashboard');
  }

  return (
    <ScreenContainer showBack showHomeButton={false} showFooter={false}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark-circle" size={30} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sem cadastro obrigatório</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            O painel funciona em modo local para você começar imediatamente.
          </Text>
        </View>

        <Card>
          <View style={styles.content}>
            <View style={[styles.infoBox, { backgroundColor: colors.input }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.softText }]}>
                Cadastre alunos, temas e redações dentro do painel. Não é necessário criar conta.
              </Text>
            </View>
            <Button title="Ir para o painel" leftIcon="arrow-forward-outline" onPress={enter} />
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
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 27, fontWeight: '800', lineHeight: 33, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  content: { gap: theme.spacing.md },
  infoBox: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
