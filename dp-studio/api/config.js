import { send } from './_lib/passcode.js';

// Vercel can't keep a visitor log (no writable disk), so the form must never claim emails are saved.
export default function handler(_req, res) {
  send(res, 200, { logVisitors: false });
}
