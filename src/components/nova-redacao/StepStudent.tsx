import { Button, SelectedChip } from '@/components/ui';
import type { AppColors } from '@/theme';
import { Student, Turma } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  teacherStudents: Student[];
  filteredStudents: Student[];
  myTurmas: Turma[];
  filterTurmaId: string;
  setFilterTurmaId: (id: string) => void;
  selectedStudent: Student | undefined;
  stepsDone: boolean[];
  colors: AppColors;
};

export function StepStudent({
  selectedStudentId, setSelectedStudentId,
  teacherStudents, filteredStudents,
  myTurmas, filterTurmaId, setFilterTurmaId,
  selectedStudent, stepsDone, colors,
}: Props) {
  if (stepsDone[0] && selectedStudent) {
    return (
      <SelectedChip
        label={`${selectedStudent.name} · ${selectedStudent.className}`}
        onClear={() => setSelectedStudentId('')}
        colors={colors}
      />
    );
  }

  if (teacherStudents.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyMsg, { color: colors.mutedText }]}>Nenhum aluno cadastrado ainda.</Text>
        <Button title="Cadastrar aluno" leftIcon="add-outline" onPress={() => router.push('/novo-aluno')} size="sm" />
      </View>
    );
  }

  return (
    <>
      {/* Filtro por turma */}
      {myTurmas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.turmaFilterRow} style={{ flexGrow: 0, marginBottom: 10 }}>
          <Pressable
            onPress={() => setFilterTurmaId('')}
            style={[styles.turmaFilterChip, !filterTurmaId
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : { backgroundColor: colors.input, borderColor: colors.border }]}
          >
            <Text style={[styles.turmaFilterText, { color: !filterTurmaId ? '#fff' : colors.softText }]}>Todos</Text>
          </Pressable>
          {myTurmas.map((t) => {
            const active = filterTurmaId === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setFilterTurmaId(active ? '' : t.id)}
                style={[styles.turmaFilterChip, active
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: colors.input, borderColor: colors.border }]}
              >
                <Ionicons name="school-outline" size={11} color={active ? '#fff' : colors.mutedText} />
                <Text style={[styles.turmaFilterText, { color: active ? '#fff' : colors.softText }]}>{t.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {filteredStudents.map((s) => {
          const initials = s.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
          const isSelected = selectedStudentId === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSelectedStudentId(s.id)}
              style={[
                styles.studentCard,
                {
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accent + '0E' : colors.input,
                },
              ]}
            >
              <View style={[styles.studentAvatar, { backgroundColor: isSelected ? colors.accent : colors.mutedText + '30' }]}>
                <Text style={[styles.studentInitials, { color: isSelected ? '#fff' : colors.softText }]}>{initials}</Text>
              </View>
              <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={2}>{s.name}</Text>
              <Text style={[styles.studentClass, { color: colors.mutedText }]} numberOfLines={1}>{s.className}</Text>
            </Pressable>
          );
        })}
        {filteredStudents.length === 0 && (
          <View style={[styles.noStudentHint, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Text style={[styles.noStudentText, { color: colors.mutedText }]}>Nenhum aluno nesta turma.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { gap: 12 },
  emptyMsg: { fontSize: 13, lineHeight: 18 },
  turmaFilterRow: { flexDirection: 'row', gap: 7, paddingVertical: 2 },
  turmaFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5,
  },
  turmaFilterText: { fontSize: 12, fontWeight: '600' },
  noStudentHint: {
    width: 160, borderRadius: 12, borderWidth: 1.5, padding: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  noStudentText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  hList: { gap: 10, paddingVertical: 2, paddingRight: 4 },
  studentCard: { width: 120, borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 6, alignItems: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  studentInitials: { fontSize: 15, fontWeight: '700' },
  studentName: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  studentClass: { fontSize: 11, textAlign: 'center', lineHeight: 14 },
});
