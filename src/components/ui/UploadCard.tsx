import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';

type UploadCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function UploadCard({
  title,
  description,
  buttonLabel,
  icon,
  onPress,
}: UploadCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.container}>
        <Ionicons name={icon} size={24} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
        <Button title={buttonLabel} variant="secondary" onPress={onPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
  },
  description: {
    ...theme.typography.bodySmall,
  },
});