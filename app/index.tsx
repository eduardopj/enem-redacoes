import { Button, ScreenContainer, StaggerItem } from '@/components/ui';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const FEATURES = [
  {
    icon: 'camera-outline' as const,
    color: '#2268B5',
    title: 'Foto → Correção completa',
    desc: 'Envie a foto do manuscrito. A IA transcreve e corrige.',
  },
  {
    icon: 'analytics-outline' as const,
    color: '#1F8A57',
    title: '5 competências ENEM',
    desc: 'Feedback detalhado por competência com pontuação.',
  },
  {
    icon: 'people-outline' as const,
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
            <View style={styles.brandRow}>
              <Ionicons name="school-outline" size={18} color={colors.accent} />
              <Text style={[styles.brand, { color: colors.accent }]}>ENEM IA</Text>
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>
              Corrija redações{'\n'}com inteligência
            </Text>
            <Text style={[styles.sub, { color: colors.mutedText }]}>
              Para professores que valorizam o tempo e a qualidade do feedback pedagógico.
            </Text>
          </View>
        </StaggerItem>

        <StaggerItem index={1}>
          <View style={[styles.featureList, { borderColor: colors.border }]}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureItem,
                  { backgroundColor: colors.surface },
                  i < FEATURES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedText }]}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
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
    gap: theme.spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  brand: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    ...theme.typography.hero,
  },
  sub: {
    ...theme.typography.body,
    lineHeight: 24,
    marginTop: theme.spacing.xs,
  },
  featureList: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...theme.typography.bodySmall,
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
