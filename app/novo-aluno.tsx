import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, Input, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NovoAlunoScreen() {
  const { colors } = useAppTheme();
  const { turmaId: queryTurmaId } = useLocalSearchParams<{ turmaId?: string }>();
  const addStudent = useAppStore((s) => s.addStudent);
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const turmas = useAppStore((s) => s.turmas);

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const [name, setName] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(queryTurmaId ?? '');
  const [manualClass, setManualClass] = useState('');
  const [nameError, setNameError] = useState('');
  const [classError, setClassError] = useState('');

  const selectedTurma = useMemo(
    () => myTurmas.find((t) => t.id === selectedTurmaId),
    [myTurmas, selectedTurmaId]
  );

  function handleSave() {
    let valid = true;
    if (!name.trim()) { setNameError('Informe o nome do aluno.'); valid = false; }
    if (!selectedTurmaId && !manualClass.trim()) { setClassError('Selecione ou informe a turma.'); valid = false; }
    if (!valid) return;

    addStudent({
      name: name.trim(),
      turmaId: selectedTurmaId || undefined,
      className: selectedTurmaId ? (selectedTurma?.name ?? '') : manualClass.trim(),
    });

    if (selectedTurmaId) {
      router.replace(`/turma/${selectedTurmaId}` as any);
    } else {
      router.replace('/alunos');
    }
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Novo aluno"
          title="Cadastrar aluno"
          subtitle="Vincule o aluno a uma turma para acompanhamento completo."
        />

        <Card>
          <View style={styles.form}>
            {/* Name */}
            <Input
              label="Nome do aluno"
              placeholder="Ex.: Ana Clara Souza"
              leftIcon="person-outline"
              value={name}
              onChangeText={(t) => { setName(t); setNameError(''); }}
              errorText={nameError}
            />

            {/* Turma selector */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.softText }]}>Turma</Text>

              {myTurmas.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View style={styles.turmaRow}>
                    {myTurmas.map((t) => {
                      const active = selectedTurmaId === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => { setSelectedTurmaId(active ? '' : t.id); setClassError(''); }}
                          style={[
                            styles.turmaChip,
                            active
                              ? { backgroundColor: colors.accent, borderColor: colors.accent }
                              : { backgroundColor: colors.input, borderColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="school-outline"
                            size={13}
                            color={active ? '#fff' : colors.mutedText}
                          />
                          <Text style={[styles.turmaChipText, { color: active ? '#fff' : colors.softText }]}>
                            {t.name}
                            {t.period ? ` · ${t.period}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <View style={[styles.noTurmaHint, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.mutedText} />
                  <Text style={[styles.noTurmaText, { color: colors.mutedText }]}>
                    Nenhuma turma criada. Você pode{' '}
                    <Text
                      style={{ color: colors.accent, fontWeight: '700' }}
                      onPress={() => router.push('/nova-turma' as any)}
                    >
                      criar uma turma
                    </Text>
                    {' '}primeiro ou digitar manualmente abaixo.
                  </Text>
                </View>
              )}

              {/* Manual entry when no turma selected */}
              {!selectedTurmaId && (
                <Input
                  label="Ou digitar nome da turma"
                  placeholder="Ex.: 3º Informática A"
                  leftIcon="create-outline"
                  value={manualClass}
                  onChangeText={(t) => { setManualClass(t); setClassError(''); }}
                  errorText={classError}
                />
              )}

              {selectedTurma && (
                <View style={[styles.selectedHint, { backgroundColor: colors.success + '14' }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                  <Text style={[styles.selectedHintText, { color: colors.success }]}>
                    Vinculado a: {selectedTurma.name}
                    {selectedTurma.period ? ` · ${selectedTurma.period}` : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <Button
                title="Salvar aluno"
                leftIcon="save-outline"
                onPress={handleSave}
              />
            </View>
          </View>
        </Card>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.lg },
  actions: { marginTop: theme.spacing.sm },
  fieldWrap: { gap: 10 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  turmaRow: { flexDirection: 'row', gap: 8 },
  turmaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  turmaChipText: { fontSize: 13, fontWeight: '600' },
  noTurmaHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noTurmaText: { flex: 1, fontSize: 13, lineHeight: 20 },
  selectedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedHintText: { fontSize: 12, fontWeight: '600' },
});
