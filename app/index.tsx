import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.brandArea}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Ionicons name="school" size={34} color="#fff" />
          </View>
          <Text style={[styles.brand, { color: colors.mutedText }]}>ENEM REDAÇÕES</Text>
          <Text style={[styles.title, { color: colors.text }]}>Escolha seu acesso</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Correção, acompanhamento e devolutiva em uma experiência simples.
          </Text>
        </View>

        <View style={styles.actions}>
          <AccessCard
            title="Sou professor"
            description="Corrigir redações e acompanhar turmas"
            icon="briefcase-outline"
            color={colors.accent}
            onPress={() => router.push('/login')}
          />
          <AccessCard
            title="Sou aluno"
            description="Ver notas, evolução e devolutivas"
            icon="person-outline"
            color={colors.success}
            onPress={() => router.push('/student/login' as any)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function AccessCard({
  title,
  description,
  icon,
  color,
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardDescription, { color: colors.mutedText }]}>{description}</Text>
      </View>
      <View style={[styles.arrow, { backgroundColor: colors.input }]}>
        <Ionicons name="arrow-forward" size={18} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 30,
    justifyContent: 'space-between',
    gap: 28,
  },
  brandArea: { alignItems: 'center', gap: 10, paddingTop: 28 },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3157D5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310 },
  actions: { gap: 12 },
  card: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1F2A37',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 18, fontWeight: '800', lineHeight: 23 },
  cardDescription: { fontSize: 13, lineHeight: 18 },
  arrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
