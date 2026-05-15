import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, Input, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NovaAtividadeScreen() {
  const { colors } = useAppTheme();
  const { turmaId: queryTurmaId } = useLocalSearchParams<{ turmaId?: string }>();

  const addAtividade = useAppStore((s) => s.addAtividade);
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const turmas = useAppStore((s) => s.turmas);
  const themes = useAppStore((s) => s.themes);

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const myThemes = useMemo(
    () => themes.filter((t) => t.teacherId === currentTeacher?.id),
    [themes, currentTeacher]
  );

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(queryTurmaId ?? '');
  const [themeTitle, setThemeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [turmaError, setTurmaError] = useState('');
  const [themeError, setThemeError] = useState('');

  const selectedTurma = useMemo(
    () => myTurmas.find((t) => t.id === selectedTurmaId),
    [myTurmas, selectedTurmaId]
  );

  function handleSave() {
    let valid = true;
    if (!selectedTurmaId) { setTurmaError('Selecione uma turma.'); valid = false; }
    if (!themeTitle.trim()) { setThemeError('Informe o tema da atividade.'); valid = false; }
    if (!valid) return;

    const id = addAtividade({
      turmaId: selectedTurmaId,
      themeTitle: themeTitle.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
    });

    if (id) {
      router.replace(`/turma/${selectedTurmaId}` as any);
    }
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack topBarTitle="Nova Atividade">
        <AppHeader
          eyebrow="Nova atividade"
          title="Criar atividade"
          subtitle="A atividade será enviada para todos os alunos da turma."
        />

        <Card>
          <View style={styles.form}>

            {/* Turma */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.softText }]}>Turma</Text>
              {myTurmas.length === 0 ? (
                <View style={[styles.emptyHint, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.softText} />
                  <Text style={[styles.emptyHintText, { color: colors.softText }]}>
                    Nenhuma turma criada.{' '}
                    <Text style={{ color: colors.accent, fontWeight: '700' }} onPress={() => router.push('/nova-turma' as any)}>
                      Criar turma
                    </Text>
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View style={styles.chipRow}>
                    {myTurmas.map((t) => {
                      const active = selectedTurmaId === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => { setSelectedTurmaId(active ? '' : t.id); setTurmaError(''); }}
                          style={[
                            styles.chip,
                            active
                              ? { backgroundColor: colors.accent, borderColor: colors.accent }
                              : { backgroundColor: colors.input, borderColor: colors.border },
                          ]}
                        >
                          <Ionicons name="school-outline" size={13} color={active ? '#fff' : colors.mutedText} />
                          <Text style={[styles.chipText, { color: active ? '#fff' : colors.softText }]}>
                            {t.name}{t.period ? ` · ${t.period}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
              {turmaError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{turmaError}</Text>
              ) : selectedTurma ? (
                <View style={[styles.selectedHint, { backgroundColor: colors.success + '14' }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                  <Text style={[styles.selectedHintText, { color: colors.success }]}>
                    {selectedTurma.name}{selectedTurma.period ? ` · ${selectedTurma.period}` : ''}
                    {' '}selecionada
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Tema */}
            <View style={styles.fieldWrap}>
              <Input
                label="Tema da atividade"
                placeholder="Ex.: Desafios da saúde mental no Brasil"
                leftIcon="book-outline"
                value={themeTitle}
                onChangeText={(t) => { setThemeTitle(t); setThemeError(''); }}
                errorText={themeError}
              />
              {myThemes.length > 0 && (
                <View style={styles.quickThemes}>
                  <Text style={[styles.quickLabel, { color: colors.mutedText }]}>Seus temas cadastrados:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View style={styles.chipRow}>
                      {myThemes.slice(0, 8).map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => { setThemeTitle(t.title); setThemeError(''); }}
                          style={[styles.chip, { backgroundColor: colors.input, borderColor: colors.border }]}
                        >
                          <Text style={[styles.chipText, { color: colors.softText }]} numberOfLines={1}>
                            {t.title}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Descrição opcional */}
            <Input
              label="Descrição (opcional)"
              placeholder="Ex.: Foco em proposta de intervenção, mínimo 30 linhas."
              leftIcon="create-outline"
              value={description}
              onChangeText={setDescription}
            />

            {/* Data de entrega opcional */}
            <Input
              label="Prazo de entrega (opcional)"
              placeholder="Ex.: 15/05/2026"
              leftIcon="calendar-outline"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <Button
              title="Criar atividade"
              leftIcon="checkmark-circle-outline"
              onPress={handleSave}
            />
          </View>
        </Card>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.lg },
  fieldWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  emptyHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  emptyHintText: { flex: 1, fontSize: 13, lineHeight: 20 },
  selectedHint: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  selectedHintText: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 12, fontWeight: '600' },
  quickThemes: { gap: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
});
