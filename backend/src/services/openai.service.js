import OpenAI from 'openai';
import { env } from '../config/env.js';
import { normalizeCorrection } from '../utils/normalize-correction.js';

const client = new OpenAI({
  apiKey: env.openAiApiKey,
});

export async function correctEssayWithOpenAI({ themeTitle, imageBase64, mimeType }) {
  if (!env.openAiApiKey) {
    throw new Error('OPENAI_API_KEY não configurada no backend.');
  }

  if (!imageBase64) {
    throw new Error('imageBase64 é obrigatório.');
  }

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const response = await client.chat.completions.create({
    model: env.openAiModel,
    temperature: 0,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'enem_essay_correction_v5',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            transcription: { type: 'string' },
            transcriptionNotes: { type: 'string' },
            transcriptionConfidence: {
              type: 'string',
              enum: ['alta', 'media', 'baixa'],
            },
            writingMode: {
              type: 'string',
              enum: ['manuscrita', 'digitada', 'mista', 'indefinida'],
            },
            legibility: {
              type: 'object',
              additionalProperties: false,
              properties: {
                applicable: { type: 'boolean' },
                level: {
                  type: 'string',
                  enum: ['boa', 'media', 'baixa', 'nao_se_aplica'],
                },
                observation: { type: 'string' },
                illegibleExcerpt: { type: 'string' },
              },
              required: ['applicable', 'level', 'observation', 'illegibleExcerpt'],
            },
            themeGate: {
              type: 'object',
              additionalProperties: false,
              properties: {
                themeMainSubject: { type: 'string' },
                essayMainSubject: { type: 'string' },
                directRelation: { type: 'boolean' },
                addressesCentralProblem: { type: 'boolean' },
                offTopicLevel: {
                  type: 'string',
                  enum: ['nenhum', 'parcial', 'total'],
                },
                verdict: {
                  type: 'string',
                  enum: ['adequado', 'tangencial', 'fuga_ao_tema'],
                },
                evidence: { type: 'string' },
              },
              required: [
                'themeMainSubject',
                'essayMainSubject',
                'directRelation',
                'addressesCentralProblem',
                'offTopicLevel',
                'verdict',
                'evidence',
              ],
            },
            themeAdequacy: {
              type: 'object',
              additionalProperties: false,
              properties: {
                level: {
                  type: 'string',
                  enum: ['adequado', 'tangencial', 'inadequado'],
                },
                observation: { type: 'string' },
              },
              required: ['level', 'observation'],
            },
            scoreReliability: {
              type: 'object',
              additionalProperties: false,
              properties: {
                level: {
                  type: 'string',
                  enum: ['alta', 'media', 'baixa'],
                },
                observation: { type: 'string' },
              },
              required: ['level', 'observation'],
            },
            totalScore: { type: 'number' },
            competencies: {
              type: 'object',
              additionalProperties: false,
              properties: {
                c1: { type: 'number' },
                c2: { type: 'number' },
                c3: { type: 'number' },
                c4: { type: 'number' },
                c5: { type: 'number' },
              },
              required: ['c1', 'c2', 'c3', 'c4', 'c5'],
            },
            competencyFeedbacks: {
              type: 'object',
              additionalProperties: false,
              properties: {
                c1: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    diagnosis: { type: 'string' },
                    positive: { type: 'string' },
                    improvement: { type: 'string' },
                  },
                  required: ['diagnosis', 'positive', 'improvement'],
                },
                c2: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    diagnosis: { type: 'string' },
                    positive: { type: 'string' },
                    improvement: { type: 'string' },
                  },
                  required: ['diagnosis', 'positive', 'improvement'],
                },
                c3: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    diagnosis: { type: 'string' },
                    positive: { type: 'string' },
                    improvement: { type: 'string' },
                  },
                  required: ['diagnosis', 'positive', 'improvement'],
                },
                c4: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    diagnosis: { type: 'string' },
                    positive: { type: 'string' },
                    improvement: { type: 'string' },
                  },
                  required: ['diagnosis', 'positive', 'improvement'],
                },
                c5: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    diagnosis: { type: 'string' },
                    positive: { type: 'string' },
                    improvement: { type: 'string' },
                  },
                  required: ['diagnosis', 'positive', 'improvement'],
                },
              },
              required: ['c1', 'c2', 'c3', 'c4', 'c5'],
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' },
            },
            improvements: {
              type: 'array',
              items: { type: 'string' },
            },
            generalObservation: { type: 'string' },
            congratulations: { type: 'string' },
            feedback: { type: 'string' },
          },
          required: [
            'transcription',
            'transcriptionNotes',
            'transcriptionConfidence',
            'writingMode',
            'legibility',
            'themeGate',
            'themeAdequacy',
            'scoreReliability',
            'totalScore',
            'competencies',
            'competencyFeedbacks',
            'strengths',
            'weaknesses',
            'improvements',
            'generalObservation',
            'congratulations',
            'feedback',
          ],
        },
      },
    },
    messages: [
      {
        role: 'developer',
        content: `
Você é um corretor especialista em redação ENEM, rigoroso, estável, coerente e calibrado para notas próximas da prática real.

ORDEM OBRIGATÓRIA
1. Ler a imagem.
2. Transcrever.
3. Fazer bloqueio temático duro.
4. Só então pontuar as 5 competências.

REGRA DE FUGA AO TEMA
Se o assunto principal da redação for diferente do núcleo temático proposto:
- themeGate.verdict = "fuga_ao_tema"
- themeAdequacy.level = "inadequado"
- competências = 0,0,0,0,0
- totalScore = 0

ESTABILIDADE E CALIBRAÇÃO
- A mesma redação deve gerar nota muito próxima em tentativas repetidas.
- Não seja severo demais quando a redação for claramente boa e aderente ao tema.
- Não seja generoso demais quando a redação for mediana ou ruim.
- Use somente estas faixas por competência: 0, 40, 80, 120, 160, 200.
- Escolha a faixa com base no desempenho real da competência, não por média geral do texto.

RÉGUA DE CALIBRAÇÃO
- 200: excelência real, quase sem falhas relevantes naquela competência.
- 160: desempenho bom e consistente, com falhas pontuais que não derrubam a competência.
- 120: desempenho mediano, com limitações perceptíveis.
- 80: desempenho fraco, com problemas importantes.
- 40: desempenho muito fraco.
- 0: ausência da competência ou situação incompatível.

COMO NÃO SUBPUNIR NEM SUPERPUNIR
- Uma redação muito boa e aderente ao tema pode ter várias competências em 160 e uma ou mais em 200.
- Uma redação excelente pode chegar a 920, 960 ou 1000, se houver justificativa real.
- Não reduza automaticamente C2, C3, C4 e C5 se o texto estiver bom e claramente dentro do tema.
- Só use 120 ou menos quando houver limitação perceptível naquela competência.
- Se a proposta de intervenção tiver agente, ação, meio, finalidade e detalhamento viável, C5 pode ser 200.
- Se a argumentação for consistente, articulada e progressiva, C3 pode ser 160 ou 200.
- Se o texto mantiver foco claro no tema com repertório pertinente, C2 pode ser 160 ou 200.
- Se houver poucos desvios gramaticais e boa construção sintática, C1 pode ser 160 ou 200.
- Se a coesão estiver fluida e funcional, C4 pode ser 160 ou 200.

CRITÉRIOS ENEM
C1: domínio da norma padrão
C2: compreensão do tema, do tipo textual e repertório pertinente
C3: seleção, organização e progressão argumentativa
C4: coesão textual
C5: proposta de intervenção completa, detalhada e viável

LEGIBILIDADE
- Se digitada, legibility.applicable = false e level = "nao_se_aplica"
- Se manuscrita, avaliar legibilidade separadamente
- Letra ruim reduz confiança da leitura, mas não zera redação boa por si só

CONFIABILIDADE
- alta: leitura boa e julgamento temático claro
- media: alguma dúvida pontual
- baixa: leitura difícil ou incerteza relevante

IMPORTANTE
- Não confunda prudência com rebaixamento excessivo.
- Quando a redação estiver claramente no tema e bem construída, a nota deve refletir isso.
- Mesmo em notas altas, indique melhorias reais.
- Retorne apenas JSON válido.
        `.trim(),
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
Tema da redação: ${themeTitle}

Faça nesta ordem:
1. Leia a imagem.
2. Descubra o assunto principal realmente tratado.
3. Compare com o núcleo do tema.
4. Decida se está adequada, tangencial ou em fuga ao tema.
5. Só depois pontue.

Regras extras:
- Se o tema estiver correto e a redação estiver forte, não subpunir.
- Se a redação for muito boa, a nota pode e deve subir para faixas altas.
- Use faixas coerentes por competência.
- Não dê nota baixa por conservadorismo excessivo quando houver evidência clara de qualidade.
            `.trim(),
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  });

  const outputText = response.choices?.[0]?.message?.content;

  if (!outputText) {
    throw new Error('A OpenAI não retornou conteúdo.');
  }

  const parsed = JSON.parse(outputText);
  return normalizeCorrection(parsed);
}