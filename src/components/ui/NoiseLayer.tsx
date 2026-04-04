import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const NOISE_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

export function NoiseLayer() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image source={{ uri: NOISE_URI }} style={styles.image} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    zIndex: 999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});