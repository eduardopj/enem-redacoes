/**
 * Sistema de Skeleton com shimmer animado.
 *
 * Exportações:
 *  - Skeleton          → bloco retangular básico (genérico)
 *  - SkeletonDashboard → layout completo do dashboard
 *  - SkeletonCorrecoes → layout completo da tela de correções
 *  - SkeletonAlunos    → layout completo da tela de alunos
 *  - SkeletonResultado → layout completo da tela de resultado
 *
 * O shimmer é um único loop compartilhado via prop "shimmerValue"
 * gerado no componente-pai — evita N loops independentes.
 */
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

// ─── Hook para gerar o valor de shimmer ──────────────────────────────────────

export function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}

// ─── Bloco base com shimmer ───────────────────────────────────────────────────

type SkeletonProps = {
  width?: ViewStyle['width'];
  height?: number;
  radius?: number;
  style?: ViewStyle;
  shimmer?: Animated.Value;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = theme.radius.sm,
  style,
  shimmer,
}: SkeletonProps) {
  const { colors, isDark } = useAppTheme();

  const localShimmer = useRef(new Animated.Value(0)).current;
  const activeShimmer = shimmer ?? localShimmer;

  useEffect(() => {
    if (shimmer) return; // usa externo, não inicia loop local
    const loop = Animated.loop(
      Animated.timing(localShimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [localShimmer, shimmer]);

  const translateX = activeShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shimmerBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)';

  return (
    <View
      accessibilityLabel="Carregando"
      accessibilityRole="progressbar"
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: colors.input },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.shimmer,
          { transform: [{ translateX }], backgroundColor: shimmerBg },
        ]}
      />
    </View>
  );
}

// ─── Row helper (linha de text com label) ────────────────────────────────────

function SkRow({
  width = '100%',
  height = 14,
  radius = 6,
  shimmer,
}: SkeletonProps) {
  return <Skeleton width={width} height={height} radius={radius} shimmer={shimmer} />;
}

// ─── Skeleton Card container ─────────────────────────────────────────────────

function SkCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.skCard, { backgroundColor: colors.surface }, style]}>
      {children}
    </View>
  );
}

// ─── DASHBOARD skeleton ───────────────────────────────────────────────────────

export function SkeletonDashboard() {
  const shimmer = useShimmer();
  const { colors } = useAppTheme();

  return (
    <View style={styles.page}>
      {/* Header avatar + lines */}
      <SkCard>
        <View style={styles.headerRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.input }]} />
          <View style={styles.headerLines}>
            <SkRow width="38%" height={10} shimmer={shimmer} />
            <SkRow width="62%" height={18} shimmer={shimmer} />
            <SkRow width="45%" height={10} shimmer={shimmer} />
          </View>
        </View>
      </SkCard>

      {/* Action card grande */}
      <Skeleton height={88} radius={18} shimmer={shimmer} />

      {/* KPI grid 2x2 */}
      <View style={styles.kpiGrid}>
        {[0, 1, 2, 3].map((i) => (
          <SkCard key={i} style={styles.kpiCard}>
            <SkRow width={32} height={32} radius={10} shimmer={shimmer} />
            <SkRow width="70%" height={22} shimmer={shimmer} />
            <SkRow width="55%" height={11} shimmer={shimmer} />
          </SkCard>
        ))}
      </View>

      {/* Lista de últimas correções */}
      <SkCard>
        <SkRow width="40%" height={13} shimmer={shimmer} />
        <View style={styles.itemList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.listItemRow}>
              <SkRow width={40} height={40} radius={13} shimmer={shimmer} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkRow width="65%" height={14} shimmer={shimmer} />
                <SkRow width="45%" height={11} shimmer={shimmer} />
              </View>
              <SkRow width={40} height={20} radius={6} shimmer={shimmer} />
            </View>
          ))}
        </View>
      </SkCard>
    </View>
  );
}

// ─── CORREÇÕES skeleton ───────────────────────────────────────────────────────

export function SkeletonCorrecoes() {
  const shimmer = useShimmer();
  const { colors } = useAppTheme();

  return (
    <View style={styles.page}>
      {/* Hero card */}
      <SkCard style={{ backgroundColor: colors.accent + '20' }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkRow width="30%" height={10} shimmer={shimmer} />
            <SkRow width="75%" height={20} shimmer={shimmer} />
            <SkRow width="50%" height={11} shimmer={shimmer} />
          </View>
          <SkRow width={52} height={52} radius={18} shimmer={shimmer} />
        </View>
        <SkRow height={44} radius={12} shimmer={shimmer} />
      </SkCard>

      {/* KPI 4 itens */}
      <View style={styles.kpiGrid}>
        {[0, 1, 2, 3].map((i) => (
          <SkCard key={i} style={styles.kpiCard}>
            <SkRow width={34} height={34} radius={12} shimmer={shimmer} />
            <SkRow width="60%" height={22} shimmer={shimmer} />
            <SkRow width="80%" height={11} shimmer={shimmer} />
          </SkCard>
        ))}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.input }]}>
        {[0, 1, 2].map((i) => (
          <SkRow key={i} width="30%" height={36} radius={999} shimmer={shimmer} />
        ))}
      </View>

      {/* Lista de redações */}
      {[0, 1, 2, 3].map((i) => (
        <SkCard key={i}>
          <View style={styles.listItemRow}>
            <SkRow width={42} height={42} radius={14} shimmer={shimmer} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkRow width="60%" height={15} shimmer={shimmer} />
              <SkRow width="40%" height={11} shimmer={shimmer} />
              <SkRow width={72} height={20} radius={999} shimmer={shimmer} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <SkRow width={36} height={18} shimmer={shimmer} />
              <SkRow width={28} height={10} shimmer={shimmer} />
            </View>
          </View>
        </SkCard>
      ))}
    </View>
  );
}

