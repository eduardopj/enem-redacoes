import { SelectedChip } from '@/components/ui';
import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ThemeItem = { id: string; title: string; category?: string };

type Props = {
  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;
  availableThemes: ThemeItem[];
  selectedTheme: ThemeItem | undefined;
  selectedStudentId: string;
  stepsDone: boolean[];
  colors: AppColors;
};

const FREE_THEME_ID = '__tema_livre__';

export function StepTheme({
  selectedThemeId, setSelectedThemeId,
  availableThemes, selectedTheme,
  selectedStudentId, stepsDone, colors,
}: Props) {
  if (!stepsDone[0]) {
    return (
      <View style={styles.lockedHint}>
        <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
        <Text style={[styles.lockedText, { color: colors.mutedText }]}>Selecione um aluno na etapa anterior.</Text>
      </View>
    );
  }

  if (stepsDone[1] && selectedTheme) {
    return (
      <SelectedChip
        label={selectedTheme.title}
        onClear={() => setSelectedThemeId('')}
        colors={colors}
      />
    );
  }

  return (
    <View style={styles.themeList}>
      {/* Tema Livre */}
      <Pressable
        onPress={() => setSelectedThemeId(FREE_THEME_ID)}
        style={[
          styles.themeRow,
          {
            borderColor: selectedThemeId === FREE_THEME_ID ? colors.accent : colors.accent + '40',
            backgroundColor: selectedThemeId === FREE_THEME_ID ? colors.accent + '10' : colors.accent + '06',
          },
        ]}
      >
        <View style={styles.themeInfo}>
          <View style={styles.freeThemeHeader}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
            <Text style={[styles.themeTitle, { color: colors.accent }]}>Tema Livre</Text>
          </View>
          <Text style={[styles.themeCategory, { color: colors.mutedText }]}>
            A IA identifica o tema automaticamente
          </Text>
        </View>
        <View style={[
          styles.themeRadio,
          { borderColor: selectedThemeId === FREE_THEME_ID ? colors.accent : colors.accent + '60' },
          selectedThemeId === FREE_THEME_ID && { backgroundColor: colors.accent },
        ]}>
          {selectedThemeId === FREE_THEME_ID ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </View>
      </Pressable>

      {/* Regular themes */}
      {availableThemes.map((t) => {
        const isSelected = selectedThemeId === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => setSelectedThemeId(t.id)}
            style={[
              styles.themeRow,
              {
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accent + '08' : colors.surface,
              },
            ]}
          >
            <View style={styles.themeInfo}>
              <Text style={[styles.themeTitle, { color: colors.text }]} numberOfLines={2}>{t.title}</Text>
              <Text style={[styles.themeCategory, { color: colors.mutedText }]}>{t.category}</Text>
            </View>
            <View style={[
              styles.themeRadio,
              { borderColor: isSelected ? colors.accent : colors.border },
              isSelected && { backgroundColor: colors.accent },
            ]}>
              {isSelected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
          </Pressable>
        );
      })}

      {/* Add theme inline */}
      <Pressable
        onPress={() => router.push(selectedStudentId ? `/novo-tema?selectForStudentId=${selectedStudentId}` : '/novo-tema')}
        style={[styles.addThemeInline, { borderColor: colors.border, backgroundColor: colors.input }]}
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
        <Text style={[styles.addThemeInlineText, { color: colors.accent }]}>
          Cadastrar outro tema
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedHint: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { fontSize: 13, lineHeight: 18 },
  themeList: { gap: 8 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 14 },
  themeInfo: { flex: 1, gap: 3 },
  freeThemeHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  themeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  themeCategory: { fontSize: 12, lineHeight: 16 },
  themeRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addThemeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 13,
  },
  addThemeInlineText: { fontSize: 13, fontWeight: '700' },
});
