import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type FeedbackCardProps = {
  feedback?: string;
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
        <Text style={[styles.title, { color: colors.softText }]}>FEEDBACK PEDAGÓGICO</Text>
      </View>

      <Text style={[styles.text, { color: colors.mutedText }]}>
        {feedback ?? 'Ainda não há feedback disponível para esta redação.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.monoLabel,
  },
  text: {
    ...theme.typography.body,
    lineHeight: 25,
  },
});