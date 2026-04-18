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
          <View style={[styles.iconWrap, { backgroundColor: colors.info + '14' }]}>
            <Ionicons name="book-outline" size={20} color={colors.info} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.category, { color: colors.mutedText }]}>{category}</Text>
          </View>
          <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.softText} />
          </View>
        </Pressable>

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.dangerSoft }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        ) : null}
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  category: {
    fontSize: 13,
    lineHeight: 17,
  },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
