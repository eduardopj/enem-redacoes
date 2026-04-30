import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'utils', 'analytics.ts');
const tempPath = path.join(os.tmpdir(), `analytics-test-${Date.now()}.mjs`);

let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace(/import\s+\{\s*Essay,\s*Student\s*\}\s+from\s+'@\/types\/app';\s*/, '');

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

fs.writeFileSync(tempPath, compiled, 'utf8');
const analytics = await import(pathToFileURL(tempPath).href);

const students = [
  { id: 's1', teacherId: 't1', name: 'Ana', className: '3A' },
  { id: 's2', teacherId: 't1', name: 'Bruno', className: '3A' },
];

const essays = [
  {
    id: 'e1',
    teacherId: 't1',
    studentId: 's1',
    themeTitle: 'Tema Livre',
    status: 'corrigida',
    totalScore: 600,
    correctedAt: '2026-01-01T00:00:00.000Z',
    competencies: { c1: 120, c2: 120, c3: 120, c4: 120, c5: 120 },
  },
  {
    id: 'e2',
    teacherId: 't1',
    studentId: 's1',
    themeTitle: 'Tema Livre',
    status: 'corrigida',
    totalScore: 760,
    correctedAt: '2026-02-01T00:00:00.000Z',
    competencies: { c1: 160, c2: 160, c3: 160, c4: 120, c5: 160 },
  },
  {
    id: 'e3',
    teacherId: 't1',
    studentId: 's2',
    themeTitle: 'Meio ambiente',
    status: 'baixa_confiabilidade',
    totalScore: 480,
    reviewRequired: true,
    correctedAt: '2026-03-01T00:00:00.000Z',
    competencies: { c1: 80, c2: 80, c3: 120, c4: 80, c5: 120 },
  },
  {
    id: 'e4',
    teacherId: 't1',
    studentId: 's2',
    themeTitle: 'Meio ambiente',
    status: 'pendente',
  },
];

assert.equal(analytics.getAverageScore(essays), 613);
assert.equal(analytics.getPendingEssays(essays).length, 1);
assert.equal(analytics.getCorrectedEssays(essays).length, 3);
assert.equal(analytics.getStudentProgress('s1', essays).delta, 160);
assert.equal(analytics.getLowConfidenceCorrections(essays).length, 1);
assert.equal(analytics.getThemePerformance(essays)[0].themeTitle, 'Tema Livre');
assert.equal(analytics.getCorrectionInsights(students, essays).weakestCompetency.key, 'c4');

fs.rmSync(tempPath, { force: true });
console.log('analytics tests passed');
