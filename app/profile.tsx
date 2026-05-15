import { ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const sentryConsent = useAppStore((state) => state.sentryConsent);
  const setSentryConsent = useAppStore((state) => state.setSentryConsent);
  const logout = useAppStore((state) => state.logout);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados (redações, turmas, alunos) serão apagados permanentemente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace('/');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Voltar" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Minha conta</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Nome</Text>
        <Text style={[styles.value, { color: colors.text }]}>{currentTeacher?.name ?? '—'}</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.mutedText }]}>E-mail</Text>
        <Text style={[styles.value, { color: colors.text }]}>{currentTeacher?.email ?? '—'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Relatórios de erro</Text>
            <Text style={[styles.rowSub, { color: colors.mutedText }]}>
              {sentryConsent === true ? 'Ativado — obrigado!' : sentryConsent === false ? 'Desativado' : 'Não definido'}
            </Text>
          </View>
          <Pressable
            onPress={() => setSentryConsent(!sentryConsent)}
            hitSlop={8}
            accessibilityLabel={sentryConsent ? 'Desativar relatórios de erro' : 'Ativar relatórios de erro'}
            accessibilityRole="switch"
          >
            <Ionicons
              name={sentryConsent ? 'toggle' : 'toggle-outline'}
              size={32}
              color={sentryConsent ? colors.accent : colors.mutedText}
            />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={handleLogout}
        accessibilityLabel="Sair da conta"
        accessibilityRole="button"
      >
        <Ionicons name="log-out-outline" size={18} color={colors.mutedText} />
        <Text style={[styles.btnText, { color: colors.mutedText }]}>Sair</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnDanger, { borderColor: '#EF4444' }]}
        onPress={handleDeleteAccount}
        disabled={deleting}
        accessibilityLabel="Excluir minha conta"
        accessibilityRole="button"
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
        <Text style={[styles.btnText, { color: '#EF4444' }]}>
          {deleting ? 'Excluindo…' : 'Excluir minha conta'}
        </Text>
      </Pressable>

      <Text style={[styles.hint, { color: colors.mutedText }]}>
        A exclusão remove permanentemente todos os seus dados do servidor, conforme a LGPD.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  btnDanger: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
