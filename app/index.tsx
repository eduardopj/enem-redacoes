import { Button } from '@/components/ui';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function IndexScreen() {
  const { colors } = useAppTheme();

  const logoScale   = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(24);
  const profOpacity = useSharedValue(0);
  const profY       = useSharedValue(20);
  const alunoOpacity = useSharedValue(0);
  const alunoY       = useSharedValue(20);

  useEffect(() => {
    logoScale.value   = withSpring(1, { damping: 13, stiffness: 110 });
    logoOpacity.value = withTiming(1, { duration: 450 });
    textOpacity.value = withDelay(220, withTiming(1, { duration: 420 }));
    textY.value       = withDelay(220, withSpring(0, { damping: 18, stiffness: 160 }));
    profOpacity.value = withDelay(400, withTiming(1, { duration: 380 }));
    profY.value       = withDelay(400, withSpring(0, { damping: 18, stiffness: 160 }));
    alunoOpacity.value = withDelay(540, withTiming(1, { duration: 360 }));
    alunoY.value       = withDelay(540, withSpring(0, { damping: 18, stiffness: 160 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const profStyle = useAnimatedStyle(() => ({
    opacity: profOpacity.value,
    transform: [{ translateY: profY.value }],
  }));
  const alunoStyle = useAnimatedStyle(() => ({
    opacity: alunoOpacity.value,
    transform: [{ translateY: alunoY.value }],
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={logoStyle}>
            <View style={[styles.logoWrap, { backgroundColor: colors.accent }]}>
              <Ionicons name="school" size={40} color="#fff" />
            </View>
          </Animated.View>

          <Animated.View style={[styles.textBlock, textStyle]}>
            <Text style={[styles.brand, { color: colors.mutedText }]}>ENEM IA</Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              Correção de redações{'\n'}com inteligência
            </Text>
            <Text style={[styles.sub, { color: colors.mutedText }]}>
              Feedback pedagógico completo{'\n'}para cada aluno, em segundos.
            </Text>
          </Animated.View>
        </View>

        {/* Actions — clara separação entre professor e aluno */}
        <View style={styles.actions}>

          {/* Bloco Professor */}
          <Animated.View style={[styles.personaBlock, { backgroundColor: colors.surface, borderColor: colors.border }, profStyle]}>
            <View style={styles.personaHeader}>
              <View style={[styles.personaIconWrap, { backgroundColor: colors.accent + '18' }]}>
                <Ionicons name="briefcase-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.personaHeaderText}>
                <Text style={[styles.personaRole, { color: colors.text }]}>Sou professor</Text>
                <Text style={[styles.personaDesc, { color: colors.mutedText }]}>Corrija redações com IA</Text>
              </View>
            </View>
            <View style={styles.personaBtns}>
              <Button
                title="Entrar"
                leftIcon="arrow-forward-outline"
                onPress={() => router.replace('/login')}
              />
              <Button
                title="Criar conta"
                variant="secondary"
                leftIcon="person-add-outline"
                onPress={() => router.push('/cadastro')}
              />
            </View>
          </Animated.View>

          {/* Divisor */}
          <Animated.View style={[styles.dividerRow, alunoStyle]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.mutedText }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Bloco Aluno */}
          <Animated.View style={[styles.personaBlock, { backgroundColor: colors.input, borderColor: colors.border }, alunoStyle]}>
            <View style={styles.personaHeader}>
              <View style={[styles.personaIconWrap, { backgroundColor: '#22C55E18' }]}>
                <Ionicons name="person-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.personaHeaderText}>
                <Text style={[styles.personaRole, { color: colors.text }]}>Sou aluno</Text>
                <Text style={[styles.personaDesc, { color: colors.mutedText }]}>Acompanhe suas notas</Text>
              </View>
            </View>
            <Button
              title="Entrar como aluno"
              variant="secondary"
              leftIcon="school-outline"
              onPress={() => router.push('/student/login' as any)}
            />
          </Animated.View>

          <Animated.View style={alunoStyle}>
            <Text style={[styles.hint, { color: colors.mutedText }]}>
              Correção das 5 competências do ENEM com IA
            </Text>
          </Animated.View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  textBlock: { alignItems: 'center', gap: 10 },
  brand: { fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  headline: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  sub: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  actions: { gap: 12 },

  personaBlock: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  personaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  personaHeaderText: { flex: 1, gap: 2 },
  personaRole: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  personaDesc: { fontSize: 12, fontWeight: '500' },
  personaBtns: { gap: 8 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 12, fontWeight: '500' },

  hint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
