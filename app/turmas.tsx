import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { useShallow } from 'zustand/react/shallow';
import { QRJoinPayload, Turma } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const PERIOD_ICON: Record<string, any> = {
  manhã: 'sunny-outline',
  tarde: 'partly-sunny-outline',
  noite: 'moon-outline',
  integral: 'time-outline',
};

const PERIOD_COLOR: Record<string, string> = {
  manhã: '#B7791F',
  tarde: '#3B5BA9',
  noite: '#6D4C9E',
  integral: '#15803D',
};

function scoreColor(s: number, colors: any): string {
  if (s >= 700) return colors.success;
  if (s >= 500) return colors.warning;
  return colors.danger;
}

export default function TurmasScreen() {
  const { colors } = useAppTheme();
  const { currentTeacher, turmas, students, essays, deleteTurma, generateTurmaJoinCode } =
    useAppStore(
      useShallow((s) => ({
        currentTeacher: s.currentTeacher,
        turmas: s.turmas,
        students: s.students,
        essays: s.essays,
        deleteTurma: s.deleteTurma,
        generateTurmaJoinCode: s.generateTurmaJoinCode,
      }))
    );

  const [qrTurmaId, setQrTurmaId] = useState<string | null>(null);
  const qrTurma = turmas.find((t) => t.id === qrTurmaId) ?? null;

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const turmaStats = useMemo(
    () =>
      myTurmas.map((t) => {
        const ss = students.filter((s) => s.turmaId === t.id);
        const allEssays = essays.filter((e) => ss.some((s) => s.id === e.studentId));
        const corrected = allEssays.filter((e) => e.status === 'corrigida');
        const scores = corrected.map((e) => e.totalScore ?? 0).filter((s) => s > 0);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const pending = allEssays.filter((e) => e.status === 'pendente').length;
        return { turma: t, studentCount: ss.length, essayCount: allEssays.length, correctedCount: corrected.length, avg, pending };
      }),
    [myTurmas, students, essays]
  );

  function handleShowQR(turma: Turma) {
    generateTurmaJoinCode(turma.id);
    setQrTurmaId(turma.id);
  }

  function buildQRValue(turma: Turma): string {
    if (!currentTeacher) return '';
    const payload: QRJoinPayload = {
      type: 'enem-ia-join-v1',
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      teacherEmail: currentTeacher.email,
      turmaId: turma.id,
      turmaName: turma.name,
      joinCode: turma.joinCode ?? '',
    };
    return JSON.stringify(payload);
  }

  function handleDelete(turma: Turma) {
    Alert.alert(
      'Apagar turma',
      `Apagar "${turma.name}"? Os alunos não serão removidos, apenas desvinculados da turma.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => deleteTurma(turma.id) },
      ]
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Minhas turmas</Text>
            <Text style={[styles.pageSub, { color: colors.mutedText }]}>
              {myTurmas.length > 0
                ? `${myTurmas.length} turma${myTurmas.length !== 1 ? 's' : ''} cadastrada${myTurmas.length !== 1 ? 's' : ''}`
                : 'Nenhuma turma ainda'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/nova-turma' as any)}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {myTurmas.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '14' }]}>
              <Ionicons name="people-outline" size={40} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Crie sua primeira turma</Text>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              Organizar alunos em turmas facilita o acompanhamento, o ranking e a análise do desempenho coletivo.
            </Text>
            <Button
              title="Criar turma agora"
              leftIcon="people-outline"
              onPress={() => router.push('/nova-turma' as any)}
            />
          </View>
        ) : (
          <>
            {turmaStats.map(({ turma, studentCount, essayCount, correctedCount, avg, pending }) => {
              const pColor = turma.period ? PERIOD_COLOR[turma.period] : colors.accent;
              const pIcon = turma.period ? PERIOD_ICON[turma.period] : 'school-outline';
              return (
                <Pressable
                  key={turma.id}
                  onPress={() => router.push(`/turma/${turma.id}` as any)}
                  style={[styles.card, { backgroundColor: colors.surface }]}
                >
                  {/* Card top */}
                  <View style={styles.cardTop}>
                    <View style={[styles.classIcon, { backgroundColor: pColor + '18' }]}>
                      <Ionicons name={pIcon} size={20} color={pColor} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{turma.name}</Text>
                      <View style={styles.cardMeta}>
                        {turma.period && (
                          <Pill label={turma.period.charAt(0).toUpperCase() + turma.period.slice(1)} color={pColor} />
                        )}
                        {turma.year && (
                          <Pill label={turma.year} color={colors.mutedText} />
                        )}
                        {turma.subject && (
                          <Pill label={turma.subject} color={colors.info} />
                        )}
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => handleShowQR(turma)}
                        style={[styles.actionBtn, { backgroundColor: colors.accent + '18' }]}
                        hitSlop={8}
                      >
                        <Ionicons name="qr-code-outline" size={14} color={colors.accent} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(turma)}
                        style={[styles.actionBtn, { backgroundColor: colors.input }]}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                    <StatChip icon="people" value={String(studentCount)} label="Alunos" color={colors.accent} colors={colors} />
                    <StatChip icon="document-text" value={String(essayCount)} label="Redações" color={colors.info} colors={colors} />
                    <StatChip icon="checkmark-circle" value={String(correctedCount)} label="Corrigidas" color={colors.success} colors={colors} />
                    {avg !== null ? (
                      <StatChip icon="analytics" value={String(avg)} label="Média" color={scoreColor(avg, colors)} colors={colors} />
                    ) : (
                      <StatChip icon="analytics" value="—" label="Média" color={colors.mutedText} colors={colors} />
                    )}
                  </View>

                  {/* Pending alert */}
                  {pending > 0 && (
                    <View style={[styles.pendingRow, { backgroundColor: colors.warning + '14' }]}>
                      <Ionicons name="time-outline" size={13} color={colors.warning} />
                      <Text style={[styles.pendingText, { color: colors.warning }]}>
                        {pending} redaç{pending !== 1 ? 'ões' : 'ão'} aguardando correção
                      </Text>
                    </View>
                  )}

                  {/* Chevron */}
                  <View style={styles.chevronRow}>
                    <Text style={[styles.viewLabel, { color: colors.accent }]}>Ver painel da turma</Text>
                    <Ionicons name="chevron-forward" size={15} color={colors.accent} />
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => router.push('/nova-turma' as any)}
              style={[styles.addMoreBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <Text style={[styles.addMoreText, { color: colors.accent }]}>Adicionar nova turma</Text>
            </Pressable>
          </>
        )}
      </ScreenContainer>

      {/* QR Code Modal */}
      <Modal
        visible={!!qrTurma}
        transparent
        animationType="slide"
        onRequestClose={() => setQrTurmaId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQrTurmaId(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{qrTurma?.name}</Text>
                <Text style={[styles.modalSub, { color: colors.mutedText }]}>
                  Compartilhe com os alunos
                </Text>
              </View>
              <Pressable onPress={() => setQrTurmaId(null)} hitSlop={12}
                style={[styles.closeX, { backgroundColor: colors.input }]}>
                <Ionicons name="close" size={18} color={colors.softText} />
              </Pressable>
            </View>

            {/* QR Code */}
            {qrTurma && buildQRValue(qrTurma) !== '' && (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={buildQRValue(qrTurma)}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
            )}

            {/* Join code — large and prominent */}
            {qrTurma?.joinCode && (
              <View style={[styles.codeBlock, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Text style={[styles.codeBlockLabel, { color: colors.mutedText }]}>
                  Ou use o código:
                </Text>
                <Text style={[styles.codeBlockValue, { color: colors.text }]}>
                  {qrTurma.joinCode}
                </Text>
              </View>
            )}

            {/* Steps */}
            <View style={[styles.stepsRow, { borderTopColor: colors.border }]}>
              <ModalStep n="1" text="Aluno abre o app" colors={colors} />
              <ModalStep n="2" text={`Toca em "Entrar como aluno"`} colors={colors} />
              <ModalStep n="3" text="Escaneia ou digita o código" colors={colors} />
            </View>

            <Pressable
              onPress={() => setQrTurmaId(null)}
              style={[styles.closeBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ProtectedRoute>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '18' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function ModalStep({ n, text, colors }: { n: string; text: string; colors: any }) {
  return (
    <View style={styles.modalStep}>
      <View style={[styles.modalStepNum, { backgroundColor: colors.accent }]}>
        <Text style={styles.modalStepNumText}>{n}</Text>
      </View>
      <Text style={[styles.modalStepText, { color: colors.softText }]}>{text}</Text>
    </View>
  );
}

function StatChip({ icon, value, label, color, colors }: {
  icon: any; value: string; label: string; color: string; colors: any;
}) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', letterSpacing: 0 },
  pageSub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#09090B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  classIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { fontSize: 18, fontWeight: '700', letterSpacing: 0, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeX: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 13, marginTop: 2 },
  qrWrapper: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  codeBlock: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    alignItems: 'center', gap: 4,
  },
  codeBlockLabel: { fontSize: 12, fontWeight: '600' },
  codeBlockValue: { fontSize: 30, fontWeight: '800', letterSpacing: 8 },
  stepsRow: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  modalStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalStepNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalStepNumText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  modalStepText: { flex: 1, fontSize: 12, lineHeight: 18 },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 14 },
  statChip: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  statLabel: { fontSize: 10, fontWeight: '500' },

  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pendingText: { fontSize: 12, fontWeight: '600' },

  chevronRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewLabel: { fontSize: 13, fontWeight: '600' },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  addMoreText: { fontSize: 14, fontWeight: '600' },

  emptyCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
