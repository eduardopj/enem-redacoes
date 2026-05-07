import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/ThemeContext';

// ─── Band definitions ─────────────────────────────────────────────────────────

type Band = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  getAccent: (colors: any) => string;
  particleCount: number;
  trigger: () => void;
};

function getBand(score: number): Band {
  if (score >= 1000) return {
    icon: 'ribbon-outline',
    title: 'Nota máxima!',
    message: 'Isso é raríssimo e histórico. Você escreveu a redação perfeita do ENEM. Incrível!',
    getAccent: () => '#B45309',
    particleCount: 24,
    trigger: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  };
  if (score >= 900) return {
    icon: 'trophy-outline',
    title: 'Quase perfeito!',
    message: 'Você está entre os melhores do país. Uma redação verdadeiramente impressionante!',
    getAccent: (c) => c.success,
    particleCount: 18,
    trigger: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  };
  if (score >= 700) return {
    icon: 'star-outline',
    title: 'Acima da média!',
    message: 'Resultado excelente. Você já se destaca entre os candidatos do ENEM.',
    getAccent: (c) => c.accent,
    particleCount: 12,
    trigger: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  };
  if (score >= 600) return {
    icon: 'checkmark-circle-outline',
    title: 'Na média do ENEM!',
    message: 'Você alcançou o nível médio nacional. Agora é hora de ir ainda mais longe!',
    getAccent: (c) => c.accent,
    particleCount: 8,
    trigger: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  };
  if (score >= 400) return {
    icon: 'trending-up-outline',
    title: 'Você está crescendo!',
    message: 'Já está superando muitos obstáculos. Com mais prática e dedicação, você vai chegar lá.',
    getAccent: (c) => c.warning,
    particleCount: 0,
    trigger: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  };
  return {
    icon: 'heart-outline',
    title: 'Você deu o primeiro passo!',
    message: 'Cada tentativa te aproxima do seu objetivo. O crescimento começa exatamente aqui. Continue!',
    getAccent: (c) => c.warmAccent,
    particleCount: 0,
    trigger: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  };
}

// ─── Single particle ──────────────────────────────────────────────────────────

type ParticleProps = {
  angle: number;
  color: string;
  size: number;
  distance: number;
  delay: number;
};

function Particle({ angle, color, size, distance, delay }: ParticleProps) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const rad = (angle * Math.PI) / 180;
    const targetX = Math.cos(rad) * distance;
    const targetY = Math.sin(rad) * distance;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 220, useNativeDriver: true }),
        Animated.spring(tx, { toValue: targetX, damping: 14, stiffness: 90, useNativeDriver: true }),
        Animated.spring(ty, { toValue: targetY, damping: 14, stiffness: 90, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    />
  );
}

// ─── Particle burst ───────────────────────────────────────────────────────────

const SIZES    = [5, 8, 6, 9, 5, 7, 6, 8, 5, 9, 6, 7, 5, 8, 6, 9, 5, 7, 6, 8, 5, 9, 6, 7];
const DISTS    = [72, 96, 84, 108, 78, 90, 100, 74, 88, 80, 102, 76, 92, 86, 98, 70, 84, 96, 78, 90, 104, 72, 88, 82];
const DELAYS   = [0, 50, 25, 80, 40, 10, 65, 30, 55, 15, 70, 35, 0, 50, 25, 80, 40, 10, 65, 30, 55, 15, 70, 35];

