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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(glowAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false })
    ).start();
  }, [glowAnim, pulseAnim]);

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: progressPct,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [barAnim, progressPct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.accent + '12', borderRadius: 12 }]}>
        <Text style={[styles.kicker, { color: colors.accent }]}>🤖 Correção em andamento</Text>
        <Text style={[styles.stepCounter, { color: colors.mutedText }]}>
          Etapa {currentStep} de 4
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.trackOuter, { backgroundColor: colors.input }]}>
        <Animated.View style={[styles.trackFill, { width: barWidth, backgroundColor: colors.accent }]}>
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

      {/* Steps */}
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

      {/* Feedback */}
      {feedback ? (
        <View style={[styles.feedbackBox, { backgroundColor: colors.input, borderRadius: 12 }]}>
          <Text style={[styles.feedbackText, { color: colors.softText }]}>{feedback}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  header: { padding: 12, gap: 4 },
  kicker: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  trackOuter: { height: 10, borderRadius: 999, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 999, overflow: 'hidden', position: 'relative' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.5)' },
  stepCounter: { fontSize: 12, fontWeight: '500' },
  steps: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepDotInner: { fontSize: 12, color: '#fff', fontWeight: '700' },
  activeDotInner: { width: 10, height: 10, borderRadius: 5 },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 15, lineHeight: 22 },
  feedbackBox: { padding: 12 },
  feedbackText: { fontSize: 13, lineHeight: 20 },
});
