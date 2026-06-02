import { SparkDatum, Sparkline } from '@/components/ui';
import { useAppTheme } from '@/theme/ThemeContext';
import type { ClassStats } from '@/utils/analytics';
import { getCompetencyLabel, getScoreColor, getScoreLabel } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClassKpi } from './ClassKpi';

const COMP_TEACHER_TIPS: Record<string, string> = {
  c1: 'Sugira leitura de jornais e revisão de gramática normativa. Peça que os alunos releiam os textos em voz alta para perceber desvios de concordância.',
  c2: 'Trabalhe a análise da proposta temática em sala. Peça que os alunos grifem palavras-chave do enunciado antes de escrever.',
  c3: 'Apresente o modelo P.A.R. (Ponto de vista / Argumento / Reforço). Exercite com redações de exemplo mostrando argumentos concretos.',
  c4: 'Monte com a turma um "dicionário de conectivos" variados. Proponha exercícios de substituição de conectivos repetidos.',
  c5: 'Use o mnemônico A.A.M.F. (Agente / Ação / Modo / Finalidade) para que os alunos estruturem propostas completas e específicas.',
};

type Props = {
  classStats: ClassStats;
  teacherSparkData: SparkDatum[];
  compColors: Record<string, string>;
};

export function ClassPerformance({ classStats, teacherSparkData, compColors }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#09090B' }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Desempenho da turma</Text>
        <Pressable onPress={() => router.push('/analytics' as any)}>
          <Text style={[styles.linkText, { color: colors.accent }]}>Ver análise</Text>
        </Pressable>
      </View>

      <View style={styles.classKpiRow}>
        <ClassKpi
          label="Média"
          value={classStats.classAverage ?? '--'}
          sub={classStats.classAverage ? getScoreLabel(classStats.classAverage) : ''}
          color={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.mutedText}
        />
        <View style={[styles.kpiSep, { backgroundColor: colors.border }]} />
        <ClassKpi
          label="Maior nota"
          value={classStats.classHighest ?? '--'}
          sub={classStats.classHighest ? getScoreLabel(classStats.classHighest) : ''}
          color={classStats.classHighest ? getScoreColor(classStats.classHighest, colors) : colors.mutedText}
        />
        <View style={[styles.kpiSep, { backgroundColor: colors.border }]} />
        <ClassKpi
          label="Menor nota"
          value={classStats.classLowest ?? '--'}
          sub={classStats.classLowest ? getScoreLabel(classStats.classLowest) : ''}
          color={classStats.classLowest ? getScoreColor(classStats.classLowest, colors) : colors.mutedText}
        />
      </View>

      {classStats.weakestClassCompetency ? (
        <View style={[styles.weakRow, { backgroundColor: colors.warningSoft, borderRadius: 12 }]}>
          <Ionicons name="warning-outline" size={15} color={colors.warning} />
          <Text style={[styles.weakText, { color: colors.warning }]}>
            Atenção:{' '}
            <Text style={{ fontWeight: '700' }}>
              {getCompetencyLabel(classStats.weakestClassCompetency)}
            </Text>
            {' '}— menor média da turma
          </Text>
        </View>
      ) : null}

      {teacherSparkData.length >= 3 ? (
        <>
          <View style={[styles.sparkDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sparkHeader}>
            <Ionicons name="analytics-outline" size={13} color={colors.mutedText} />
            <Text style={[styles.sparkLabel, { color: colors.mutedText }]}>Tendência das últimas correções</Text>
          </View>
          <Sparkline data={teacherSparkData} height={72} color={colors.accent} />
        </>
      ) : null}

      {classStats.weakestClassCompetency ? (() => {
        const wKey = classStats.weakestClassCompetency!;
        const wColor = compColors[wKey];
        return (
          <>
            <View style={[styles.sparkDivider, { backgroundColor: colors.border }]} />
            <View style={[styles.focusCard, { backgroundColor: wColor + '0C', borderColor: wColor + '28' }]}>
              <View style={styles.focusHeader}>
                <View style={[styles.focusIconWrap, { backgroundColor: wColor + '20' }]}>
                  <Ionicons name="flag-outline" size={13} color={wColor} />
                </View>
                <Text style={[styles.focusEyebrow, { color: wColor }]}>FOCO PEDAGÓGICO</Text>
              </View>
              <View style={styles.focusCompRow}>
                <View style={[styles.focusKeyBadge, { backgroundColor: wColor }]}>
                  <Text style={styles.focusKeyText}>{wKey.toUpperCase()}</Text>
                </View>
                <Text style={[styles.focusCompName, { color: colors.text }]}>
                  {getCompetencyLabel(wKey)}
                </Text>
              </View>
              <View style={[styles.focusTipBox, { backgroundColor: wColor + '10' }]}>
                <Ionicons name="bulb-outline" size={13} color={wColor} />
                <Text style={[styles.focusTipText, { color: colors.softText }]}>
                  {COMP_TEACHER_TIPS[wKey]}
                </Text>
              </View>
            </View>
          </>
        );
      })() : null}
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
  classKpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  kpiSep: {
    width: 1,
    marginVertical: 4,
  },
  weakRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
  },
  weakText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  sparkDivider: { height: 1, marginTop: 12, marginBottom: 10 },
  sparkHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  sparkLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  focusCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10, marginTop: 4 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  focusIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  focusEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  focusCompRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  focusKeyBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  focusKeyText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  focusCompName: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  focusTipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 10, padding: 10 },
  focusTipText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
