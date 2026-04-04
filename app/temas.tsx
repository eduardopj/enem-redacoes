import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  EmptyState,
  ScreenContainer,
  StaggerItem,
  ThemeCard,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function TemasScreen() {
  const { selectForStudentId } = useLocalSearchParams<{ selectForStudentId?: string }>();
  const allThemes = useAppStore((state) => state.themes);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const deleteTheme = useAppStore((state) => state.deleteTheme);
  const { colors } = useAppTheme();

  const [search, setSearch] = useState('');

  const orderedThemes = useMemo(() => {
    if (!currentTeacher) return [];
    return [...allThemes]
      .filter((t) => t.teacherId === currentTeacher.id)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allThemes, currentTeacher]);

  const filteredThemes = useMemo(() => {
    if (!search.trim()) return orderedThemes;
    const q = search.trim().toLowerCase();
    return orderedThemes.filter(
      (t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [orderedThemes, search]);

  const isSelectionMode = !!selectForStudentId;
  const hasThemes = orderedThemes.length > 0;

  const handleOpenTheme = (themeId: string) => {
    if (selectForStudentId) {
      router.push(`/nova-redacao?studentId=${selectForStudentId}&themeId=${themeId}`);
      return;
    }
    router.push(`/tema/${themeId}`);
  };

  const handleDelete = (themeId: string, themeTitle: string) => {
    Alert.alert(
      'Excluir tema',
      `Deseja realmente excluir o tema "${themeTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteTheme(themeId) },
      ]
    );
  };

  const handleCreateTheme = () => {
    if (isSelectionMode) {
      router.push(`/novo-tema?selectForStudentId=${selectForStudentId}`);
      return;
    }
    router.push('/novo-tema');
  };

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="TEMAS"
          title={isSelectionMode ? 'Escolher tema da redação' : 'Biblioteca de temas'}
          subtitle={
            isSelectionMode
              ? 'Escolha um tema para continuar o cadastro da redação deste aluno.'
              : 'Abra, use e gerencie seus temas.'
          }
        />

        {hasThemes ? (
          <Button
            title="Cadastrar novo tema"
            leftIcon="add-outline"
            onPress={handleCreateTheme}
          />
        ) : null}

        {!hasThemes ? (
          <EmptyState
            icon="book-outline"
            title="Nenhum tema disponível"
            description="Cadastre um tema para começar a usar nas redações."
            buttonLabel="Cadastrar tema"
            onPress={handleCreateTheme}
          />
        ) : (
          <>
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por título ou categoria..."
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
              data={filteredThemes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
              renderItem={({ item: themeItem, index }) => (
                <StaggerItem index={index}>
                  <ThemeCard
                    title={themeItem.title}
                    category={themeItem.category}
                    onPress={() => handleOpenTheme(themeItem.id)}
                    onDelete={() => handleDelete(themeItem.id, themeItem.title)}
                  />
                </StaggerItem>
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="search-outline"
                  title="Nenhum tema encontrado"
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
    borderWidth: 1,
    borderRadius: theme.radius.md,
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
