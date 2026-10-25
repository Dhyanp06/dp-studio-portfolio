/**
 * How the closed book is unlocked.
 *
 *  'passcode' → the visitor clicks the lock, enters their email, receives a one-time
 *               passcode by email, types it in, and then the key unlocks the book.
 *               (needs the small server in /server — run `npm run dev:all`)
 *  'key'      → the visitor just clicks the lock and the key unlocks the book.
 *               (no email, no server needed)
 */
   export const UNLOCK_MODE: 'passcode' | 'key' = 'key';
