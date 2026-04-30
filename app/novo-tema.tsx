import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  Card,
  Input,
  ScreenContainer,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

// ─── Temas reais do ENEM ─────────────────────────────────────────────────────

const ENEM_THEMES = [
  { year: '2024', title: 'Invisibilidade e registro civil: desafios para a cidadania no Brasil', category: 'Cidadania e Direitos' },
  { year: '2023', title: 'Desafios para o enfrentamento da invisibilidade da violência contra os idosos no Brasil', category: 'Sociedade e Saúde' },
  { year: '2022', title: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', category: 'Diversidade e Cultura' },
  { year: '2021', title: 'Invisibilidade e registro civil: desafios para a cidadania no Brasil', category: 'Cidadania e Direitos' },
  { year: '2020', title: 'O estigma associado às doenças mentais na sociedade brasileira', category: 'Saúde e Sociedade' },
  { year: '2019', title: 'Democratização do acesso ao cinema no Brasil', category: 'Cultura e Educação' },
  { year: '2018', title: 'Manipulação do comportamento do usuário pelo controle de dados na internet', category: 'Tecnologia e Sociedade' },
  { year: '2017', title: 'Desafios para a formação educacional de surdos no Brasil', category: 'Educação e Inclusão' },
  { year: '2016', title: 'Caminhos para combater a intolerância religiosa no Brasil', category: 'Direitos Humanos' },
  { year: '2015', title: 'A persistência da violência contra a mulher na sociedade brasileira', category: 'Direitos Humanos' },
  { year: '2014', title: 'Publicidade infantil em questão no Brasil', category: 'Consumo e Sociedade' },
  { year: '2013', title: 'Efeitos da implantação da Lei Seca no Brasil', category: 'Saúde e Legislação' },
  { year: '2012', title: 'O movimento imigratório para o Brasil no século XXI', category: 'Sociedade e Cultura' },
  { year: '2011', title: 'Viver em rede no século XXI: os limites entre o público e o privado', category: 'Tecnologia e Comportamento' },
  { year: '2010', title: 'O trabalho na construção da dignidade humana', category: 'Trabalho e Sociedade' },
  { year: '2009', title: 'O indivíduo diante da ética nacional e universal', category: 'Filosofia e Ética' },
  { year: '2008', title: 'Como preservar a memória viva das tradições culturais brasileiras?', category: 'Cultura e Identidade' },
  // Temas práticos para exercício
  { year: 'Treino', title: 'O papel da inteligência artificial na educação do futuro', category: 'Tecnologia e Educação' },
  { year: 'Treino', title: 'Desigualdade social e acesso à saúde no Brasil', category: 'Saúde e Sociedade' },
  { year: 'Treino', title: 'A importância da leitura na formação cidadã', category: 'Educação e Cultura' },
  { year: 'Treino', title: 'Fake news e seus impactos na democracia brasileira', category: 'Tecnologia e Política' },
  { year: 'Treino', title: 'Racismo estrutural e seus efeitos na sociedade brasileira', category: 'Direitos Humanos' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const newThemeSchema = z.object({
  title: z.string().min(1, 'Informe o título do tema'),
  category: z.string().min(1, 'Informe a categoria do tema'),
});

type NewThemeFormData = z.infer<typeof newThemeSchema>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NovoTemaScreen() {
  const { selectForStudentId } = useLocalSearchParams<{ selectForStudentId?: string }>();
  const addTheme = useAppStore((state) => state.addTheme);
  const { colors } = useAppTheme();
  const [showPresets, setShowPresets] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewThemeFormData>({
    resolver: zodResolver(newThemeSchema),
    mode: 'onChange',
    defaultValues: { title: '', category: '' },
  });

  const onSubmit = async (data: NewThemeFormData) => {
    const themeId = addTheme(data);
    if (!themeId) return;
    if (selectForStudentId) {
      router.replace(`/nova-redacao?studentId=${selectForStudentId}&themeId=${themeId}`);
      return;
    }
    router.replace('/temas');
  };

  const applyPreset = (t: typeof ENEM_THEMES[0]) => {
    setValue('title', t.title, { shouldValidate: true });
    setValue('category', t.category, { shouldValidate: true });
    setShowPresets(false);
  };

  const yearGroups = ENEM_THEMES.reduce<Record<string, typeof ENEM_THEMES>>((acc, t) => {
    (acc[t.year] = acc[t.year] ?? []).push(t);
    return acc;
  }, {});

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Novo tema"
          title="Cadastrar tema"
          subtitle="Crie um tema personalizado ou use um tema oficial do ENEM."
        />

        {/* ── Preset ENEM themes ─────────────────────────────────────────── */}
        <Pressable
          onPress={() => setShowPresets((v) => !v)}
          style={[styles.presetToggle, {
            backgroundColor: showPresets ? colors.accent : colors.surface,
            borderColor: showPresets ? colors.accent : colors.border,
          }]}
        >
          <View style={[styles.presetToggleIcon, { backgroundColor: showPresets ? 'rgba(255,255,255,0.2)' : colors.accent + '14' }]}>
            <Ionicons name="school" size={16} color={showPresets ? '#fff' : colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.presetToggleTitle, { color: showPresets ? '#fff' : colors.text }]}>
              Temas oficiais do ENEM
            </Text>
            <Text style={[styles.presetToggleSub, { color: showPresets ? 'rgba(255,255,255,0.75)' : colors.mutedText }]}>
              2008–2024 + temas de treino
            </Text>
          </View>
          <Ionicons
            name={showPresets ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={showPresets ? '#fff' : colors.mutedText}
          />
        </Pressable>

        {showPresets && (
          <View style={[styles.presetPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {Object.entries(yearGroups)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([year, themes]) => (
                  <View key={year} style={styles.yearGroup}>
                    <View style={[styles.yearHeader, { backgroundColor: colors.input }]}>
                      <Text style={[styles.yearLabel, { color: colors.accent }]}>
                        {year === 'Treino' ? 'Temas de treino' : `ENEM ${year}`}
                      </Text>
                    </View>
                    {themes.map((t, i) => (
                      <Pressable
                        key={i}
                        onPress={() => applyPreset(t)}
                        style={[styles.presetItem, { borderBottomColor: colors.border }, i < themes.length - 1 && styles.presetItemBorder]}
                      >
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={[styles.presetTitle, { color: colors.text }]} numberOfLines={2}>
                            {t.title}
                          </Text>
                          <View style={[styles.categoryPill, { backgroundColor: colors.accent + '14' }]}>
                            <Text style={[styles.categoryText, { color: colors.accent }]}>{t.category}</Text>
                          </View>
                        </View>
                        <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.accent} />
                      </Pressable>
                    ))}
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <Card>
          <View style={styles.form}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Título do tema"
                  placeholder="Ex.: A importância da leitura na formação cidadã"
                  leftIcon="book-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorText={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Categoria"
                  placeholder="Ex.: Educação e Sociedade"
                  leftIcon="grid-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorText={errors.category?.message}
                />
              )}
            />

            <View style={styles.actions}>
              <Button
                title="Salvar tema"
                leftIcon="save-outline"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={!isValid}
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

  presetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  presetToggleIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  presetToggleTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  presetToggleSub: { fontSize: 12, lineHeight: 16 },

  presetPanel: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  yearGroup: {},
  yearHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  yearLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  presetItemBorder: { borderBottomWidth: 1 },
  presetTitle: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryText: { fontSize: 10, fontWeight: '700' },
});
