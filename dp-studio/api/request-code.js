import crypto from 'node:crypto';
import {
  clientIp, cleanEmail, validEmail, getSecret, hit, makeToken, mailConfigured, readBody, requirePost, send, sendCodeEmail,
  COOLDOWN_S, CODE_TTL_MS,
} from './_lib/passcode.js';

const HOUR = 60 * 60 * 1000;

export default async function handler(req, res) {
  if (requirePost(req, res)) return;
  const email = cleanEmail(readBody(req).email);
  if (!validEmail(email)) return send(res, 400, { error: 'invalid_email' });

  const secret = getSecret();
  if (!secret || !mailConfigured()) {
    console.error('Passcode is not configured: set PASSCODE_SECRET (16+ chars), SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel.');
    return send(res, 503, { error: 'not_configured' });
  }
  if (!hit('ip-req', clientIp(req), 20, HOUR) || !hit('email-req', email, 5, HOUR)) {
    return send(res, 429, { error: 'rate_limited', retryAfter: 600 });
  }
  if (!hit('email-cool', email, 1, COOLDOWN_S * 1000)) {
    return send(res, 429, { error: 'cooldown', retryAfter: COOLDOWN_S });
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const { token } = makeToken(secret, email, code);
  try {
    await sendCodeEmail(email, code);
  } catch (err) {
    console.error('Email send failed:', err && err.message);
    return send(res, 502, { error: 'send_failed' });
  }
  send(res, 200, { ok: true, token, retryAfter: COOLDOWN_S, ttl: CODE_TTL_MS / 1000, devMode: false });
}
