import { Essay, Student, Teacher, ThemeItem } from '@/types/app';

export const mockTeacher: Teacher = {
  id: 'teacher-1',
  name: 'Professor Eduardo',
  email: 'professor@escola.edu.br',
};

export const mockStudents: Student[] = [
  { id: '1', teacherId: 'teacher-1', name: 'Ana Clara Souza', className: '3º Informática A' },
  { id: '2', teacherId: 'teacher-1', name: 'João Pedro Lima', className: '3º Informática A' },
  { id: '3', teacherId: 'teacher-1', name: 'Maria Eduarda Alves', className: '3º Informática B' },
];

export const mockThemes: ThemeItem[] = [
  { id: '1', title: 'Desafios da inclusão digital no Brasil', category: 'Tecnologia e Sociedade' },
  { id: '2', title: 'O impacto da desinformação na vida em sociedade', category: 'Cidadania' },
  { id: '3', title: 'Caminhos para fortalecer a leitura entre jovens', category: 'Educação' },
];

export const mockEssays: Essay[] = [
  {
    id: '1',
    teacherId: 'teacher-1',
    studentId: '1',
    themeTitle: 'Desafios da inclusão digital no Brasil',
    imageName: 'redacao_ana.jpg',
    status: 'corrigida',
    totalScore: 920,
    createdAt: '2025-03-10T10:00:00.000Z',
    correctedAt: '2025-03-10T10:05:00.000Z',
  },
  {
    id: '2',
    teacherId: 'teacher-1',
    studentId: '2',
    themeTitle: 'O impacto da desinformação na vida em sociedade',
    status: 'processando',
    createdAt: '2025-03-15T14:00:00.000Z',
  },
  {
    id: '3',
    teacherId: 'teacher-1',
    studentId: '3',
    themeTitle: 'Caminhos para fortalecer a leitura entre jovens',
    status: 'pendente',
    createdAt: '2025-03-20T09:00:00.000Z',
  },
];