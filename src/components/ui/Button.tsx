import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ReactNode, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'dark' | 'soft';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
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
  fullWidth,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.97,
      damping: 20,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 20,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  };

  const bgColor: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: colors.accentSoft,
    ghost: 'transparent',
    danger: colors.dangerSoft,
    outline: 'transparent',
    success: colors.success,
    dark: colors.darkBlock,
    soft: colors.surfaceSoft,
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.accent,
    ghost: colors.accent,
    danger: colors.danger,
    outline: colors.softText,
    success: '#FFFFFF',
    dark: colors.darkBlockFg,
    soft: colors.softText,
  };

  const iconColor: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.accent,
    ghost: colors.accent,
    danger: colors.danger,
    outline: colors.softText,
    success: '#FFFFFF',
    dark: colors.darkBlockFg,
    soft: colors.softText,
  };

  const hasBorder = variant === 'outline';
  const borderColor: Record<ButtonVariant, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    ghost: 'transparent',
    danger: 'transparent',
    outline: colors.border,
    success: 'transparent',
    dark: 'transparent',
    soft: 'transparent',
  };

  const sizeConfig = {
    sm: { minH: 42, px: theme.spacing.md, fontSize: 15, iconSize: 17 },
    md: { minH: 52, px: theme.spacing.lg, fontSize: 16, iconSize: 19 },
    lg: { minH: 58, px: theme.spacing.xl, fontSize: 17, iconSize: 20 },
  }[size];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          {
            backgroundColor: bgColor[variant],
            minHeight: sizeConfig.minH,
            paddingHorizontal: sizeConfig.px,
            borderColor: borderColor[variant],
            borderWidth: hasBorder ? 1 : 0,
          },
          isDisabled && styles.disabled,
        ]}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'primary' || variant === 'success' ? '#FFFFFF' : variant === 'dark' ? colors.darkBlockFg : colors.accent}
            />
          ) : (
            <>
              {leftIcon ? (
                <Ionicons name={leftIcon} size={sizeConfig.iconSize} color={iconColor[variant]} />
              ) : null}
              <Text
                style={[styles.label, { color: textColor[variant], fontSize: sizeConfig.fontSize }]}
                numberOfLines={2}
              >
                {title}
              </Text>
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
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.42,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  label: {
    flexShrink: 1,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
