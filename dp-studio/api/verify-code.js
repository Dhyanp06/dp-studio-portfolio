import { checkToken, clientIp, cleanEmail, validEmail, getSecret, hit, peek, readBody, requirePost, send } from './_lib/passcode.js';

const HOUR = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (requirePost(req, res)) return;
  const body = readBody(req);
  const email = cleanEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return send(res, 400, { error: 'invalid_input' });

  const secret = getSecret();
  if (!secret) return send(res, 503, { error: 'not_configured' });
  if (!hit('ip-verify', clientIp(req), 30, HOUR)) return send(res, 429, { error: 'rate_limited', retryAfter: 600 });

  // Best-effort: stop guessing against the same emailed code after 5 misses (per warm instance).
  const result = checkToken(secret, body.token, email, code);
  if (result.reason === 'expired') return send(res, 400, { error: 'expired' });
  if (peek('tok-miss', result.nonce) >= MAX_ATTEMPTS) return send(res, 429, { error: 'too_many_attempts' });

  if (!result.ok) {
    hit('tok-miss', result.nonce, 999, 15 * 60 * 1000);
    const used = peek('tok-miss', result.nonce);
    await sleep(400); // slows down automated guessing
    if (used >= MAX_ATTEMPTS) return send(res, 429, { error: 'too_many_attempts' });
    return send(res, 400, { error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - used });
  }
  send(res, 200, { ok: true });
}
