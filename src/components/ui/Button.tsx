import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ReactNode, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
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
}: ButtonProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);
  const beamX = useSharedValue(-180);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (variant === 'primary') {
      beamX.value = withRepeat(
        withTiming(180, {
          duration: 2600,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [beamX, variant]);

  const isDisabled = disabled || loading;

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedTopBeam = useAnimatedStyle(() => ({
    transform: [{ translateX: beamX.value }, { rotate: '18deg' }],
  }));

  const animatedBottomBeam = useAnimatedStyle(() => ({
    transform: [{ translateX: -beamX.value }, { rotate: '-18deg' }],
  }));

  const animatedFill = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.985, { damping: 18, stiffness: 220 });

    if (variant === 'secondary') {
      fillWidth.value = withTiming(100, { duration: 220 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });

    if (variant === 'secondary') {
      fillWidth.value = withTiming(0, { duration: 220 });
    }
  };

  return (
    <Animated.View style={[animatedScale, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          variant === 'primary' && { backgroundColor: isDark ? colors.text : colors.black, borderColor: isDark ? colors.text : colors.black },
          variant === 'secondary' && { backgroundColor: colors.surface, borderColor: colors.border },
          variant === 'ghost' && { backgroundColor: 'transparent', borderColor: colors.border },
          isDisabled && styles.disabled,
        ]}
      >
        {variant === 'primary' ? (
          <>
            <View style={styles.primaryBorderLayer}>
              <View style={styles.topBorderTrack}>
                <Animated.View style={[styles.borderBeam, { backgroundColor: colors.accent }, animatedTopBeam]} />
              </View>

              <View style={styles.bottomBorderTrack}>
                <Animated.View style={[styles.borderBeam, { backgroundColor: colors.accent }, animatedBottomBeam]} />
              </View>
            </View>

            <View style={[styles.primaryInner, { backgroundColor: isDark ? colors.text : colors.black }]} />
          </>
        ) : null}

        {variant === 'secondary' ? (
          <>
            <View style={[styles.secondaryBg, { backgroundColor: colors.surface }]} />
            <Animated.View style={[styles.secondaryFill, { backgroundColor: colors.black }, animatedFill]} />
          </>
        ) : null}

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'primary' ? colors.background : colors.text}
            />
          ) : (
            <>
              {leftIcon ? (
                <Ionicons
                  name={leftIcon}
                  size={18}
                  color={
                    variant === 'primary'
                      ? colors.background
                      : variant === 'secondary'
                      ? colors.text
                      : colors.accent
                  }
                  style={styles.icon}
                />
              ) : null}

              <Text
                style={[
                  styles.label,
                  variant === 'primary' && { color: colors.background },
                  variant === 'secondary' && { color: colors.text },
                  variant === 'ghost' && { color: colors.accent },
                ]}
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
    minHeight: 56,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
  },

  disabled: {
    opacity: 0.5,
  },

  primaryBorderLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  topBorderTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
  },

  bottomBorderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    overflow: 'hidden',
  },

  borderBeam: {
    width: 64,
    height: 10,
    opacity: 0.95,
  },

  primaryInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 2,
    zIndex: 2,
  },

  secondaryBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  secondaryFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 2,
  },

  content: {
    zIndex: 3,
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },

  icon: {
    transform: [{ translateY: 1 }],
  },

  label: {
    ...theme.typography.monoButton,
  },
});