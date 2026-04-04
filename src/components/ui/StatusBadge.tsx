import { theme } from '@/theme';
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
      label: 'PENDENTE',
      color: colors.warning,
      backgroundColor: colors.warningSoft,
    },
    processando: {
      label: 'PROCESSANDO',
      color: colors.info,
      backgroundColor: colors.infoSoft,
    },
    corrigida: {
      label: 'CORRIGIDA',
      color: colors.success,
      backgroundColor: colors.successSoft,
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
  text: {
    ...theme.typography.monoStatus,
  },
});