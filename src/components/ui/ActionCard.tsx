import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type ActionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function ActionCard({ title, description, icon, onPress }: ActionCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent + '14' }]}>
            <Ionicons name={icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>
          </View>
          <View style={[styles.arrowWrap, { backgroundColor: colors.input }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.softText} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
