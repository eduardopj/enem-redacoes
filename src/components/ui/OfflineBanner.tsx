import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { visible: boolean };

export function OfflineBanner({ visible }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -60,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, backgroundColor: colors.danger },
        { transform: [{ translateY }] },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>Sem conexão — correções serão reprocessadas ao reconectar</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
