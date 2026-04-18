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
  iconBg?: string;
  iconColor?: string;
};

export function KpiCard({
  label,
  value,
  helper,
  icon = 'stats-chart-outline',
  iconBg,
  iconColor,
}: KpiCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg ?? colors.accent + '14' }]}>
          <Ionicons name={icon} size={20} color={iconColor ?? colors.accent} />
        </View>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
        {helper ? <Text style={[styles.helper, { color: colors.mutedText }]}>{helper}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
