import { useAppTheme } from '@/theme/ThemeContext';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type CorrectionProgressProps = {
  currentStep: 1 | 2 | 3 | 4;
  feedback?: string;
};

const STEPS = [
  { n: 1, label: 'Lendo a imagem', sub: 'Identificando tipo de escrita' },
  { n: 2, label: 'Avaliando o tema', sub: 'Verificando adequação temática' },
  { n: 3, label: 'Pontuando competências', sub: 'Analisando as 5 competências' },
  { n: 4, label: 'Parecer pedagógico', sub: 'Elaborando feedback completo' },
];

const AI_MESSAGES = [
  'Analisando caligrafia e estrutura do texto...',
  'Verificando coerência e coesão textual...',
  'Avaliando domínio da norma culta...',
  'Identificando recursos argumentativos...',
  'Analisando a proposta de intervenção social...',
  'Calculando pontuação por competência...',
  'Verificando adequação ao tema proposto...',
  'Elaborando sugestões de melhoria...',
  'Comparando com critérios oficiais do ENEM...',
  'Finalizando o parecer pedagógico...',
  'Transcrevendo o manuscrito...',
  'Identificando pontos fortes e fracos...',
];

const PROGRESS_TARGETS: Record<number, number> = { 1: 18, 2: 42, 3: 70, 4: 92 };

export function CorrectionProgress({ currentStep }: CorrectionProgressProps) {
  const { colors } = useAppTheme();
  useKeepAwake();

  // --- Animated values ---
  const barAnim = useRef(new Animated.Value(5)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.6)).current;

  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Smooth fill to target on step change
  useEffect(() => {
    const target = PROGRESS_TARGETS[currentStep] ?? 5;
    Animated.spring(barAnim, {
      toValue: target,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [barAnim, currentStep]);

  // Shimmer loop
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);

  // Typing dots
  useEffect(() => {
    const makeDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 260, useNativeDriver: true }),
          Animated.delay(520),
        ])
      );
    const d1 = makeDot(dot1Anim, 0);
    const d2 = makeDot(dot2Anim, 220);
    const d3 = makeDot(dot3Anim, 440);
    d1.start();
    d2.start();
    d3.start();
    return () => { d1.stop(); d2.stop(); d3.stop(); };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  // Glow pulse
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glowPulse]);

  // Rotate messages every 3s with fade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(msgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % AI_MESSAGES.length);
        Animated.timing(msgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [msgOpacity]);

  // Elapsed time counter
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const barWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 280] });
  const pct = PROGRESS_TARGETS[currentStep] ?? 5;

  const elapsedLabel =
    elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.badgeWrap, { backgroundColor: colors.accent + '16' }]}>
          <Animated.Text style={[styles.sparkle, { opacity: glowPulse }]}>✦</Animated.Text>
          <Text style={[styles.badgeText, { color: colors.accent }]}>IA corrigindo</Text>
        </View>
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: colors.mutedText }]}>{elapsedLabel}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barSection}>
        <View style={[styles.barOuter, { backgroundColor: colors.input }]}>
          <Animated.View
            style={[styles.barFill, { width: barWidth, backgroundColor: colors.accent }]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerX }] },
              ]}
            />
          </Animated.View>
        </View>
        <View style={styles.barMeta}>
          <Text style={[styles.barPct, { color: colors.accent }]}>{pct}%</Text>
          <Text style={[styles.barLabel, { color: colors.mutedText }]}>
            Etapa {currentStep} de 4
          </Text>
        </View>
      </View>

      {/* Rotating AI message */}
      <View style={[styles.msgBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Animated.Text
          style={[styles.msgText, { color: colors.softText, opacity: msgOpacity }]}
          numberOfLines={1}
        >
          {AI_MESSAGES[msgIndex]}
        </Animated.Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot1Anim }]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot2Anim }]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.accent, opacity: dot3Anim }]} />
        </View>
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((step) => {
          const isDone = step.n < currentStep;
          const isActive = step.n === currentStep;
          const isPending = step.n > currentStep;

          return (
            <View key={step.n} style={styles.stepRow}>
              {/* Icon */}
              <View
                style={[
                  styles.stepIcon,
                  isDone && { backgroundColor: colors.success + '20', borderColor: colors.success },
                  isActive && { backgroundColor: colors.accent + '20', borderColor: colors.accent },
                  isPending && { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                {isDone ? (
                  <Text style={[styles.stepCheck, { color: colors.success }]}>✓</Text>
                ) : isActive ? (
                  <Animated.View
                    style={[
                      styles.activeDot,
                      { backgroundColor: colors.accent, transform: [{ scale: glowPulse }] },
                    ]}
                  />
                ) : (
                  <View style={[styles.pendingDot, { backgroundColor: colors.border }]} />
                )}
              </View>

              {/* Label */}
              <View style={styles.stepText}>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && { color: colors.success },
                    isActive && { color: colors.text, fontWeight: '700' },
                    isPending && { color: colors.mutedText },
                  ]}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Text style={[styles.stepSub, { color: colors.mutedText }]}>{step.sub}</Text>
                )}
              </View>

              {/* Right state */}
              {isDone && (
                <Text style={[styles.stepDoneLabel, { color: colors.success }]}>Concluído</Text>
              )}
              {isActive && (
                <View style={[styles.activePill, { backgroundColor: colors.accent + '18' }]}>
                  <Text style={[styles.activePillText, { color: colors.accent }]}>Em análise</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Footer hint */}
      <Text style={[styles.footerHint, { color: colors.mutedText, borderTopColor: colors.border }]}>
        Não feche o app durante a correção
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 18,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sparkle: { fontSize: 13 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },

  // Bar
  barSection: { gap: 8 },
  barOuter: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barPct: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  barLabel: { fontSize: 12, fontWeight: '500' },

  // Message box
  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    gap: 10,
  },
  msgText: { flex: 1, fontSize: 13, lineHeight: 18 },
  dotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },

  // Steps
  steps: { gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepCheck: { fontSize: 13, fontWeight: '800' },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { flex: 1, gap: 2 },
  stepLabel: { fontSize: 14, lineHeight: 20 },
  stepSub: { fontSize: 11, lineHeight: 15 },
  stepDoneLabel: { fontSize: 11, fontWeight: '700' },
  activePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  activePillText: { fontSize: 10, fontWeight: '700' },

  footerHint: {
    fontSize: 11,
    textAlign: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
    letterSpacing: 0.1,
  },
});
