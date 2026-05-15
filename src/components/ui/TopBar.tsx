import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeToggle } from './ThemeToggle';

type TopBarProps = {
  showHomeButton?: boolean;
  showBack?: boolean;
  title?: string;
};

/**
 * Barra de navegação global.
 *
 * Layout:
 *   LEFT  → botão voltar e/ou home  (quando showBack=true)
 *   CENTER → logo "ENEM IA" sempre visível (ou título de página quando title != null)
 *   RIGHT  → ThemeToggle
 *
 * Isso garante que o app tenha identidade em TODAS as telas.
 */
export function TopBar({ showHomeButton = true, showBack = false, title }: TopBarProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>

      {/* LEFT — navegação */}
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
            hitSlop={10}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
        ) : null}

        {showBack && showHomeButton ? (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={[styles.iconBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
            hitSlop={10}
            accessibilityLabel="Ir para o início"
            accessibilityRole="button"
          >
            <Ionicons name="home-outline" size={18} color={colors.softText} />
          </Pressable>
        ) : null}
      </View>

      {/* CENTER — identidade do app (sempre visível) */}
      <View style={styles.center}>
        {title ? (
          <Text style={[styles.pageTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <Pressable
            onPress={() => router.replace('/dashboard')}
            style={styles.logoBtn}
            hitSlop={8}
            accessibilityLabel="ENEM IA — ir para o início"
            accessibilityRole="button"
          >
            <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="school" size={13} color="#FFFFFF" />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>ENEM IA</Text>
          </Pressable>
        )}
      </View>

      {/* RIGHT — ações globais */}
      <View style={styles.right}>
        <ThemeToggle />
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    minHeight: 64,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 88, // largura fixa garante que o centro fique centrado
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 88, // mesma largura do left para o centro ficar exatamente no meio
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: 'Nunito_900Black',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
    fontFamily: 'Nunito_700Bold',
  },
});
