/**
 * Central enum definitions — single source of truth for all domain string literals.
 *
 * Uses const objects instead of TypeScript enums for Hermes/React Native compatibility.
 * Pattern: const EssayStatus works as a namespace (EssayStatus.Corrigida) AND
 * the matching `type EssayStatus` keeps full backward-compatibility with existing code.
 */

export const EssayStatus = {
  Pendente: 'pendente',
  Processando: 'processando',
  Corrigida: 'corrigida',
  PrecisaRevisao: 'precisa_revisao',
  BaixaConfiabilidade: 'baixa_confiabilidade',
} as const;
export type EssayStatus = (typeof EssayStatus)[keyof typeof EssayStatus];

export const EssayInputMode = {
  Manuscrita: 'manuscrita',
  Digitada: 'digitada',
  Upload: 'upload',
} as const;
export type EssayInputMode = (typeof EssayInputMode)[keyof typeof EssayInputMode];

export const EssaySourceType = {
  Image: 'image',
  Document: 'document',
} as const;
export type EssaySourceType = (typeof EssaySourceType)[keyof typeof EssaySourceType];

export const ConfidenceLevel = {
  Alta: 'alta',
  Media: 'media',
  Baixa: 'baixa',
} as const;
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const AtividadeStatus = {
  Ativa: 'ativa',
  Encerrada: 'encerrada',
} as const;
export type AtividadeStatus = (typeof AtividadeStatus)[keyof typeof AtividadeStatus];

export const TurmaPeriod = {
  Manha: 'manhã',
  Tarde: 'tarde',
  Noite: 'noite',
  Integral: 'integral',
} as const;
export type TurmaPeriod = (typeof TurmaPeriod)[keyof typeof TurmaPeriod];
