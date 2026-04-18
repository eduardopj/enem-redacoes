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

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Card>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.mainArea}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.accent + '18' }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.content}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.className, { color: colors.mutedText }]}>{className}</Text>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  className: {
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
