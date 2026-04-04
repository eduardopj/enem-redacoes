import { PropsWithChildren, useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

type StaggerItemProps = PropsWithChildren<{
  index?: number;
}>;

export function StaggerItem({ children, index = 0 }: StaggerItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 320 }));
    translateY.value = withDelay(
      index * 50,
      withSpring(0, {
        damping: 16,
        stiffness: 140,
      })
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}