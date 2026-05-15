import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { deleteTeacherAccount, forgotPassword, loginTeacher, registerTeacher, resetPassword, revokeToken, savePushToken } from '../services/auth.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { ForgotPasswordSchema, LoginSchema, RegisterTeacherSchema, ResetPasswordSchema } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', validateBody(RegisterTeacherSchema), (req, res) => {
  try {
    const { teacherId, teacherEmail, teacherName, passwordHash } = req.body;
    const token = registerTeacher(teacherId, teacherEmail, teacherName, passwordHash);
    if (token === null) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Senha incorreta.' },
      });
    }
    res.json({ success: true, data: { token } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'REGISTER_ERROR', message: 'Não foi possível registrar o dispositivo.' },
    });
  }
});

router.post('/login', validateBody(LoginSchema), (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    const result = loginTeacher(email, passwordHash);
    if (!result) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' },
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Não foi possível concluir o login.' },
    });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) revokeToken(token);
    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Erro ao encerrar sessão.' },
    });
  }
});

router.post('/push-token', requireAuth, (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'pushToken inválido.' },
      });
    }
    savePushToken(req.teacherId, pushToken);
    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'PUSH_TOKEN_ERROR', message: 'Erro ao salvar push token.' },
    });
  }
});

// ─── Forgot / reset password ─────────────────────────────────────────────────

router.post('/forgot-password', validateBody(ForgotPasswordSchema), async (req, res) => {
  if (!env.smtpHost) {
    return res.status(503).json({
      success: false,
      error: { code: 'EMAIL_NOT_CONFIGURED', message: 'Recuperação de senha por e-mail não está disponível no momento.' },
    });
  }
  try {
    const result = forgotPassword(req.body.email);
    // Always return 200 to prevent e-mail enumeration
    if (result) {
      await sendPasswordResetEmail(result.teacherEmail, result.code).catch((err) => {
        console.error('[auth] failed to send reset email:', err.message);
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FORGOT_PASSWORD_ERROR', message: 'Erro ao processar solicitação.' } });
  }
});

router.post('/reset-password', validateBody(ResetPasswordSchema), (req, res) => {
  try {
    const { email, code, newPasswordHash } = req.body;
    const ok = resetPassword(email, code, newPasswordHash);
    if (!ok) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OR_EXPIRED_CODE', message: 'Código inválido ou expirado.' },
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'RESET_PASSWORD_ERROR', message: 'Erro ao redefinir senha.' } });
  }
});

// ─── GDPR account deletion ────────────────────────────────────────────────────

router.delete('/account', requireAuth, (req, res) => {
  try {
    deleteTeacherAccount(req.teacherId);
    res.json({ success: true });
  } catch (err) {
    console.error('[auth] deleteTeacherAccount error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ACCOUNT_ERROR', message: 'Não foi possível excluir a conta.' },
    });
  }
});

export { router as authRoutes };
