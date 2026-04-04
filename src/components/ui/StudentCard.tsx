import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type StudentCardProps = {
  name: string;
  className: string;
  onPress?: () => void;
  onDelete?: () => void;
};

export function StudentCard({ name, className, onPress, onDelete }: StudentCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.mainArea}>
          <Ionicons name="person-outline" size={20} color={colors.accent} />
          <View style={styles.content}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.className, { color: colors.mutedText }]}>{className}</Text>
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
  name: {
    ...theme.typography.title,
  },
  className: {
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