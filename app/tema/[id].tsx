import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TemaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const themes = useAppStore((state) => state.themes);

  const themeItem = useMemo(() => themes.find((item) => item.id === id), [themes, id]);

  if (!themeItem) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <AppHeader title="Tema" subtitle="Tema não encontrado." />
          <Card>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Tema não encontrado.</Text>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="TEMA"
          title="Detalhe do tema"
          subtitle="Use este tema nas novas correções."
        />

        <Card>
          <View style={styles.infoGroup}>
            <InfoRow label="TÍTULO" value={themeItem.title} colors={colors} />
            <InfoRow label="CATEGORIA" value={themeItem.category} colors={colors} />
          </View>
        </Card>

        <Button
          title="Usar este tema"
          leftIcon="arrow-forward-outline"
          onPress={() => router.push('/nova-redacao')}
        />
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoGroup: { gap: theme.spacing.md },
  row: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  label: { ...theme.typography.monoLabel },
  value: { ...theme.typography.title },
  emptyText: { ...theme.typography.body },
});
