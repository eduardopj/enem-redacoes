import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({
  title,
  description,
  buttonLabel,
  onPress,
  icon = 'file-tray-outline',
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={28} color={colors.accent} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>

      {buttonLabel && onPress ? (
        <View style={styles.action}>
          <Button title={buttonLabel} onPress={onPress} leftIcon="add-outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  action: {
    width: '100%',
    marginTop: theme.spacing.sm,
  },
});