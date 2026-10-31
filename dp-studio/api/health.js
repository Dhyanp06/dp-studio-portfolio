import { getSecret, mailConfigured, send } from './_lib/passcode.js';

// Open  https://YOUR-SITE.vercel.app/api/health  to check the setup (it never reveals any secret).
export default function handler(_req, res) {
  send(res, 200, { ok: true, platform: 'vercel', secretSet: Boolean(getSecret()), emailConfigured: mailConfigured() });
}
