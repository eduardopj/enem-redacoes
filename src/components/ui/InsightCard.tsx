import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type InsightCardProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
};

export function InsightCard({ title, description, icon = 'sparkles-outline', tone = 'info', onPress }: InsightCardProps) {
  const { colors } = useAppTheme();
  const color = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: color + '10', borderColor: color + '28' }]}
    >
      <View style={[styles.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  description: { fontSize: 12, lineHeight: 17 },
});
