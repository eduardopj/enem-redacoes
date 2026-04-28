import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH_DIR = path.join(__dirname, '..', '..', 'research');
const IMAGES_DIR = path.join(RESEARCH_DIR, 'images');
const NDJSON_PATH = path.join(RESEARCH_DIR, 'essays.ndjson');

function ensureDirs() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

export async function saveEssayRecord({ themeTitle, className, state, correction, imageBase64, mimeType }) {
  ensureDirs();

  const id = crypto.randomUUID();
  const ts = new Date().toISOString();

  let imagePath = null;
  if (imageBase64) {
    const ext = (mimeType || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const filename = `${Date.now()}-${id.slice(0, 8)}.${ext}`;
    imagePath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));
  }

  const record = {
    id,
    savedAt: ts,
    themeTitle: themeTitle ?? null,
    className: className ?? null,
    state: state ?? null,
    imagePath: imagePath ? path.relative(RESEARCH_DIR, imagePath) : null,
    totalScore: correction?.totalScore ?? null,
    competencies: correction?.competencies ?? null,
    themeAdequacy: correction?.themeAdequacy?.level ?? null,
    transcriptionConfidence: correction?.transcriptionConfidence ?? null,
    writingMode: correction?.writingMode ?? null,
    scoreReliability: correction?.scoreReliability?.level ?? null,
  };

  fs.appendFileSync(NDJSON_PATH, JSON.stringify(record) + '\n', 'utf8');

  console.log(`[research] Essay salvo: ${id} | Nota: ${record.totalScore} | Turma: ${className}`);
  return id;
}
