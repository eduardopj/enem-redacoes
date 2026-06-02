import type { AppColors } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  color: string;
  colors: AppColors;
};

export function SummaryChip({ label, value, color, colors }: Props) {
  return (
    <View style={styles.summaryChip}>
      <Text style={[styles.summaryChipLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.summaryChipValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryChip: { flex: 1, alignItems: 'center', gap: 3 },
  summaryChipLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  summaryChipValue: { fontSize: 22, fontWeight: '700', letterSpacing: 0 },
});
