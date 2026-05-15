import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  text: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export const InsightMini = React.memo(function InsightMini({ label, value, text, icon, color }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.insightMini, { backgroundColor: color + '10', borderColor: color + '25' }]}>
      <View style={[styles.insightMiniIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={[styles.insightMiniLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.insightMiniValue, { color }]}>{value}</Text>
      <Text style={[styles.insightMiniText, { color: colors.softText }]} numberOfLines={1}>{text}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  insightMini: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  insightMiniIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  insightMiniLabel: { fontSize: 12, fontWeight: '700' },
  insightMiniValue: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  insightMiniText: { fontSize: 13, lineHeight: 18 },
});
