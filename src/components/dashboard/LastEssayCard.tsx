import { Button, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  lastEssay: Essay;
  getStudentName: (studentId: string) => string;
};

export function LastEssayCard({ lastEssay, getStudentName }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#09090B' }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Último movimento</Text>
      <View style={styles.lastRow}>
        <View style={[styles.lastAvatar, { backgroundColor: colors.accent + '18' }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.lastInfo}>
          <Text style={[styles.lastStudent, { color: colors.text }]}>{getStudentName(lastEssay.studentId)}</Text>
          <Text style={[styles.lastTheme, { color: colors.mutedText }]} numberOfLines={1}>{lastEssay.themeTitle}</Text>
        </View>
        <StatusBadge status={lastEssay.status} />
      </View>
      <View style={styles.lastBtn}>
        <Button
          title={lastEssay.status === 'corrigida' ? 'Ver resultado' : 'Abrir redação'}
          variant="dark"
          leftIcon={lastEssay.status === 'corrigida' ? 'analytics-outline' : 'eye-outline'}
          onPress={() =>
            lastEssay.status === 'corrigida'
              ? router.push(`/resultado/${lastEssay.id}`)
              : router.push(`/redacao/${lastEssay.id}`)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 4,
  },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  lastAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  lastInfo: { flex: 1, gap: 3 },
  lastStudent: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  lastTheme: { fontSize: 15, lineHeight: 22 },
  lastBtn: {},
});
