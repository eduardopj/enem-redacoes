import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type ActionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function ActionCard({ title, description, icon, onPress }: ActionCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.row}>
          <Ionicons name={icon} size={22} color={colors.accent} />
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
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
  description: {
    ...theme.typography.bodySmall,
  },
});