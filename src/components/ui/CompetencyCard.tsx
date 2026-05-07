import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type CompetencyCardProps = {
  title: string;
  score: number;
  description: string;
};

export function CompetencyCard({ title, score, description }: CompetencyCardProps) {
  const { colors } = useAppTheme();

  const pct = (score / 200) * 100;
  const scoreColor =
    score >= 160 ? colors.success :
    score >= 100 ? colors.warning :
    colors.danger;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.kicker, { color: colors.mutedText }]}>Competência</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <View style={[styles.scoreWrap, { backgroundColor: scoreColor + '14' }]}>
          <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.scoreMax, { color: scoreColor + '80' }]}>/200</Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: colors.input }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
      </View>

      <Text style={[styles.description, { color: colors.softText }]}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: 0,
  },
  scoreWrap: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  scoreMax: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
});
