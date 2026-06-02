import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InsightMini } from './InsightMini';

type AttentionStudent = {
  student: { id: string; name: string };
  stats: any;
};

type ImprovingStudent = {
  student: { id: string; name: string };
  progress: any;
};

type Props = {
  attentionStudents: AttentionStudent[];
  lowConfidenceEssays: Essay[];
  improvingStudents: ImprovingStudent[];
};

export function PedagogicalPanel({ attentionStudents, lowConfidenceEssays, improvingStudents }: Props) {
  const { colors } = useAppTheme();

  const shouldShow =
    attentionStudents.length > 0 ||
    lowConfidenceEssays.length > 0 ||
    improvingStudents.length > 0;

  if (!shouldShow) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#09090B' }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Painel pedagógico</Text>
        <Pressable onPress={() => router.push('/analytics' as any)}>
          <Text style={[styles.linkText, { color: colors.accent }]}>Análise</Text>
        </Pressable>
      </View>
      <View style={styles.insightGrid}>
        <InsightMini
          label="Atenção"
          value={attentionStudents.length + lowConfidenceEssays.length}
          text={lowConfidenceEssays.length ? 'Revisar baixa confiança' : 'Alunos para acompanhar'}
          icon="alert-circle-outline"
          color={colors.warning}
        />
        <InsightMini
          label="Evolução"
          value={improvingStudents.length}
          text={improvingStudents[0]?.student.name ?? 'Sem tendência ainda'}
          icon="trending-up-outline"
          color={colors.success}
        />
      </View>
      {attentionStudents[0] ? (
        <Pressable
          onPress={() => router.push(`/aluno/${attentionStudents[0].student.id}` as any)}
          style={[styles.nextStudentRow, { backgroundColor: colors.input }]}
        >
          <View style={[styles.nextStudentIcon, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="school-outline" size={16} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextStudentTitle, { color: colors.text }]}>Aluno para observar</Text>
            <Text style={[styles.nextStudentText, { color: colors.mutedText }]}>{attentionStudents[0].student.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
        </Pressable>
      ) : null}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  nextStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  nextStudentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStudentTitle: { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  nextStudentText: { fontSize: 14, lineHeight: 20 },
});
