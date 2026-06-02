import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  currentEssay: Essay;
  allEssays: Essay[];
};

function getPreviousScore(currentEssay: Essay, allEssays: Essay[]): number | null {
  // Pega redações do mesmo aluno, corrigidas, anteriores à atual
  const previous = allEssays
    .filter(
      (e) =>
        e.studentId === currentEssay.studentId &&
        e.id !== currentEssay.id &&
        (e.status === 'corrigida' || e.status === 'baixa_confiabilidade') &&
        typeof e.totalScore === 'number' &&
        e.createdAt != null &&
        (currentEssay.createdAt == null || e.createdAt < currentEssay.createdAt)
    )
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.localeCompare(a.createdAt); // mais recente primeiro
    });

  return previous[0]?.totalScore ?? null;
}

export function EvolutionBanner({ currentEssay, allEssays }: Props) {
  const { colors } = useAppTheme();
  const prevScore = getPreviousScore(currentEssay, allEssays);
  const currentScore = currentEssay.totalScore ?? 0;
  const diff = prevScore != null ? currentScore - prevScore : null;
  const same = diff === 0;

  const ty = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (same) return;
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, damping: 16, stiffness: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  if (same) return null;

  const animStyle = { transform: [{ translateY: ty }, { scale }], opacity };

  if (prevScore == null) {
    return (
      <Animated.View
        style={[styles.banner, { backgroundColor: colors.success + '14', borderColor: colors.success + '40' }, animStyle]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.success + '22' }]}>
          <Ionicons name="star" size={20} color={colors.success} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.diffLabel, { color: colors.success }]}>Primeira redação corrigida!</Text>
          <Text style={[styles.sub, { color: colors.softText }]}>O começo de uma grande jornada. Continue assim!</Text>
        </View>
      </Animated.View>
    );
  }

  const improved = diff! > 0;
  const accent = improved ? colors.success : colors.warning;
  const icon: keyof typeof Ionicons.glyphMap = improved ? 'trending-up' : 'trending-down';
  const label = improved
    ? `+${diff} pontos desde a última redação`
    : `${diff} pontos desde a última redação`;
  const sub = improved
    ? 'Continue assim! Você está crescendo.'
    : 'Cada tentativa é aprendizado. Vai lá!';

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: accent + '14', borderColor: accent + '40' }, animStyle]}
    >
      <View style={[styles.iconCircle, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>

      <View style={styles.textCol}>
        <View style={styles.diffRow}>
          <Text style={[styles.diffLabel, { color: accent }]}>{label}</Text>
        </View>
        <Text style={[styles.sub, { color: colors.softText }]}>{sub}</Text>
      </View>

      <View style={[styles.scorePill, { backgroundColor: accent + '1A' }]}>
        <Text style={[styles.prevLabel, { color: colors.mutedText }]}>anterior</Text>
        <Text style={[styles.prevScore, { color: accent }]}>{prevScore}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: { flex: 1, gap: 2 },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diffLabel: { fontSize: 14, fontWeight: '800', lineHeight: 19 },
  sub: { fontSize: 12, lineHeight: 17 },
  scorePill: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexShrink: 0,
  },
  prevLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  prevScore: { fontSize: 20, fontWeight: '800', lineHeight: 25 },
});
