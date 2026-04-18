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
    score >= 160 ? '#22C55E' :
    score >= 120 ? '#84CC16' :
    score >= 80 ? '#EAB308' :
    score >= 40 ? '#F97316' : '#EF4444';

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.kicker, { color: colors.mutedText }]}>Competência</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <View style={[styles.scoreWrap, { backgroundColor: scoreColor + '18' }]}>
          <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.scoreMax, { color: scoreColor + '80' }]}>/200</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: colors.input }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
      </View>

      <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
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
    gap: 3,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  scoreWrap: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  track: {
    height: 6,
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
