import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type KpiCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function KpiCard({
  label,
  value,
  helper,
  icon = 'stats-chart-outline',
}: KpiCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>

      <Text style={[styles.label, { color: colors.softText }]}>{label}</Text>
      {helper ? <Text style={[styles.helper, { color: colors.mutedText }]}>{helper}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  value: {
    ...theme.typography.metric,
  },
  label: {
    ...theme.typography.monoLabel,
    marginBottom: theme.spacing.xs,
  },
  helper: {
    ...theme.typography.bodySmall,
  },
});