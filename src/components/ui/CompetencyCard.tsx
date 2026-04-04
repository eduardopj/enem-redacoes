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

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.kicker, { color: colors.mutedText }]}>COMPETÊNCIA</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <View style={[styles.scoreWrap, { borderColor: colors.border, backgroundColor: colors.input }]}>
          <Text style={[styles.score, { color: colors.accent }]}>{score}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    ...theme.typography.monoLabel,
  },
  title: {
    ...theme.typography.title,
  },
  scoreWrap: {
    minWidth: 68,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...theme.typography.monoButton,
  },
  description: {
    ...theme.typography.bodySmall,
    lineHeight: 22,
  },
});