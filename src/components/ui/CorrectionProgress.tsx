import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type CorrectionProgressProps = {
  currentStep: 1 | 2 | 3 | 4;
  feedback?: string;
};

const STEPS = [
  { n: 1, label: 'Lendo imagem', sub: 'Conferindo nitidez e folha inteira' },
  { n: 2, label: 'Transcrevendo', sub: 'Convertendo manuscrito em texto' },
  { n: 3, label: 'Avaliando ENEM', sub: 'Pontuando C1 a C5' },
  { n: 4, label: 'Preparando devolutiva', sub: 'Organizando próximos passos' },
];

const MESSAGES = [
  'Lendo a imagem com atenção.',
  'Transcrevendo o texto manuscrito.',
  'Avaliando repertório e argumentação.',
  'Calculando nota por competência.',
  'Separando pontos fortes e prioridades.',
  'Preparando feedback pedagógico.',
];

const PROGRESS_TARGETS: Record<number, number> = { 1: 22, 2: 48, 3: 76, 4: 94 };

export function CorrectionProgress({ currentStep, feedback }: CorrectionProgressProps) {
  const { colors } = useAppTheme();
  useKeepAwake();

  const progress = useRef(new Animated.Value(8)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.75)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const visibleMessage = useMemo(() => {
    if (feedback && !feedback.startsWith('ETAPA')) return feedback;
    return MESSAGES[messageIndex];
  }, [feedback, messageIndex]);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: PROGRESS_TARGETS[currentStep] ?? 8,
      damping: 18,
      stiffness: 85,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.75, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(messageOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setMessageIndex((index) => (index + 1) % MESSAGES.length);
        Animated.timing(messageOpacity, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      });
    }, 2600);
    return () => clearInterval(interval);
  }, [messageOpacity]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-90, 300] });
  const elapsedLabel = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  const footerMessage =
    elapsed > 110
      ? 'Redações manuscritas podem levar até 2 min. Quase lá!'
      : elapsed > 60
      ? 'Aguardando a IA finalizar a análise…'
      : 'Mantenha o app aberto. O resultado aparece automaticamente.';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
          </Animated.View>
        </View>
        <View style={styles.titleGroup}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>CORREÇÃO EM ANDAMENTO</Text>
          <Text style={[styles.title, { color: colors.text }]}>Análise pedagógica</Text>
        </View>
        <Text style={[styles.timer, { color: colors.mutedText }]}>{elapsedLabel}</Text>
      </View>

      <View style={styles.progressBlock}>
        <View style={[styles.track, { backgroundColor: colors.input }]}>
          <Animated.View style={[styles.fill, { width: barWidth, backgroundColor: colors.accent }]}>
            <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />
          </Animated.View>
        </View>
        <View style={styles.progressMeta}>
          <Text style={[styles.progressText, { color: colors.accent }]}>
            {PROGRESS_TARGETS[currentStep]}%
          </Text>
          <Text style={[styles.progressHint, { color: colors.mutedText }]}>
            Etapa {currentStep} de 4
          </Text>
        </View>
      </View>

      <View style={[styles.messageBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Animated.Text
          numberOfLines={2}
          style={[styles.message, { color: colors.softText, opacity: messageOpacity }]}
        >
          {visibleMessage}
        </Animated.Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => {
          const isDone = step.n < currentStep;
          const isActive = step.n === currentStep;

          return (
            <View key={step.n} style={styles.stepRow}>
              <View
                style={[
                  styles.stepIcon,
                  { borderColor: colors.border, backgroundColor: colors.input },
                  isDone && { borderColor: colors.success, backgroundColor: colors.successSoft },
                  isActive && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color={colors.success} />
                ) : isActive ? (
                  <Animated.View style={[styles.activeDot, { backgroundColor: colors.accent, transform: [{ scale: pulse }] }]} />
                ) : (
                  <View style={[styles.pendingDot, { backgroundColor: colors.border }]} />
                )}
              </View>
              <View style={styles.stepText}>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: colors.mutedText },
                    isDone && { color: colors.success },
                    isActive && { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {step.label}
                </Text>
                {isActive ? <Text style={[styles.stepSub, { color: colors.mutedText }]}>{step.sub}</Text> : null}
              </View>
              {isActive ? (
                <View style={[styles.livePill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.liveText, { color: colors.accent }]}>agora</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.footer, { color: colors.mutedText, borderTopColor: colors.border }]}>
        {footerMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    ...theme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  timer: { fontSize: 11, fontWeight: '600' },
  progressBlock: { gap: 6 },
  track: { height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  shimmer: {
    width: 60,
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  progressMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { fontSize: 12, fontWeight: '800' },
  progressHint: { fontSize: 11, fontWeight: '600' },
  messageBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  message: { fontSize: 13, lineHeight: 18 },
  steps: { gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: { width: 9, height: 9, borderRadius: 5 },
  pendingDot: { width: 6, height: 6, borderRadius: 3 },
  stepText: { flex: 1, gap: 1 },
  stepLabel: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  stepSub: { fontSize: 11, lineHeight: 15 },
  livePill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { fontSize: 10, fontWeight: '700' },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
  },
});
