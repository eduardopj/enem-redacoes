import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotate.value = withTiming(isDark ? 180 : 0, { duration: 400 });
  }, [isDark, rotate]);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.82, { damping: 10, stiffness: 260 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 260 });
    });
    toggleTheme();
  }, [scale, toggleTheme]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} style={styles.btn} hitSlop={10}>
      <Animated.View style={animStyle}>
        <Ionicons
          name={isDark ? 'moon-outline' : 'sunny-outline'}
          size={20}
          color={colors.softText}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 6,
  },
});
