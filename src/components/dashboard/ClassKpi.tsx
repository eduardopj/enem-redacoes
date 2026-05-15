import { useAppTheme } from '@/theme/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number | string;
  sub: string;
  color: string;
};

export const ClassKpi = React.memo(function ClassKpi({ label, value, sub, color }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.classKpiBlock}>
      <Text style={[styles.classKpiLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.classKpiValue, { color }]}>{value}</Text>
      {sub ? <Text style={[styles.classKpiSub, { color: colors.mutedText }]}>{sub}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  classKpiBlock: { flex: 1, alignItems: 'center', gap: 3 },
  classKpiLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  classKpiValue: { fontSize: 24, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  classKpiSub: { fontSize: 12, lineHeight: 16 },
});
