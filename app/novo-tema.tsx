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
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

const newThemeSchema = z.object({
  title: z.string().min(1, 'Informe o título do tema'),
  category: z.string().min(1, 'Informe a categoria do tema'),
});

type NewThemeFormData = z.infer<typeof newThemeSchema>;

export default function NovoTemaScreen() {
  const { selectForStudentId } = useLocalSearchParams<{ selectForStudentId?: string }>();
  const addTheme = useAppStore((state) => state.addTheme);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewThemeFormData>({
    resolver: zodResolver(newThemeSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      category: '',
    },
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

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="NOVO TEMA"
          title="Cadastrar tema"
          subtitle="Crie um novo tema e depois continue o fluxo da redação."
        />

        <Card>
          <View style={styles.form}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="TÍTULO DO TEMA"
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
                  label="CATEGORIA"
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
  form: {
    gap: theme.spacing.lg,
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
});