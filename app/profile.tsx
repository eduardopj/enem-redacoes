import { ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const APP_VERSION = '1.0.0';
const PRIVACY_URL = 'https://enemredacoes.app/privacidade';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { currentTeacher, turmas, students, essays, sentryConsent, setSentryConsent, logout, deleteAccount } =
    useAppStore(
      useShallow((s) => ({
        currentTeacher: s.currentTeacher,
        turmas: s.turmas,
        students: s.students,
        essays: s.essays,
        sentryConsent: s.sentryConsent,
        setSentryConsent: s.setSentryConsent,
        logout: s.logout,
        deleteAccount: s.deleteAccount,
      }))
    );

  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    if (!currentTeacher) return { turmas: 0, alunos: 0, redacoes: 0 };
    const myTurmas = turmas.filter((t) => t.teacherId === currentTeacher.id);
    const myAlunos = students.filter((s) => s.teacherId === currentTeacher.id);
    const myEssays = essays.filter((e) => e.teacherId === currentTeacher.id);
    return { turmas: myTurmas.length, alunos: myAlunos.length, redacoes: myEssays.length };
  }, [currentTeacher, turmas, students, essays]);

  const initials = (currentTeacher?.name ?? 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

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
    <ScreenContainer showBack>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
          {currentTeacher?.name ?? 'Professor'}
        </Text>
        <Text style={[styles.heroEmail, { color: colors.mutedText }]} numberOfLines={1}>
          {currentTeacher?.email ?? ''}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatChip value={stats.turmas} label="turmas" colors={colors} />
          <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
          <StatChip value={stats.alunos} label="alunos" colors={colors} />
          <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
          <StatChip value={stats.redacoes} label="redações" colors={colors} />
        </View>
      </View>

      {/* ── Configurações ── */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>CONFIGURAÇÕES</Text>

        {/* Sentry toggle */}
        <Pressable
          style={styles.row}
          onPress={() => setSentryConsent(!sentryConsent)}
          accessibilityLabel={sentryConsent ? 'Desativar relatórios de erro' : 'Ativar relatórios de erro'}
          accessibilityRole="switch"
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="bug-outline" size={16} color={colors.info} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Relatórios de erro</Text>
            <Text style={[styles.rowSub, { color: colors.mutedText }]}>
              {sentryConsent ? 'Ativado — ajuda a melhorar o app' : 'Desativado'}
            </Text>
          </View>
          <Ionicons
            name={sentryConsent ? 'toggle' : 'toggle-outline'}
            size={30}
            color={sentryConsent ? colors.accent : colors.mutedText}
          />
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        {/* Política de privacidade */}
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL(PRIVACY_URL)}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Política de Privacidade</Text>
            <Text style={[styles.rowSub, { color: colors.mutedText }]}>LGPD — seus dados e direitos</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.mutedText} />
        </Pressable>
      </View>

      {/* ── Conta ── */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>CONTA</Text>

        <Pressable style={styles.row} onPress={handleLogout}>
          <View style={[styles.rowIcon, { backgroundColor: colors.input }]}>
            <Ionicons name="log-out-outline" size={16} color={colors.softText} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Sair da conta</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <Pressable
          style={styles.row}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.danger }]}>
              {deleting ? 'Excluindo…' : 'Excluir minha conta'}
            </Text>
            <Text style={[styles.rowSub, { color: colors.mutedText }]}>
              Remove todos os dados permanentemente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.danger + '88'} />
        </Pressable>
      </View>

      {/* ── Versão ── */}
      <Text style={[styles.version, { color: colors.mutedText }]}>
        ENEM IA · versão {APP_VERSION}
      </Text>

    </ScreenContainer>
  );
}

function StatChip({ value, label, colors }: { value: number; label: string; colors: any }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsDivider: {
    width: 1,
    height: 32,
  },

  section: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 56,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  rowSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },

  version: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
