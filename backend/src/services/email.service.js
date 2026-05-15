import { createTransport } from 'nodemailer';
import { env } from '../config/env.js';
import { writeLog } from '../utils/logger.js';

const transporter = env.smtpHost
  ? createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    })
  : null;

/**
 * Sends a password-reset code to the teacher's e-mail.
 * Falls back to console.log in dev when SMTP is not configured.
 * Returns true on success, throws on SMTP error.
 */
export async function sendPasswordResetEmail(to, code) {
  if (!transporter) {
    // Development fallback — show code in server logs
    writeLog('warn', 'email_not_configured_dev_fallback', { to, code });
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: 'Código de recuperação de senha — ENEM IA',
    text: [
      `Olá!`,
      ``,
      `Seu código de recuperação de senha é: ${code}`,
      ``,
      `Este código é válido por 15 minutos.`,
      `Se você não solicitou a recuperação, ignore este e-mail.`,
      ``,
      `— ENEM IA`,
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#101828;margin-bottom:8px">Recuperação de senha</h2>
        <p style="color:#667085;margin-bottom:24px">Use o código abaixo no app para criar uma nova senha.</p>
        <div style="background:#F8F7F4;border:1px solid #E5E0D8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#3454D1">${code}</span>
        </div>
        <p style="color:#667085;font-size:13px">Válido por <strong>15 minutos</strong>. Se você não solicitou a recuperação, ignore este e-mail.</p>
        <hr style="border:none;border-top:1px solid #E5E0D8;margin:24px 0"/>
        <p style="color:#999;font-size:12px">ENEM IA — Ferramenta educacional com IA</p>
      </div>
    `,
  });
}
