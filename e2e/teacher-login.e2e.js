const { by, element, expect, device } = require('detox');

describe('Teacher — Login flow', () => {
  const EMAIL = 'professor.teste@escola.com';
  const PASSWORD = 'Senha@123';

  beforeEach(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('should show the login screen on first launch', async () => {
    await expect(element(by.id('login-email-input'))).toBeVisible();
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should show validation error for empty fields', async () => {
    await element(by.id('login-submit-button')).tap();
    await expect(element(by.text('E-mail é obrigatório'))).toBeVisible();
  });

  it('should show error for wrong credentials', async () => {
    await element(by.id('login-email-input')).typeText('nao@existe.com');
    await element(by.id('login-password-input')).typeText('senhaerrada');
    await element(by.id('login-submit-button')).tap();
    // Wait up to 10s for the API call
    await waitFor(element(by.id('login-error-message')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('should navigate to essay list after successful login', async () => {
    await element(by.id('login-email-input')).typeText(EMAIL);
    await element(by.id('login-password-input')).typeText(PASSWORD);
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('redacoes-screen')))
      .toBeVisible()
      .withTimeout(15_000);
  });

  it('should persist session after app restart', async () => {
    // Login
    await element(by.id('login-email-input')).typeText(EMAIL);
    await element(by.id('login-password-input')).typeText(PASSWORD);
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('redacoes-screen'))).toBeVisible().withTimeout(15_000);

    // Background + foreground
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    await waitFor(element(by.id('redacoes-screen'))).toBeVisible().withTimeout(5_000);
  });
});
