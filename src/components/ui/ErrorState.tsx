import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export function ErrorState({
  title = 'Algo não saiu como esperado',
  description = 'Tente novamente em instantes.',
  buttonLabel,
  onPress,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.dangerSoft }]}>
      <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
      {buttonLabel && onPress ? <Button title={buttonLabel} onPress={onPress} variant="danger" size="sm" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