function ParticleBurst({ count, accent }: { count: number; accent: string }) {
  const angles = Array.from({ length: count }, (_, i) => (360 / count) * i);
  const palette = [accent, accent + 'CC', accent + 'AA', accent + 'DD'];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {angles.map((angle, i) => (
        <View key={i} style={styles.particleOrigin}>
          <Particle
            angle={angle}
            color={palette[i % palette.length]}
            size={SIZES[i % SIZES.length]}
            distance={DISTS[i % DISTS.length]}
            delay={DELAYS[i % DELAYS.length]}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  score: number;
  visible: boolean;
  onDismiss: () => void;
};

export function ScoreCelebration({ score, visible, onDismiss }: Props) {
  const { colors } = useAppTheme();
  const band = getBand(score);
  const accent = band.getAccent(colors);
  const isGold = score >= 1000;

  const cardScale     = useRef(new Animated.Value(0.72)).current;
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardY         = useRef(new Animated.Value(32)).current;
  const iconEntrance  = useRef(new Animated.Value(0)).current;
  const iconPulse     = useRef(new Animated.Value(1)).current;
  const pulseLoop     = useRef<Animated.CompositeAnimation | null>(null);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (!visible) {
      pulseLoop.current?.stop();
      cardScale.setValue(0.72);
      cardOpacity.setValue(0);
      cardY.setValue(32);
      iconEntrance.setValue(0);
      iconPulse.setValue(1);
      setShowParticles(false);
      return;
    }

    band.trigger();

    Animated.parallel([
      Animated.spring(cardScale,   { toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardY,       { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(160),
        Animated.spring(iconEntrance, { toValue: 1, damping: 10, stiffness: 160, useNativeDriver: true }),
      ]),
    ]).start(() => {
      if (band.particleCount > 0) setShowParticles(true);

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulse, {
            toValue: 1.1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconPulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current = loop;
      loop.start();
    });

    return () => {
      pulseLoop.current?.stop();
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Overlay — tap outside to dismiss */}
      <Pressable style={styles.overlay} onPress={onDismiss}>

        {/* Card wrapper — absorbs touch so overlay doesn't dismiss on card tap */}
        <Pressable onPress={() => {}} style={styles.cardHitArea}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.surface },
              isGold && { borderWidth: 1.5, borderColor: '#F59E0B55' },
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }, { translateY: cardY }],
              },
            ]}
          >
            {/* Particle burst (high scores only) */}
            {showParticles && <ParticleBurst count={band.particleCount} accent={accent} />}

            {/* Icon */}
            <Animated.View
              style={[
                styles.iconOuter,
                { backgroundColor: accent + '1A' },
                { transform: [{ scale: iconEntrance }] },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: iconPulse }] }}>
                <Ionicons name={band.icon} size={isGold ? 48 : 42} color={accent} />
              </Animated.View>
            </Animated.View>

            {/* Score */}
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNum, { color: accent }]}>{score}</Text>
              <Text style={[styles.scoreDen, { color: colors.mutedText }]}> /1000</Text>
            </View>

            {/* Band label */}
            <Text style={[styles.title, { color: colors.text }]}>{band.title}</Text>

            {/* Separator */}
            <View style={[styles.sep, { backgroundColor: colors.border }]} />

            {/* Message */}
            <Text style={[styles.message, { color: colors.softText }]}>{band.message}</Text>

            {/* CTA */}
            <Pressable
              onPress={onDismiss}
              style={[styles.cta, { backgroundColor: accent }]}
              android_ripple={{ color: 'rgba(255,255,255,0.22)', radius: 200 }}
            >
              <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
              <Text style={styles.ctaLabel}>Ver resultado completo</Text>
            </Pressable>

            {/* Dismiss hint */}
            <Text style={[styles.hint, { color: colors.mutedText }]}>
              Toque fora para fechar
            </Text>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16,24,40,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardHitArea: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 26,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 44,
    elevation: 24,
  },
  // Particle
  particleOrigin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon
  iconOuter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNum: {
    fontSize: 60,
    fontWeight: '800',
    lineHeight: 66,
    letterSpacing: -2,
  },
  scoreDen: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  // Title
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 28,
  },
  // Separator
  sep: {
    width: '72%',
    height: 1,
    marginVertical: 2,
  },
  // Message
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  // Hint
  hint: {
    fontSize: 11,
    marginTop: 2,
  },
});
