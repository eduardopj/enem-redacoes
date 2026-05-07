import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: colors.primaryMuted }]}>
            <Ionicons name="school" size={30} color={colors.accentHover} />
          </View>

          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>ENEM IA</Text>

          <Text style={[styles.headline, { color: colors.text }]}>
            Correção{'\n'}inteligente
          </Text>

          <Text style={[styles.sub, { color: colors.mutedText }]}>
            IA que analisa redações com{'\n'}profundidade e precisão do ENEM.
          </Text>
        </View>

        {/* Cards de acesso */}
        <View style={styles.cards}>
          <AccessTile
            title="Sou professor"
            description="Corrigir redações e acompanhar turmas"
            icon="briefcase-outline"
            dark
            onPress={() => router.push('/login')}
            colors={colors}
          />
          <AccessTile
            title="Sou aluno"
            description="Ver notas, evolução e devolutivas"
            icon="person-outline"
            onPress={() => router.push('/student/login' as any)}
            colors={colors}
          />
        </View>

        {/* Rodapé */}
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

  const bg = dark ? colors.accentHover : colors.surface;
  const iconBg = dark ? 'rgba(255,255,255,0.14)' : colors.accentSoft;
  const iconColor = dark ? '#fff' : colors.accentHover;
  const titleColor = dark ? '#fff' : colors.text;
  const descColor = dark ? 'rgba(255,255,255,0.62)' : colors.mutedText;
  const arrowBg = dark ? 'rgba(255,255,255,0.12)' : colors.accentSoft;
  const arrowColor = dark ? '#fff' : colors.accentHover;

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

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 32,
    paddingBottom: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Tiles
  cards: { gap: 12 },

  tile: {
    minHeight: 76,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tileIcon: {
    width: 50,
    height: 50,
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

  // Footer
  footer: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
