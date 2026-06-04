import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SectionBlock, StepFile, StepReview, StepStudent, StepTheme } from '@/components/nova-redacao';
import { AppHeader, ScreenContainer, StepIndicator } from '@/components/ui';
import { useNovaRedacaoForm, STEP_LABELS } from '@/hooks/useNovaRedacaoForm';

export default function NovaRedacaoScreen() {
  const {
    colors,
    teacherStudents, filteredStudents, myTurmas, availableThemes,
    selectedStudentId, setSelectedStudentId,
    selectedThemeId, setSelectedThemeId,
    filterTurmaId, setFilterTurmaId,
    selectedStudent, selectedTheme,
    imageUri, imageName, hasFile, clearFile,
    autoCorrect, setAutoCorrect,
    stepsDone, canSubmit,
    handleTakePhoto, handlePickImage, handleSubmit,
  } = useNovaRedacaoForm();

  return (
    <ProtectedRoute>
      <ScreenContainer showBack topBarTitle="Nova Redação">
        <AppHeader
          eyebrow="Nova redação"
          title="Enviar redação"
          subtitle="Siga as etapas abaixo"
        />

        {/* Progresso */}
        <StepIndicator steps={stepsDone} labels={STEP_LABELS} colors={colors} />

        {/* ── ETAPA 1: ALUNO ─────────────────────────────────────────────── */}
        <SectionBlock number="1" label="Aluno" done={stepsDone[0]} colors={colors}>
          <StepStudent
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            teacherStudents={teacherStudents}
            filteredStudents={filteredStudents}
            myTurmas={myTurmas}
            filterTurmaId={filterTurmaId}
            setFilterTurmaId={setFilterTurmaId}
            selectedStudent={selectedStudent}
            stepsDone={stepsDone}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 2: TEMA ──────────────────────────────────────────────── */}
        <SectionBlock number="2" label="Tema" done={stepsDone[1]} locked={!stepsDone[0]} colors={colors}>
          <StepTheme
            selectedThemeId={selectedThemeId}
            setSelectedThemeId={setSelectedThemeId}
            availableThemes={availableThemes}
            selectedTheme={selectedTheme}
            selectedStudentId={selectedStudentId}
            stepsDone={stepsDone}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 3: ARQUIVO ───────────────────────────────────────────── */}
        <SectionBlock number="3" label="Arquivo da redação" done={stepsDone[2]} locked={!stepsDone[1]} colors={colors}>
          <StepFile
            imageUri={imageUri}
            hasFile={hasFile}
            stepsDone={stepsDone}
            onTakePhoto={handleTakePhoto}
            onPickImage={handlePickImage}
            onClearFile={clearFile}
            colors={colors}
          />
        </SectionBlock>

        {/* ── ETAPA 4: REVISAR ───────────────────────────────────────────── */}
        <SectionBlock number="4" label="Revisar e salvar" done={false} locked={!canSubmit} colors={colors}>
          <StepReview
            selectedStudent={selectedStudent}
            selectedTheme={selectedTheme}
            imageUri={imageUri}
            imageName={imageName}
            autoCorrect={autoCorrect}
            setAutoCorrect={setAutoCorrect}
            canSubmit={canSubmit}
            onSubmit={handleSubmit}
            colors={colors}
          />
        </SectionBlock>
      </ScreenContainer>
    </ProtectedRoute>
  );
}
