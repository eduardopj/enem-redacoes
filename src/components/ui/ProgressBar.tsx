import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

type ProgressBarProps = {
  value: number;       // 0–100
  color?: string;
  height?: number;
  delay?: number;
};

export function ProgressBar({ value, color, height = 10, delay = 0 }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (containerWidth === 0) return;
    const target = (Math.min(Math.max(value, 0), 100) / 100) * containerWidth;
    Animated.timing(animWidth, {
      toValue: target,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, containerWidth, delay]);

  const fillColor = color ?? colors.accent;

  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: colors.input,
      }}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          width: animWidth,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: 999,
        }}
      />
    </View>
  );
}
