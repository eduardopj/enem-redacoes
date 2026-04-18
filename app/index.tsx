import { Button, Card, ScreenContainer, StaggerItem } from '@/components/ui';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const FEATURES = [
  {
    icon: 'camera-outline' as const,
    bg: '#EEF2FF',
    color: '#4E76F8',
    title: 'Foto → Correção completa',
    desc: 'A IA transcreve e corrige o manuscrito em segundos.',
  },
  {
    icon: 'analytics-outline' as const,
    bg: '#F0FDF4',
    color: '#22C55E',
    title: '5 competências ENEM',
    desc: 'Feedback detalhado por competência com pontuação.',
  },
  {
    icon: 'people-outline' as const,
    bg: '#F5F3FF',
    color: '#8B5CF6',
    title: 'Turma organizada',
    desc: 'Alunos, temas e histórico de redações em um só lugar.',
  },
];

export default function IndexScreen() {
  const { colors } = useAppTheme();

  return (
    <ScreenContainer noScroll showHomeButton={false}>
      <View style={styles.container}>

        <StaggerItem index={0}>
          <View style={styles.hero}>
            <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
              <Ionicons name="school" size={32} color="#fff" />
            </View>
            <Text style={[styles.brand, { color: colors.mutedText }]}>ENEM IA</Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              Corrija redações{'\n'}com inteligência
            </Text>
            <Text style={[styles.sub, { color: colors.mutedText }]}>
              Para professores que valorizam o tempo e a qualidade do feedback pedagógico.
            </Text>
          </View>
        </StaggerItem>

        <StaggerItem index={1}>
          <Card style={styles.featureCard}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureItem,
                  i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedText }]}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </Card>
        </StaggerItem>

        <StaggerItem index={2}>
          <View style={styles.actions}>
            <Button
              title="Entrar"
              leftIcon="arrow-forward-outline"
              onPress={() => router.replace('/login')}
            />
            <Button
              title="Criar conta"
              variant="secondary"
              leftIcon="person-add-outline"
              onPress={() => router.push('/cadastro')}
            />
          </View>
        </StaggerItem>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  headline: {
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  featureCard: {
    padding: 0,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
