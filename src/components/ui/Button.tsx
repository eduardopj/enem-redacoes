import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
  size?: 'sm' | 'md';
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  leftIcon,
  rightSlot,
  size = 'md',
}: ButtonProps) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
  };

  const bgColor = {
    primary: colors.accent,
    secondary: colors.input,
    ghost: 'transparent',
    danger: colors.dangerSoft,
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: colors.text,
    ghost: colors.accent,
    danger: colors.danger,
  }[variant];

  const iconColor = {
    primary: '#FFFFFF',
    secondary: colors.softText,
    ghost: colors.accent,
    danger: colors.danger,
  }[variant];

  const minH = size === 'sm' ? 40 : 52;
  const px = size === 'sm' ? theme.spacing.md : theme.spacing.lg;
  const fontSize = size === 'sm' ? 13 : 15;

  return (
    <Animated.View style={[animatedScale, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          { backgroundColor: bgColor, minHeight: minH, paddingHorizontal: px },
          isDisabled && styles.disabled,
        ]}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'primary' ? '#FFFFFF' : colors.accent}
            />
          ) : (
            <>
              {leftIcon ? (
                <Ionicons name={leftIcon} size={size === 'sm' ? 16 : 18} color={iconColor} />
              ) : null}
              <Text style={[styles.label, { color: textColor, fontSize }]}>{title}</Text>
              {rightSlot}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    ...theme.shadows.hard,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
