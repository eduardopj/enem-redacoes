import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  eyebrow: {
    ...theme.typography.monoLabel,
  },
  title: {
    ...theme.typography.h1,
  },
  subtitle: {
    ...theme.typography.body,
    lineHeight: 24,
  },
});
