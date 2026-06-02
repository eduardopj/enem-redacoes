import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ContextualActionData = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  action: ContextualActionData;
};

export function ContextualAction({ action }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={action.onPress}
      style={[styles.actionCard, { backgroundColor: colors.accent }]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.13)' }]}>
        <Ionicons name={action.icon} size={24} color="#fff" />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionSub}>{action.subtitle}</Text>
      </View>
      <View style={styles.actionBtn}>
        <Ionicons name="arrow-forward" size={18} color={colors.accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: { flex: 1, gap: 2 },
  actionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  actionSub: { color: 'rgba(255,255,255,0.70)', fontSize: 14, lineHeight: 21 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
