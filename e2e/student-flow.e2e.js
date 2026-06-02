const { by, element, expect, device, waitFor } = require('detox');

// Tests the student access flow: join turma via QR code, submit essay, view result

describe('Student flow', () => {
  const VALID_JOIN_CODE = 'ABC123'; // must exist in test backend

  beforeEach(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should show student entry option on welcome screen', async () => {
    await expect(element(by.id('entrar-como-aluno-button'))).toBeVisible();
  });

  it('should open join turma screen', async () => {
    await element(by.id('entrar-como-aluno-button')).tap();
    await expect(element(by.id('join-turma-screen'))).toBeVisible();
    await expect(element(by.id('join-code-input'))).toBeVisible();
  });

  it('should show error for invalid join code', async () => {
    await element(by.id('entrar-como-aluno-button')).tap();
    await element(by.id('join-code-input')).typeText('INVALID');
    await element(by.id('join-turma-button')).tap();
    await waitFor(element(by.id('join-code-error')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('should navigate to student info form after valid code', async () => {
    await element(by.id('entrar-como-aluno-button')).tap();
    await element(by.id('join-code-input')).typeText(VALID_JOIN_CODE);
    await element(by.id('join-turma-button')).tap();
    await waitFor(element(by.id('student-info-screen')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('student-name-input'))).toBeVisible();
  });

  it('should reach student essays screen after registration', async () => {
    await element(by.id('entrar-como-aluno-button')).tap();
    await element(by.id('join-code-input')).typeText(VALID_JOIN_CODE);
    await element(by.id('join-turma-button')).tap();
    await waitFor(element(by.id('student-info-screen'))).toBeVisible().withTimeout(10_000);

    await element(by.id('student-name-input')).typeText('Ana Souza');
    await element(by.id('student-confirm-button')).tap();

    await waitFor(element(by.id('student-redacoes-screen')))
      .toBeVisible()
      .withTimeout(5_000);
  });

  it('should allow student to submit an essay for correction', async () => {
    // Assumes student is already registered (pre-seeded state)
    await device.launchApp({
      newInstance: true,
      launchArgs: { E2E_PRESET_STUDENT: '1' },
    });
    await waitFor(element(by.id('student-redacoes-screen'))).toBeVisible().withTimeout(10_000);

    await element(by.id('new-essay-fab')).tap();
    await element(by.id('theme-input')).typeText('Educação Digital no Brasil');
    await element(by.id('input-mode-digitada')).tap();
    await element(by.id('essay-text-input')).typeText(
      'A transformação digital impacta diretamente o acesso à educação no país...'
    );
    await element(by.id('corrigir-button')).tap();

    // Student mode: essay is submitted to the teacher's queue, status shown
    await waitFor(element(by.id('essay-status-processando')))
      .toBeVisible()
      .withTimeout(5_000);
  });

  describe('Rankings', () => {
    beforeAll(async () => {
      await device.launchApp({
        newInstance: true,
        launchArgs: { E2E_PRESET_STUDENT: '1' },
      });
      await waitFor(element(by.id('student-redacoes-screen'))).toBeVisible().withTimeout(10_000);
    });

    it('should show ranking tab', async () => {
      await element(by.id('tab-ranking')).tap();
      await expect(element(by.id('ranking-screen'))).toBeVisible();
    });

    it('should display at least one student in the ranking list', async () => {
      await element(by.id('tab-ranking')).tap();
      await waitFor(element(by.id('ranking-list'))).toBeVisible().withTimeout(5_000);
      await expect(element(by.id('ranking-item-0'))).toBeVisible();
    });
  });
});
