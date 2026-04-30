import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { getThemeAverage, isCorrectedEssay } from '@/utils/analytics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TemaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const themes = useAppStore((state) => state.themes);
  const essays = useAppStore((state) => state.essays);
  const students = useAppStore((state) => state.students);

  const themeItem = useMemo(() => themes.find((item) => item.id === id), [themes, id]);
  const linkedEssays = useMemo(
    () => themeItem ? essays.filter((essay) => essay.themeTitle === themeItem.title) : [],
    [essays, themeItem]
  );
  const linkedStudentCount = useMemo(
    () => new Set(linkedEssays.map((essay) => essay.studentId)).size,
    [linkedEssays]
  );
  const themeAverage = useMemo(
    () => themeItem ? getThemeAverage(themeItem.title, essays) : null,
    [essays, themeItem]
  );
  const correctedCount = linkedEssays.filter(isCorrectedEssay).length;

  if (!themeItem) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <AppHeader title="Tema" subtitle="Tema não encontrado." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Tema não encontrado.</Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Tema"
          title="Detalhe do tema"
          subtitle="Use este tema nas novas correções."
        />

        <Card>
          <View style={styles.infoGroup}>
            <InfoRow label="Tema" value={themeItem.title} colors={colors} />
            <InfoRow label="Eixo" value={themeItem.category} colors={colors} />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Uso do tema</Text>
          <View style={styles.kpiRow}>
            <Metric label="Redações" value={linkedEssays.length} colors={colors} />
            <Metric label="Corrigidas" value={correctedCount} colors={colors} />
            <Metric label="Alunos" value={linkedStudentCount} colors={colors} />
            <Metric label="Média" value={themeAverage ?? '--'} colors={colors} />
          </View>

          {linkedEssays.length === 0 ? (
            <Text style={[styles.hint, { color: colors.mutedText }]}>
              Ainda não há redações vinculadas a este tema.
            </Text>
          ) : (
            <View style={styles.recentList}>
              {linkedEssays.slice(0, 3).map((essay) => {
                const student = students.find((item) => item.id === essay.studentId);
                return (
                  <View key={essay.id} style={[styles.essayRow, { borderTopColor: colors.border }]}>
                    <View style={styles.essayInfo}>
                      <Text style={[styles.essayStudent, { color: colors.text }]}>{student?.name ?? 'Aluno'}</Text>
                      <Text style={[styles.essayMeta, { color: colors.mutedText }]}>
                        {isCorrectedEssay(essay) ? 'Corrigida' : 'Pendente'}
                      </Text>
                    </View>
                    <Text style={[styles.essayScore, { color: colors.accent }]}>
                      {typeof essay.totalScore === 'number' ? essay.totalScore : '--'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Button
          title="Usar este tema"
          leftIcon="arrow-forward-outline"
          onPress={() => router.push(`/nova-redacao?themeId=${themeItem.id}`)}
        />
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Metric({ label, value, colors }: { label: string; value: number | string; colors: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.input }]}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoGroup: { gap: theme.spacing.md },
  row: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  value: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  emptyText: { fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.md },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  metric: { flex: 1, minWidth: '45%', borderRadius: theme.radius.md, padding: theme.spacing.md, gap: 2 },
  metricValue: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 19, marginTop: theme.spacing.md },
  recentList: { marginTop: theme.spacing.md },
  essayRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, borderTopWidth: 1, paddingVertical: theme.spacing.sm },
  essayInfo: { flex: 1, gap: 2 },
  essayStudent: { fontSize: 14, fontWeight: '700' },
  essayMeta: { fontSize: 12 },
  essayScore: { fontSize: 18, fontWeight: '800' },
});
