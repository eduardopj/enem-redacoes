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
        <View style={[styles.iconWrap, { backgroundColor: colors.accent + '14' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Feedback pedagógico</Text>
      </View>

      <Text style={[styles.text, { color: colors.softText }]}>
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
});
