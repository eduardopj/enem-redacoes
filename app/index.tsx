import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: 'sparkles-outline' as const, text: 'IA Avançada' },
  { icon: 'ribbon-outline' as const, text: '5 Competências' },
  { icon: 'trending-up-outline' as const, text: 'Evolução Real' },
];

export default function IndexScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.topRight}>
        <ThemeToggle />
      </View>

      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          {/* Logo mark */}
          <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="school" size={32} color="#fff" />
          </View>

          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>ENEM IA</Text>

          <Text style={[styles.headline, { color: colors.text }]}>
            Redações corrigidas{'\n'}com precisão de IA
          </Text>

          <Text style={[styles.sub, { color: colors.mutedText }]}>
            Feedback completo baseado nos{'\n'}critérios oficiais do ENEM.
          </Text>

          {/* Feature pills */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.text} style={[styles.featurePill, { backgroundColor: colors.accentSoft, borderColor: colors.primaryMuted + '55' }]}>
                <Ionicons name={f.icon} size={13} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.accent }]}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Access tiles */}
        <View style={styles.cards}>
          <AccessTile
            title="Sou professor"
            description="Corrija redações e acompanhe a evolução da turma"
            icon="briefcase-outline"
            dark
            onPress={() => router.push('/login')}
            colors={colors}
          />
          <AccessTile
            title="Sou aluno"
            description="Veja suas notas, feedback e evolução"
            icon="person-outline"
            onPress={() => router.push('/student/login' as any)}
            colors={colors}
          />
        </View>

        <Text style={[styles.footer, { color: colors.mutedText }]}>
          Ferramenta educacional com IA · ENEM
        </Text>

      </View>
    </SafeAreaView>
  );
}

function AccessTile({
  title,
  description,
  icon,
  dark = false,
  onPress,
  colors,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  dark?: boolean;
  onPress: () => void;
  colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: 0.975, damping: 20, stiffness: 260, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, damping: 20, stiffness: 260, useNativeDriver: true }).start();
  }

  const bg = dark ? colors.accent : colors.surface;
  const iconBg = dark ? 'rgba(255,255,255,0.15)' : colors.accentSoft;
  const iconColor = dark ? '#fff' : colors.accent;
  const titleColor = dark ? '#fff' : colors.text;
  const descColor = dark ? 'rgba(255,255,255,0.65)' : colors.mutedText;
  const arrowBg = dark ? 'rgba(255,255,255,0.13)' : colors.accentSoft;
  const arrowColor = dark ? '#fff' : colors.accent;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.tile,
          { backgroundColor: bg },
          !dark && { borderWidth: 1, borderColor: colors.border },
          dark && {
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 8,
          },
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>

        <View style={styles.tileText}>
          <Text style={[styles.tileTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.tileDesc, { color: descColor }]}>{description}</Text>
        </View>

        <View style={[styles.tileArrow, { backgroundColor: arrowBg }]}>
          <Ionicons name="arrow-forward" size={16} color={arrowColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  topRight: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },

  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 28,
    paddingBottom: 8,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.8,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
  },

  cards: { gap: 12 },

  tile: {
    minHeight: 80,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileText: { flex: 1, gap: 3 },
  tileTitle: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  tileDesc: { fontSize: 13, lineHeight: 18 },
  tileArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  footer: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