// ─── ALUNOS skeleton ──────────────────────────────────────────────────────────

export function SkeletonAlunos() {
  const shimmer = useShimmer();

  return (
    <View style={styles.page}>
      {/* Summary grid 3 cards */}
      <View style={styles.kpiGrid3}>
        {[0, 1, 2].map((i) => (
          <SkCard key={i} style={{ flex: 1, gap: 6 }}>
            <SkRow width={30} height={30} radius={10} shimmer={shimmer} />
            <SkRow width="70%" height={20} shimmer={shimmer} />
            <SkRow width="85%" height={11} shimmer={shimmer} />
          </SkCard>
        ))}
      </View>

      {/* Search bar */}
      <Skeleton height={46} radius={14} shimmer={shimmer} />

      {/* Lista de alunos */}
      {[0, 1, 2, 3, 4].map((i) => (
        <SkCard key={i}>
          <View style={styles.listItemRow}>
            <SkRow width={46} height={46} radius={23} shimmer={shimmer} />
            <View style={{ flex: 1, gap: 7 }}>
              <SkRow width="55%" height={15} shimmer={shimmer} />
              <SkRow width="35%" height={11} shimmer={shimmer} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <SkRow width={44} height={22} shimmer={shimmer} />
              <SkRow width={36} height={11} shimmer={shimmer} />
            </View>
          </View>
        </SkCard>
      ))}
    </View>
  );
}

// ─── RESULTADO skeleton ───────────────────────────────────────────────────────

export function SkeletonResultado() {
  const shimmer = useShimmer();

  return (
    <View style={styles.page}>
      {/* Hero card com nota */}
      <SkCard>
        <View style={styles.heroScoreRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkRow width="25%" height={11} shimmer={shimmer} />
            <SkRow width="45%" height={56} shimmer={shimmer} />
            <SkRow width="35%" height={13} shimmer={shimmer} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <SkRow width={100} height={26} radius={999} shimmer={shimmer} />
            <SkRow width={120} height={26} radius={999} shimmer={shimmer} />
          </View>
        </View>
        <Skeleton height={52} radius={14} shimmer={shimmer} />
      </SkCard>

      {/* Tabs */}
      <Skeleton height={46} radius={14} shimmer={shimmer} />

      {/* Conteúdo da aba — cards de texto */}
      <SkCard>
        <SkRow width="40%" height={16} shimmer={shimmer} />
        <View style={styles.insightRow}>
          {[0, 1, 2].map((i) => (
            <SkCard key={i} style={{ flex: 1, gap: 6 }}>
              <SkRow width={18} height={18} radius={6} shimmer={shimmer} />
              <SkRow width="60%" height={11} shimmer={shimmer} />
              <SkRow width="80%" height={13} shimmer={shimmer} />
            </SkCard>
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <SkRow width="100%" height={14} shimmer={shimmer} />
          <SkRow width="92%" height={14} shimmer={shimmer} />
          <SkRow width="78%" height={14} shimmer={shimmer} />
        </View>
      </SkCard>

      {/* Bullets card */}
      <SkCard>
        <SkRow width="35%" height={16} shimmer={shimmer} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.bulletRow}>
            <SkRow width={7} height={7} radius={4} shimmer={shimmer} />
            <SkRow width={`${70 + i * 5}%`} height={14} shimmer={shimmer} />
          </View>
        ))}
      </SkCard>

      {/* Outro bullets card */}
      <SkCard>
        <SkRow width="30%" height={16} shimmer={shimmer} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.bulletRow}>
            <SkRow width={7} height={7} radius={4} shimmer={shimmer} />
            <SkRow width={`${65 + i * 8}%`} height={14} shimmer={shimmer} />
          </View>
        ))}
      </SkCard>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmer: {
    width: 120,
  },
  page: {
    gap: 14,
    paddingTop: 4,
  },
  skCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerLines: {
    flex: 1,
    gap: 7,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexShrink: 0,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiGrid3: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 14,
    justifyContent: 'space-around',
  },
  itemList: {
    gap: 12,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
});
