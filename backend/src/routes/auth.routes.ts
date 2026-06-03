import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { validateBody } from '../middleware/validate.js';
import { deleteTeacherAccount, forgotPassword, loginTeacher, registerTeacher, resetPassword, revokeToken, savePushToken } from '../services/auth.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { ForgotPasswordSchema, LoginSchema, RegisterTeacherSchema, ResetPasswordSchema } from '../validators/auth.validators.js';

const router: RouterType = Router();

router.post('/register', validateBody(RegisterTeacherSchema), async (req: Request, res: Response) => {
  try {
    const { teacherId, teacherEmail, teacherName, passwordHash } = req.body as {
      teacherId: string;
      teacherEmail?: string;
      teacherName: string;
      passwordHash?: string;
    };
    const token = await registerTeacher(teacherId, teacherEmail ?? '', teacherName, passwordHash);
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

router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { email, passwordHash } = req.body as { email: string; passwordHash: string };
    const result = await loginTeacher(email, passwordHash);
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

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) await revokeToken(token);
    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Erro ao encerrar sessão.' },
    });
  }
});

router.post('/push-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { pushToken } = req.body as { pushToken?: unknown };
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'pushToken inválido.' },
      });
    }
    await savePushToken(req.teacherId, pushToken);
    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'PUSH_TOKEN_ERROR', message: 'Erro ao salvar push token.' },
    });
  }
});

// ─── Forgot / reset password ─────────────────────────────────────────────────

router.post('/forgot-password', validateBody(ForgotPasswordSchema), async (req: Request, res: Response) => {
  if (!env.smtpHost) {
    return res.status(503).json({
      success: false,
      error: { code: 'EMAIL_NOT_CONFIGURED', message: 'Recuperação de senha por e-mail não está disponível no momento.' },
    });
  }
  try {
    const result = await forgotPassword((req.body as { email: string }).email);
    // Always return 200 to prevent e-mail enumeration
    if (result) {
      await sendPasswordResetEmail(result.teacherEmail, result.code).catch((err: Error) => {
        console.error('[auth] failed to send reset email:', err.message);
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FORGOT_PASSWORD_ERROR', message: 'Erro ao processar solicitação.' } });
  }
});

router.post('/reset-password', validateBody(ResetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email, code, newPasswordHash } = req.body as { email: string; code: string; newPasswordHash: string };
    const ok = await resetPassword(email, code, newPasswordHash);
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

router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  try {
    await deleteTeacherAccount(req.teacherId);
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
