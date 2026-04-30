import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateCorrectionPayload } from './openai.routes.js';

describe('validateCorrectionPayload', () => {
  it('requires a theme title', () => {
    const result = validateCorrectionPayload({ imageBase64: 'abc', mimeType: 'image/jpeg' });
    assert.deepEqual(result.error, ['MISSING_THEME', 'Informe o tema da redação.']);
  });

  it('requires image or typed text', () => {
    const result = validateCorrectionPayload({ themeTitle: 'Tema Livre' });
    assert.equal(result.error?.[0], 'MISSING_CONTENT');
  });

  it('accepts typed essays without mime type', () => {
    const result = validateCorrectionPayload({ themeTitle: 'Tema Livre', essayText: 'Texto da redação.' });
    assert.equal(result.data?.themeTitle, 'Tema Livre');
    assert.equal(result.data?.essayText, 'Texto da redação.');
    assert.equal(result.data?.mimeType, undefined);
  });

  it('rejects unsupported image types', () => {
    const result = validateCorrectionPayload({
      themeTitle: 'Tema Livre',
      imageBase64: 'abc',
      mimeType: 'application/pdf',
    });
    assert.equal(result.error?.[0], 'UNSUPPORTED_MIME_TYPE');
  });
});
