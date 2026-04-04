import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type ThemeCardProps = {
  title: string;
  category: string;
  onPress?: () => void;
  onDelete?: () => void;
};

export function ThemeCard({ title, category, onPress, onDelete }: ThemeCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.mainArea}>
          <Ionicons name="book-outline" size={20} color={colors.accent} />
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.category, { color: colors.mutedText }]}>{category}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.deleteButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.sm,
  },
  mainArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  title: {
    ...theme.typography.title,
  },
  category: {
    ...theme.typography.monoLabel,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
});