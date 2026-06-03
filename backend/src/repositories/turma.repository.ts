import db from '../services/database.js';

interface TurmaRow {
  joinCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  turmaId: string;
  turmaName: string;
  createdAt: string;
}

interface UpsertTurmaParams {
  joinCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  turmaId: string;
  turmaName: string;
}

export function upsertTurmaRow({ joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName }: UpsertTurmaParams): void {
  db.prepare(`
    INSERT OR REPLACE INTO turmas (joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName);
}

export function findTurmaByCode(joinCode: string): TurmaRow | null {
  return (db.prepare('SELECT * FROM turmas WHERE joinCode = ?').get(joinCode) as TurmaRow | undefined) ?? null;
}

export function deleteTurmasByTeacher(teacherId: string): void {
  db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
}
