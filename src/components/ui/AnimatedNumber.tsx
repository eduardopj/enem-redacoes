import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextStyle } from 'react-native';

type Props = {
  value: number;
  style?: TextStyle | TextStyle[];
};

export function AnimatedNumber({ value, style }: Props) {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animVal.setValue(0);
    setDisplay(0);
    const id = animVal.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(animVal, {
      toValue: value,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplay(value);
      animVal.removeListener(id);
    });
    return () => {
      animVal.stopAnimation();
      animVal.removeListener(id);
    };
  }, [value]);

  return <Text style={style}>{display}</Text>;
}
