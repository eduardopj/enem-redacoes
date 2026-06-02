/**
 * Feature flags — controlam funcionalidades sem novo deploy.
 * Padrão: EXPO_PUBLIC_FLAG_<NAME>=false desativa; =true ativa flags opcionais.
 * Flags "on by default" precisam de explícito =false para desativar.
 */

export interface FeatureFlags {
  /** Exibe ranking de alunos por turma */
  enableRanking: boolean;
  /** Permite alunos se registrarem via QR code da turma */
  enableStudentRegistration: boolean;
  /** Exibe botão de compartilhar resultado da redação */
  enableShareResult: boolean;
  /** Habilita push notifications (onboarding de token) */
  enablePushNotifications: boolean;
  /** Modo de correção em lote (não lançado) */
  enableBatchCorrection: boolean;
  /** Exibe leaderboard global entre turmas */
  enableGlobalLeaderboard: boolean;
}

const bool = (key: string, defaultOn: boolean): boolean => {
  const val = process.env[key];
  if (val === undefined) return defaultOn;
  return val !== 'false' && val !== '0';
};

export const flags: FeatureFlags = {
  enableRanking:             bool('EXPO_PUBLIC_FLAG_RANKING', true),
  enableStudentRegistration: bool('EXPO_PUBLIC_FLAG_STUDENT_REGISTRATION', true),
  enableShareResult:         bool('EXPO_PUBLIC_FLAG_SHARE_RESULT', true),
  enablePushNotifications:   bool('EXPO_PUBLIC_FLAG_PUSH_NOTIFICATIONS', true),
  enableBatchCorrection:     bool('EXPO_PUBLIC_FLAG_BATCH_CORRECTION', false),
  enableGlobalLeaderboard:   bool('EXPO_PUBLIC_FLAG_GLOBAL_LEADERBOARD', false),
};
