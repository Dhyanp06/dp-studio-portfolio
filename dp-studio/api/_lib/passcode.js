// Shared helpers for the Vercel passcode functions.
//
// Vercel functions have no memory between requests, so nothing is stored. Instead, when a code is
// requested the server returns a signed "token" containing {email, expiry, nonce}. The signature is
// HMAC-SHA256(secret, email|expiry|nonce|code) — the code itself is NOT inside the token, so the browser
// can't read it. To verify, the browser sends the token + the typed code and the server recomputes the
// signature. Only someone holding the emailed code (or the secret) can produce a matching pair.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

export const SITE_NAME = process.env.SITE_NAME || 'DP Studio';
export const CODE_TTL_MS = 10 * 60 * 1000;
export const COOLDOWN_S = 60;
const FROM = process.env.MAIL_FROM || process.env.SMTP_USER || `${SITE_NAME} <no-reply@example.com>`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const cleanEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
export const validEmail = (e) => e.length > 0 && e.length <= 254 && EMAIL_RE.test(e);

/* ── request plumbing ───────────────────────────────────────── */
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > 2048) return {};
    try {
      b = JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {};
}

export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const first = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

/** Only POST allowed. Returns true when the request was already answered. */
export function requirePost(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { error: 'method_not_allowed' });
    return true;
  }
  return false;
}

/* ── best-effort rate limits (per warm instance; not shared between instances) ─── */
const counters = new Map();
export function hit(scope, key, max, windowMs) {
  const k = `${scope}:${key}`;
  const now = Date.now();
  if (counters.size > 5000) for (const [ck, v] of counters) if (v.resetAt <= now) counters.delete(ck);
  let c = counters.get(k);
  if (!c || c.resetAt <= now) c = { count: 0, resetAt: now + windowMs };
  c.count += 1;
  counters.set(k, c);
  return c.count <= max;
}
export function peek(scope, key) {
  const c = counters.get(`${scope}:${key}`);
  return c && c.resetAt > Date.now() ? c.count : 0;
}

/* ── signed tokens ──────────────────────────────────────────── */
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (secret, email, exp, nonce, code) =>
  crypto.createHmac('sha256', secret).update(`${email}|${exp}|${nonce}|${code}`).digest('hex');

export const getSecret = () => {
  const s = process.env.PASSCODE_SECRET || '';
  return s.length >= 16 ? s : null;
};

export function makeToken(secret, email, code) {
  const exp = Date.now() + CODE_TTL_MS;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = b64(JSON.stringify({ e: email, x: exp, n: nonce }));
  return { token: `${payload}.${sign(secret, email, exp, nonce, code)}`, nonce };
}

/** → { ok:true, nonce } | { ok:false, reason:'expired'|'bad', nonce? } */
export function checkToken(secret, token, email, code) {
  if (typeof token !== 'string' || token.length > 600 || !token.includes('.')) return { ok: false, reason: 'expired' };
  const [payload, sig] = token.split('.');
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'expired' };
  }
  if (!data || data.e !== email || typeof data.x !== 'number' || typeof data.n !== 'string') return { ok: false, reason: 'expired' };
  if (data.x <= Date.now()) return { ok: false, reason: 'expired' };
  const want = Buffer.from(sign(secret, email, data.x, data.n, code), 'hex');
  const got = /^[0-9a-f]{64}$/.test(sig || '') ? Buffer.from(sig, 'hex') : Buffer.alloc(0);
  const ok = got.length === want.length && crypto.timingSafeEqual(got, want);
  return ok ? { ok: true, nonce: data.n } : { ok: false, reason: 'bad', nonce: data.n };
}

/* ── email ──────────────────────────────────────────────────── */
export const mailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendCodeEmail(to, code) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  const minutes = CODE_TTL_MS / 60000;
  const text = `Your ${SITE_NAME} passcode is ${code}\n\nIt expires in ${minutes} minutes. If you didn't ask for it, you can ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;background:#FFF9F3;font-family:Arial,Helvetica,sans-serif;color:#171717">
  <div style="max-width:420px;margin:0 auto;padding:32px 24px;text-align:center">
    <p style="letter-spacing:.3em;font-size:12px;color:#A8541A;margin:0 0 8px">${SITE_NAME.toUpperCase()}</p>
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px">Your passcode</h1>
    <div style="font-size:34px;letter-spacing:.35em;font-weight:700;padding:16px 8px 16px 20px;background:#fff;border:1.5px solid #F28C28;border-radius:14px">${code}</div>
    <p style="font-size:14px;color:#3a332c;margin:20px 0 0">Enter this code to unlock the book. It expires in ${minutes} minutes.</p>
    <p style="font-size:12px;color:#6f5f50;margin:16px 0 0">If you didn't ask for it, you can safely ignore this email.</p>
  </div></body></html>`;
  await transport.sendMail({ from: FROM, to, subject: `Your ${SITE_NAME} passcode: ${code}`, text, html });
}
