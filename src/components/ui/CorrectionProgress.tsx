import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type CorrectionProgressProps = {
  currentStep: 1 | 2 | 3 | 4;
  feedback?: string;
};

const STEPS = [
  { n: 1, label: 'Lendo a imagem', icon: '👁️' },
  { n: 2, label: 'Avaliando o tema', icon: '🎯' },
  { n: 3, label: 'Pontuando competências', icon: '📊' },
  { n: 4, label: 'Parecer pedagógico', icon: '✍️' },
];

export function CorrectionProgress({ currentStep, feedback }: CorrectionProgressProps) {
  const { colors } = useAppTheme();

  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const progressPct = ((currentStep - 1) / 3) * 100;

  useEffect(() => {
    // Pulse animation for active dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Glow sweep
    Animated.loop(
      Animated.timing(glowAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false })
    ).start();
  }, [glowAnim, pulseAnim]);

  useEffect(() => {
    // Progress bar animation on step change
    Animated.spring(barAnim, {
      toValue: progressPct,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [barAnim, progressPct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.accent }]}>🤖 CORREÇÃO EM ANDAMENTO</Text>
      </View>

      {/* Big progress bar */}
      <View style={[styles.trackOuter, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Animated.View style={[styles.trackFill, { width: barWidth, backgroundColor: colors.accent }]}>
          {/* Shimmer effect inside fill */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: glowAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] }),
                transform: [{ translateX: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 200] }) }],
              },
            ]}
          />
        </Animated.View>
      </View>

      {/* Step counter */}
      <Text style={[styles.stepCounter, { color: colors.mutedText }]}>
        ETAPA {currentStep} DE 4
      </Text>

      {/* Steps list */}
      <View style={styles.steps}>
        {STEPS.map((step) => {
          const isActive = step.n === currentStep;
          const isDone = step.n < currentStep;
          return (
            <View key={step.n} style={styles.stepRow}>
              <View style={[
                styles.stepDot,
                isDone && { backgroundColor: colors.success, borderColor: colors.success },
                isActive && { borderColor: colors.accent, borderWidth: 2 },
                !isDone && !isActive && { borderColor: colors.border },
              ]}>
                {isDone ? (
                  <Text style={styles.stepDotInner}>✓</Text>
                ) : isActive ? (
                  <Animated.View style={[styles.activeDotInner, { backgroundColor: colors.accent, opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]} />
                ) : (
                  <View style={[styles.pendingDot, { backgroundColor: colors.border }]} />
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                isDone && { color: colors.success },
                isActive && { color: colors.text, fontWeight: '700' },
                !isDone && !isActive && { color: colors.mutedText },
              ]}>
                {step.icon} {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Feedback text */}
      {feedback ? (
        <View style={[styles.feedbackBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Text style={[styles.feedbackText, { color: colors.softText }]}>{feedback}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 4, padding: 20, gap: 16 },
  header: { gap: 4 },
  kicker: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6 },
  trackOuter: { height: 10, borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 999, overflow: 'hidden', position: 'relative' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.5)' },
  stepCounter: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, textAlign: 'center' },
  steps: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepDotInner: { fontSize: 12, color: '#fff', fontWeight: '700' },
  activeDotInner: { width: 10, height: 10, borderRadius: 5 },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 15, lineHeight: 22 },
  feedbackBox: { borderWidth: 1, borderRadius: 4, padding: 12 },
  feedbackText: { fontSize: 13, lineHeight: 20, fontFamily: 'monospace' },
});
