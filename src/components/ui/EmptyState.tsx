import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  secondaryLabel?: string;
  onPress?: () => void;
  onSecondaryPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tip?: string;
  accentColor?: string;
};

export function EmptyState({
  title,
  description,
  buttonLabel,
  secondaryLabel,
  onPress,
  onSecondaryPress,
  icon = 'file-tray-outline',
  tip,
  accentColor,
}: EmptyStateProps) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? colors.accent;

  return (
    <View style={[styles.box, { backgroundColor: colors.surface }]}>
      {/* Icon with layered glow */}
      <View style={styles.iconArea}>
        <View style={[styles.iconOuter, { backgroundColor: accent + '0C' }]}>
          <View style={[styles.iconInner, { backgroundColor: accent + '18' }]}>
            <Ionicons name={icon} size={36} color={accent} />
          </View>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{description}</Text>

      {tip ? (
        <View style={[styles.tipRow, { backgroundColor: accent + '0E', borderColor: accent + '20' }]}>
          <Ionicons name="bulb-outline" size={13} color={accent} />
          <Text style={[styles.tipText, { color: accent }]}>{tip}</Text>
        </View>
      ) : null}

      {buttonLabel && onPress ? (
        <View style={styles.actions}>
          <Button title={buttonLabel} onPress={onPress} leftIcon="add-outline" />
          {secondaryLabel && onSecondaryPress ? (
            <Button
              title={secondaryLabel}
              onPress={onSecondaryPress}
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  iconArea: {
    marginBottom: theme.spacing.xs,
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 26,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 4,
    alignSelf: 'stretch',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});
