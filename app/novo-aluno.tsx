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
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

const newStudentSchema = z.object({
  name: z.string().min(1, 'Informe o nome do aluno'),
  className: z.string().min(1, 'Informe a turma'),
});

type NewStudentFormData = z.infer<typeof newStudentSchema>;

export default function NovoAlunoScreen() {
  const addStudent = useAppStore((state) => state.addStudent);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewStudentFormData>({
    resolver: zodResolver(newStudentSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      className: '',
    },
  });

  const onSubmit = async (data: NewStudentFormData) => {
    addStudent(data);
    router.replace('/alunos');
  };

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Novo aluno"
          title="Cadastrar aluno"
          subtitle="Primeiro o professor cadastra o aluno. Depois vincula a redação a ele."
        />

        <Card>
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nome do aluno"
                  placeholder="Ex.: Ana Clara Souza"
                  leftIcon="person-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorText={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="className"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Turma"
                  placeholder="Ex.: 3º Informática A"
                  leftIcon="school-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorText={errors.className?.message}
                />
              )}
            />

            <View style={styles.actions}>
              <Button
                title="Salvar aluno"
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