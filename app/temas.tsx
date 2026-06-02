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
import { FlashList } from '@shopify/flash-list';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

const FREE_THEME_ID = '__tema_livre__';

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
      .filter((item) => item.teacherId === currentTeacher.id)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allThemes, currentTeacher]);

  const filteredThemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderedThemes;
    return orderedThemes.filter(
      (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [orderedThemes, search]);

  const isSelectionMode = Boolean(selectForStudentId);
  const hasThemes = orderedThemes.length > 0;

  function handleOpenTheme(themeId: string) {
    if (selectForStudentId) {
      router.push(`/nova-redacao?studentId=${selectForStudentId}&themeId=${themeId}`);
      return;
    }

    if (themeId === FREE_THEME_ID) {
      router.push(`/nova-redacao?themeId=${FREE_THEME_ID}`);
      return;
    }

    router.push(`/tema/${themeId}`);
  }

  function handleCreateTheme() {
    if (isSelectionMode) {
      router.push(`/novo-tema?selectForStudentId=${selectForStudentId}`);
      return;
    }
    router.push('/novo-tema');
  }

  function handleDelete(themeId: string, themeTitle: string) {
    Alert.alert('Excluir tema', `Deseja excluir o tema "${themeTitle}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteTheme(themeId) },
    ]);
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Temas"
          title={isSelectionMode ? 'Escolher tema' : 'Biblioteca de temas'}
          subtitle={
            isSelectionMode
              ? 'Use tema livre ou escolha um tema cadastrado.'
              : 'Tema livre sempre disponível. Cadastre temas para organizar as correções.'
          }
        />

        <ThemeCard
          title="Tema Livre"
          category="A IA identifica o tema automaticamente"
          onPress={() => handleOpenTheme(FREE_THEME_ID)}
        />

        <Button title="Cadastrar novo tema" leftIcon="add-outline" onPress={handleCreateTheme} />

        {!hasThemes ? (
          <EmptyState
            icon="book-outline"
            title="Nenhum tema cadastrado"
            description="Você já pode usar Tema Livre. Cadastre temas quando quiser comparar desempenho por proposta."
            buttonLabel="Cadastrar tema"
            onPress={handleCreateTheme}
          />
        ) : (
          <>
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por título ou eixo..."
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

            <FlashList
              data={filteredThemes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              estimatedItemSize={72}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <StaggerItem index={index}>
                  <ThemeCard
                    title={item.title}
                    category={item.category}
                    onPress={() => handleOpenTheme(item.id)}
                    onDelete={() => handleDelete(item.id, item.title)}
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
