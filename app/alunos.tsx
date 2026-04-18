import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  EmptyState,
  ScreenContainer,
  StaggerItem,
  StudentCard,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function AlunosScreen() {
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const deleteStudent = useAppStore((state) => state.deleteStudent);
  const { colors } = useAppTheme();

  const [search, setSearch] = useState('');

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((student) => student.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return teacherStudents;
    const q = search.trim().toLowerCase();
    return teacherStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
    );
  }, [teacherStudents, search]);

  const handleDelete = (studentId: string, studentName: string) => {
    Alert.alert(
      'Excluir aluno',
      `Deseja realmente excluir ${studentName}? As redações vinculadas a este aluno também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteStudent(studentId) },
      ]
    );
  };

  const hasStudents = teacherStudents.length > 0;

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Alunos"
          title="Base de alunos"
          subtitle="Cadastre, visualize e gerencie seus alunos."
        />

        {hasStudents ? (
          <Button
            title="Novo aluno"
            leftIcon="add-outline"
            onPress={() => router.push('/novo-aluno')}
          />
        ) : null}

        {!hasStudents ? (
          <EmptyState
            icon="people-outline"
            title="Nenhum aluno cadastrado"
            description="Antes de cadastrar uma redação, cadastre pelo menos um aluno."
            buttonLabel="Cadastrar aluno"
            onPress={() => router.push('/novo-aluno')}
          />
        ) : (
          <>
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por nome ou turma..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
              renderItem={({ item: student, index }) => (
                <StaggerItem index={index}>
                  <StudentCard
                    name={student.name}
                    className={student.className}
                    onPress={() => router.push(`/aluno/${student.id}`)}
                    onDelete={() => handleDelete(student.id, student.name)}
                  />
                </StaggerItem>
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="search-outline"
                  title="Nenhum aluno encontrado"
                  description={`Nenhum resultado para "${search}".`}
                />
              }
            />
          </>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    paddingVertical: 0,
  },
  list: {
    gap: theme.spacing.md,
  },
});
