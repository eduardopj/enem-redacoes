import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3333),
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
};

if (!env.openAiApiKey) {
  console.warn('OPENAI_API_KEY não encontrada no backend/.env');
}