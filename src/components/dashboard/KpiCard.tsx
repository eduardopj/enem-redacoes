import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  alert?: boolean;
};

export const KpiCard = React.memo(function KpiCard({
  label, value, icon, iconBg, iconColor, onPress, alert = false,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.kpiCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
    >
      <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
        {alert ? (
          <View style={[styles.kpiAlert, { backgroundColor: colors.warning }]} />
        ) : null}
      </View>
      <Text style={[styles.kpiValue, { color: alert ? colors.warning : colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>{label}</Text>
      <View style={styles.kpiChevron}>
        <Ionicons name="chevron-forward" size={12} color={colors.border} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 18,
    padding: 14,
    gap: 3,
    position: 'relative',
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  kpiAlert: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  kpiValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, lineHeight: 30 },
  kpiLabel: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  kpiChevron: { position: 'absolute', top: 12, right: 12 },
});
