import { execute, queryOne } from '../services/db-client.js';

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

export async function upsertTurmaRow({
  joinCode,
  teacherId,
  teacherName,
  teacherEmail,
  turmaId,
  turmaName,
}: UpsertTurmaParams): Promise<void> {
  await execute(
    `INSERT INTO turmas (joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(joinCode) DO UPDATE SET
       teacherId    = excluded.teacherId,
       teacherName  = excluded.teacherName,
       teacherEmail = excluded.teacherEmail,
       turmaId      = excluded.turmaId,
       turmaName    = excluded.turmaName`,
    [joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName],
  );
}

export async function findTurmaByCode(joinCode: string): Promise<TurmaRow | null> {
  return queryOne<TurmaRow>('SELECT * FROM turmas WHERE joinCode = ?', [joinCode]);
}

export async function deleteTurmasByTeacher(teacherId: string): Promise<void> {
  await execute('DELETE FROM turmas WHERE teacherId = ?', [teacherId]);
}
