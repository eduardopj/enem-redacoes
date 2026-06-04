import db from '../services/database.js';

export function upsertTurmaRow({ joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName }) {
  db.prepare(`
    INSERT INTO turmas (joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(joinCode) DO UPDATE SET
      teacherId    = excluded.teacherId,
      teacherName  = excluded.teacherName,
      teacherEmail = excluded.teacherEmail,
      turmaId      = excluded.turmaId,
      turmaName    = excluded.turmaName
  `).run(joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName);
}

export function findTurmaByCode(joinCode) {
  return db.prepare('SELECT * FROM turmas WHERE joinCode = ?').get(joinCode) ?? null;
}

export function deleteTurmasByTeacher(teacherId) {
  db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
}
