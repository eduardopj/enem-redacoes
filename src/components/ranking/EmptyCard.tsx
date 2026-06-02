import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  colors: AppColors;
  action?: { label: string; onPress: () => void };
};

export function EmptyCard({ icon, title, text, colors, action }: Props) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={40} color={colors.mutedText} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.mutedText }]}>{text}</Text>
      {action && (
        <Pressable onPress={action.onPress} style={[styles.emptyBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.emptyBtnText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: { borderRadius: 18, padding: 32, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
