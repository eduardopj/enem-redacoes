import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type StaggerItemProps = PropsWithChildren<{
  index?: number;
}>;

export function StaggerItem({ children, index = 0 }: StaggerItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        damping: 20,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}
