// DP Studio — one-time passcode server.
//   POST /api/request-code  { email }        → emails a 6-digit passcode
//   POST /api/verify-code   { email, code }  → { ok: true } when correct
//   GET  /api/config                         → { logVisitors }   (so the form can show an honest privacy note)
//
// No database: codes live in memory for 10 minutes (hashed), so a restart simply invalidates them.
// In production it also serves the built site from ../dist.
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const DATA_DIR = path.join(__dirname, 'data');

// Load settings from the ".env" file in the project folder (next to package.json).
const ENV_PATH = path.join(__dirname, '..', '.env');
const envResult = dotenv.config({ path: ENV_PATH });

const PORT = Number(process.env.PORT) || 8787;
const IS_PROD = process.env.NODE_ENV === 'production';
const SITE_NAME = process.env.SITE_NAME || 'DP Studio';
const FROM = process.env.MAIL_FROM || process.env.SMTP_USER || `${SITE_NAME} <no-reply@example.com>`;
const LOG_VISITORS = process.env.LOG_VISITORS === 'true';

const CODE_TTL_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // one code per email per minute
const MAX_ATTEMPTS = 5; // wrong guesses before the code is burned
const HOUR = 60 * 60 * 1000;

/* ── mail transport ─────────────────────────────────────────── */
const smtpConfigured = Boolean(process.env.SMTP_HOST);
const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for port 465
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

async function sendCodeEmail(to, code) {
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

  if (!transport) {
    // Development fallback: no SMTP configured, so print the code in this terminal instead.
    console.log(`\n[dev] No SMTP configured — passcode for ${to}:  ${code}\n`);
    return;
  }
  await transport.sendMail({ from: FROM, to, subject: `Your ${SITE_NAME} passcode: ${code}`, text, html });
}

/* ── in-memory state ────────────────────────────────────────── */
/** email → { hash, salt, expires, attempts, lastSent } */
const pending = new Map();
/** "scope:key" → { count, resetAt } */
const counters = new Map();

function hit(scope, key, max, windowMs) {
  const k = `${scope}:${key}`;
  const now = Date.now();
  let c = counters.get(k);
  if (!c || c.resetAt <= now) c = { count: 0, resetAt: now + windowMs };
  c.count += 1;
  counters.set(k, c);
  return c.count <= max;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pending) if (v.expires <= now) pending.delete(k);
  for (const [k, v] of counters) if (v.resetAt <= now) counters.delete(k);
}, 60 * 1000).unref();

const hashCode = (code, salt) => crypto.createHash('sha256').update(`${salt}:${code}`).digest();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const validEmail = (e) => e.length > 0 && e.length <= 254 && EMAIL_RE.test(e);

function logVisitor(email) {
  if (!LOG_VISITORS) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(path.join(DATA_DIR, 'visitors.jsonl'), JSON.stringify({ email, at: new Date().toISOString() }) + '\n');
  } catch (err) {
    console.error('Could not write visitor log:', err.message);
  }
}

/* ── app ────────────────────────────────────────────────────── */
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
// Development convenience: let the site (Vite on localhost / 127.0.0.1, any port) call this server directly.
if (!IS_PROD) {
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}
app.use('/api', express.json({ limit: '2kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) => res.json({ logVisitors: LOG_VISITORS }));

app.post('/api/request-code', async (req, res) => {
  const email = cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'invalid_email' });

  if (!hit('ip-req', req.ip, 20, HOUR) || !hit('email-req', email, 5, HOUR)) {
    return res.status(429).json({ error: 'rate_limited', retryAfter: 600 });
  }
  const existing = pending.get(email);
  if (existing && Date.now() - existing.lastSent < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSent)) / 1000);
    return res.status(429).json({ error: 'cooldown', retryAfter });
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const salt = crypto.randomBytes(16).toString('hex');
  const entry = { hash: hashCode(code, salt), salt, expires: Date.now() + CODE_TTL_MS, attempts: 0, lastSent: Date.now() };
  pending.set(email, entry);

  try {
    await sendCodeEmail(email, code);
  } catch (err) {
    pending.delete(email);
    console.error('Email send failed:', err.message);
    return res.status(502).json({ error: 'send_failed' });
  }
  res.json({ ok: true, retryAfter: RESEND_COOLDOWN_MS / 1000, ttl: CODE_TTL_MS / 1000, devMode: !smtpConfigured && !IS_PROD });
});

app.post('/api/verify-code', (req, res) => {
  const email = cleanEmail(req.body?.email);
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'invalid_input' });
  if (!hit('ip-verify', req.ip, 60, HOUR)) return res.status(429).json({ error: 'rate_limited', retryAfter: 600 });

  const entry = pending.get(email);
  if (!entry || entry.expires <= Date.now()) {
    pending.delete(email);
    return res.status(400).json({ error: 'expired' });
  }
  entry.attempts += 1;
  const ok = crypto.timingSafeEqual(hashCode(code, entry.salt), entry.hash);
  if (!ok) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      pending.delete(email);
      return res.status(429).json({ error: 'too_many_attempts' });
    }
    return res.status(400).json({ error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - entry.attempts });
  }
  pending.delete(email); // single use
  logVisitor(email);
  res.json({ ok: true });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html' }));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(DIST, 'index.html')) : next()));
}

app.listen(PORT, () => {
  console.log(`DP Studio passcode server on http://localhost:${PORT}`);
  if (envResult.error) {
    console.log(`.env file: NOT FOUND (looked for ${ENV_PATH})`);
    try {
      const near = fs.readdirSync(path.dirname(ENV_PATH)).filter((f) => f.toLowerCase().startsWith('.env') && f !== '.env.example');
      if (near.length) console.log(`  → I see "${near.join('", "')}" instead. The file must be named exactly ".env" (no .txt at the end).`);
      else console.log('  → Create it with:  copy .env.example .env   then fill in SMTP_USER and SMTP_PASS.');
    } catch {
      /* ignore */
    }
  } else {
    console.log(`.env file: found (${ENV_PATH})`);
  }
  console.log(smtpConfigured ? `Sending email via ${process.env.SMTP_HOST}` : 'No SMTP configured → passcodes are printed in this terminal (dev mode).');
  if (LOG_VISITORS) console.log('Visitor log is ON → server/data/visitors.jsonl');

  // Check the email login right away, so a wrong password shows up now instead of when a visitor tries.
  if (smtpConfigured && (!process.env.SMTP_PASS || /your\.address@/i.test(process.env.SMTP_USER || ''))) {
    console.error('✖ .env is missing your details: set SMTP_USER to your real Gmail address and SMTP_PASS to your App password.');
  }
  if (transport) {
    transport.verify().then(
      () => console.log('✔ Email login OK — passcodes will be emailed.'),
      (err) => {
        console.error(`✖ Email login FAILED: ${err.message}`);
        if (/535|Invalid login|Username and Password not accepted|EAUTH/i.test(err.message)) {
          console.error('  → Wrong email or password. For Gmail you must use an "App password" (not your normal password),');
          console.error('    typed without spaces, and SMTP_USER must be the full Gmail address.');
        } else if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ESOCKET/i.test(err.message)) {
          console.error('  → Could not reach the mail server. Check SMTP_HOST / SMTP_PORT and your internet connection.');
        }
        console.error('  Until this is fixed, visitors will see "I couldn\'t send the email".');
      },
    );
  } else {
    console.log('Tip: to send real emails, copy .env.example to .env and fill in SMTP_USER / SMTP_PASS (see README).');
  }
});
