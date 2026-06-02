const { by, element, expect, device, waitFor } = require('detox');

// These tests assume the teacher is already logged in (run after teacher-login.e2e.js
// or use a pre-seeded app state via launchApp({ userNotification, url, etc. }))

describe('Essay correction flow', () => {
  beforeAll(async () => {
    // Launch with pre-seeded auth state to skip login
    await device.launchApp({
      newInstance: true,
      launchArgs: { E2E_PRESET_AUTH: '1' },
    });
    await waitFor(element(by.id('redacoes-screen'))).toBeVisible().withTimeout(10_000);
  });

  it('should show empty state when no essays exist', async () => {
    await expect(element(by.id('empty-essays-message'))).toBeVisible();
  });

  it('should open the new essay screen on FAB tap', async () => {
    await element(by.id('new-essay-fab')).tap();
    await expect(element(by.id('nova-redacao-screen'))).toBeVisible();
  });

  it('should require theme before submitting', async () => {
    await element(by.id('new-essay-fab')).tap();
    await element(by.id('corrigir-button')).tap();
    await expect(element(by.text('Informe o tema da redação'))).toBeVisible();
  });

  it('should create a text essay and show processing status', async () => {
    await element(by.id('new-essay-fab')).tap();

    // Fill theme
    await element(by.id('theme-input')).typeText('Inteligência Artificial na Educação');

    // Switch to text mode
    await element(by.id('input-mode-digitada')).tap();
    await element(by.id('essay-text-input')).typeText(
      'A inteligência artificial tem transformado profundamente a educação brasileira...' +
      ' '.repeat(20) // pad to avoid "too short" validation
    );

    // Start correction
    await element(by.id('corrigir-button')).tap();

    // Should show processing state
    await waitFor(element(by.id('essay-status-processando')))
      .toBeVisible()
      .withTimeout(5_000);
  });

  it('should navigate to result screen after correction completes', async () => {
    // This test requires a real AI call — run against a dev backend with mocked OpenAI
    // or use a pre-corrected essay seeded in app state
    await waitFor(element(by.id('essay-status-corrigida')))
      .toBeVisible()
      .withTimeout(60_000); // AI correction can take up to 30s

    await element(by.id('essay-status-corrigida')).tap();
    await expect(element(by.id('resultado-screen'))).toBeVisible();
    await expect(element(by.id('nota-total'))).toBeVisible();
  });

  it('should show competency breakdown on result screen', async () => {
    // Assumes we're on the resultado-screen from the previous test
    await expect(element(by.id('competencia-c1'))).toBeVisible();
    await expect(element(by.id('competencia-c2'))).toBeVisible();
    await expect(element(by.id('competencia-c3'))).toBeVisible();
    await expect(element(by.id('competencia-c4'))).toBeVisible();
    await expect(element(by.id('competencia-c5'))).toBeVisible();
  });

  it('should allow teacher to add manual score and note', async () => {
    await element(by.id('teacher-score-input')).clearText();
    await element(by.id('teacher-score-input')).typeText('850');
    await element(by.id('teacher-note-input')).typeText('Boa argumentação. Trabalhar a proposta de intervenção.');
    await element(by.id('save-teacher-eval-button')).tap();
    await expect(element(by.text('Avaliação salva'))).toBeVisible();
  });
});
