export type CompetencyFeedback = {
  diagnosis: string;
  positive: string;
  improvement: string;
};

export type OpenAICorrectionResult = {
  transcription: string;
  transcriptionNotes: string;
  transcriptionConfidence: 'alta' | 'media' | 'baixa';
  writingMode: 'manuscrita' | 'digitada' | 'mista' | 'indefinida';
  legibility: {
    applicable: boolean;
    level: 'boa' | 'media' | 'baixa' | 'nao_se_aplica';
    observation: string;
    illegibleExcerpt: string;
  };
  themeAdequacy: {
    level: 'adequado' | 'tangencial' | 'inadequado';
    observation: string;
  };
  scoreReliability: {
    level: 'alta' | 'media' | 'baixa';
    observation: string;
  };
  totalScore: number;
  competencies: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  competencyFeedbacks: {
    c1: CompetencyFeedback;
    c2: CompetencyFeedback;
    c3: CompetencyFeedback;
    c4: CompetencyFeedback;
    c5: CompetencyFeedback;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  generalObservation: string;
  congratulations: string;
  feedback: string;
  studentDirectMessage: string;
  improvementPotential: string;
  vocabularyAnalysis: {
    frequentWords: string[];
    synonymSuggestions: {
      word: string;
      alternatives: string[];
      context: string;
    }[];
  };
};

export type OpenAIServiceInput = {
  themeTitle: string;
  imageUri: string;
};