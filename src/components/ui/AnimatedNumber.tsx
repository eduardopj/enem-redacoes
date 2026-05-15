/**
 * AnimatedNumber — contador com efeito suspense de 2 fases:
 *
 * Fase 1 (55% do tempo): voa rápido de 0 até ~85% do valor
 *   → números passando rapidamente, adrenaline building
 *
 * Fase 2 (45% do tempo): desacelera drasticamente nos últimos 15%
 *   → Easing.out(Easing.exp) — exponential slowdown
 *   → o usuário fica: "vai ser 660? 680? 700?!" 🎯
 *
 * Props:
 *  value    → valor final a exibir
 *  style    → estilo do Text
 *  duration → duração total em ms (default: 1600)
 *  suspense → ativa o efeito de 2 fases (default: true)
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextStyle } from 'react-native';

type Props = {
  value: number;
  style?: TextStyle | TextStyle[];
  duration?: number;
  /** Se false, usa a easing simples sem o efeito de suspense */
  suspense?: boolean;
};

export function AnimatedNumber({
  value,
  style,
  duration = 1600,
  suspense = true,
}: Props) {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animVal.stopAnimation();
    animVal.setValue(0);
    setDisplay(0);

    const listenerId = animVal.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });

    if (!suspense || value === 0) {
      // Modo simples — sem suspense
      Animated.timing(animVal, {
        toValue: value,
        duration: Math.max(duration, 600),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setDisplay(value);
        animVal.removeListener(listenerId);
      });
      return () => {
        animVal.stopAnimation();
        animVal.removeListener(listenerId);
      };
    }

    // ─── Modo suspense ────────────────────────────────────────────────────────
    // Ponto de inflexão: ~87% do valor final
    const inflectionValue = Math.round(value * 0.87);
    const phase1Duration = Math.round(duration * 0.52);  // 52% do tempo → voa rápido
    const phase2Duration = duration - phase1Duration;      // 48% do tempo → arrasta devagar

    // Fase 1: sprint de 0 → 87%
    Animated.timing(animVal, {
      toValue: inflectionValue,
      duration: phase1Duration,
      easing: Easing.out(Easing.quad), // desacelera um pouco no fim da fase 1
      useNativeDriver: false,
    }).start((finished) => {
      if (!finished.finished) return;

      // Fase 2: crawl de 87% → 100% com desaceleração exponencial
      // Easing.out(Easing.exp): começa ainda rápido, termina quase parado
      Animated.timing(animVal, {
        toValue: value,
        duration: phase2Duration,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }).start(() => {
        setDisplay(value);
        animVal.removeListener(listenerId);
      });
    });

    return () => {
      animVal.stopAnimation();
      animVal.removeListener(listenerId);
    };
  }, [animVal, value, duration, suspense]);

  return <Text style={style}>{display}</Text>;
}
