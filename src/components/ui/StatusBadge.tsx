import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

type StatusType = 'pendente' | 'processando' | 'corrigida';

type StatusBadgeProps = {
  status: StatusType;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const config = {
    pendente: {
      label: 'Pendente',
      color: colors.warning,
      backgroundColor: colors.warningSoft,
      dot: '#F59E0B',
    },
    processando: {
      label: 'Processando',
      color: colors.info,
      backgroundColor: colors.infoSoft,
      dot: '#3B82F6',
    },
    corrigida: {
      label: 'Corrigida',
      color: colors.success,
      backgroundColor: colors.successSoft,
      dot: '#22C55E',
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
