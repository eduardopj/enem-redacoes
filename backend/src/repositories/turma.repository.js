import db from '../services/database.js';

export function upsertTurmaRow({ joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName }) {
  db.prepare(`
    INSERT OR REPLACE INTO turmas (joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName);
}

export function findTurmaByCode(joinCode) {
  return db.prepare('SELECT * FROM turmas WHERE joinCode = ?').get(joinCode) ?? null;
}

export function deleteTurmasByTeacher(teacherId) {
  db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
}
