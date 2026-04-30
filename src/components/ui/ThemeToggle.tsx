import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

export function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const rotate = useRef(new Animated.Value(isDark ? 180 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: isDark ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDark, rotate]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, damping: 10, stiffness: 260, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 260, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  }, [scale, toggleTheme]);

  const rotation = rotate.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.btn, { backgroundColor: colors.surface }]}
      hitSlop={10}
    >
      <Animated.View style={{ transform: [{ rotate: rotation }, { scale }] }}>
        <Ionicons
          name={isDark ? 'moon-outline' : 'sunny-outline'}
          size={18}
          color={colors.softText}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
