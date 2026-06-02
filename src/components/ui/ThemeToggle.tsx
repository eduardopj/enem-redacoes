import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

/**
 * Botão de alternância de tema com:
 *   - ícone animado (rotação sol/lua)
 *   - label contextual "Claro" / "Escuro"
 *   - fundo em pílula com bordas e sombra sutis
 */
export function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const rotate = useRef(new Animated.Value(isDark ? 180 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: isDark ? 180 : 0,
      duration: 380,
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
      style={[
        styles.pill,
        {
          backgroundColor: colors.input,
          borderColor: colors.border,
        },
      ]}
      hitSlop={8}
      accessibilityLabel={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ rotate: rotation }, { scale }] }}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={14}
          color={isDark ? '#a78bfa' : '#f59e0b'}
        />
      </Animated.View>
      <Text style={[styles.label, { color: colors.softText }]}>
        {isDark ? 'Escuro' : 'Claro'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
