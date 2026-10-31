# DP Studio — Interactive Portfolio

A scroll-free, story-driven portfolio: **robot arrives → name form → personalised welcome (5 s) → closed book → click the lock (+ email passcode, optional) → key unlocks → book opens → chapters**.

Stack: React 18 · Vite · TypeScript · GSAP (timelines) · CSS 3D transforms (no WebGL needed) · Lucide icons · custom CSS.

## Run it

```bash
npm install
npm run dev:all    # website (http://localhost:5173) + passcode server together
```

Other commands: `npm run dev` (website only — enough for `'key'` mode), `npm run server` (passcode server only), `npm run build` (type-check + build to `/dist`), `npm start` (production: serves `/dist` and the API from one server).

Requires Node 18+. On Windows PowerShell, if `npm` is blocked, use `npm.cmd` instead (e.g. `npm.cmd run dev:all`).

## Unlocking the book — two modes

Set the mode in **`src/config.ts`**:

```ts
export const UNLOCK_MODE: 'passcode' | 'key' = 'passcode';
```

| Mode | What the visitor does |
|---|---|
| `'passcode'` (default) | Clicks the lock → enters their email → gets a 6-digit one-time passcode by email → types it in → the key unlocks the book. Needs the server (`npm run dev:all`). |
| `'key'` | Just clicks the lock and the key unlocks the book. No email, no server (`npm run dev` is enough). |

The key animation is the same in both modes: the key swings in from the right, points up at the keyway on the **bottom** of the padlock (like a real padlock), slides up into it, turns, the shackle pops open, and the lock drops away.

### Passcode server (`server/index.mjs`)

1. Copy the settings file: `copy .env.example .env` (Windows) or `cp .env.example .env`.
2. **Local testing — no setup needed:** leave `SMTP_HOST` empty. The passcode is then printed in the server terminal instead of emailed, and the form shows a "Dev mode" note.
3. **Real emails:** fill in the SMTP settings in `.env`. For Gmail: turn on 2-Step Verification, create an *App password* (Google Account → Security → App passwords) and use it as `SMTP_PASS` (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`). Any SMTP provider (Brevo, Mailgun, SendGrid, your hosting's mail) works the same way.

How it behaves: codes are random 6-digit numbers, stored **hashed** in memory only, valid for **10 minutes**, **single use**, burned after **5 wrong guesses**; one code per email per minute; rate-limited per email and per IP. Emails are normalised (lower-case, trimmed). A restart simply invalidates outstanding codes.

**Be aware:** this is a *front-end gate*. It stops casual visitors, but the portfolio's content is part of the website's files, so a technically skilled person could still bypass it. If the content must be truly private, it would need to be served by the server only after verification.

### Visitor emails & privacy

`LOG_VISITORS=false` by default. Set it to `true` in `.env` and every visitor who **successfully verifies** their email is appended (email + time) to `server/data/visitors.jsonl`. The passcode form tells visitors this automatically ("…saved so I can see who has viewed my portfolio") — the notice follows the server setting, so it can't drift out of sync. Only turn it on if you're comfortable with the data-protection rules where your visitors live (e.g. GDPR, India's DPDP Act): keep the file private, don't share or sell the list, and delete entries on request. `server/data` and `.env` are git-ignored.

### Deploying with the passcode server

**Option A — Vercel (the `api/` folder does the work).** Push to GitHub and import the repo in Vercel (build command `npm run build`, output `dist`). Then open **Settings → Environment Variables** and add (for Production, then **Redeploy**):

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your full Gmail address |
| `SMTP_PASS` | your 16-letter Gmail App password (no spaces) |
| `MAIL_FROM` | `DP Studio <your.address@gmail.com>` |
| `PASSCODE_SECRET` | any long random text (20+ characters) — never share it |

Check the setup by opening `https://YOUR-SITE.vercel.app/api/health` — it should show `"secretSet": true` and `"emailConfigured": true`.

Vercel keeps nothing between requests, so the codes are **signed, not stored**: the server returns a signed token and the emailed code is checked against it. The code still expires after 10 minutes, but unlike the Node server it is **not single-use**, and the "5 wrong tries" limit is best-effort only (per server instance). Visitor logging is not available on Vercel.

**Option B — one Node app** (Render, Railway, Fly.io, a VPS…): build command `npm install && npm run build`, start command `npm start`, and set `NODE_ENV=production`, `SMTP_*`, `MAIL_FROM`, `TRUST_PROXY=1`. This keeps the full behaviour (single-use codes, strict attempt limit, visitor log).

Static-only hosts (Netlify drop, GitHub Pages) can only run `'key'` mode.

## Architecture

```
intro → name-form → welcome → closed-book → unlocking → book-opening → portfolio
```

`src/hooks/useSceneController.ts` is a reducer-based state machine. Only the transitions above are valid, and every `advance(from)` call names the scene it leaves, so late/duplicate callbacks (double clicks, StrictMode, stale timelines) are ignored. The visitor's name lives in this state, is re-validated in the reducer (trimmed, non-empty, ≤ 50 chars) and is only ever rendered as React text — never as HTML. Nothing is sent anywhere.

| Scene | Files | How it animates |
|---|---|---|
| Intro + name form | `scenes/IntroScene`, `components/RobotCharacter`, `VisitorNameForm` | One GSAP timeline: walk in from the right → look → wave → card unfolds. Submit runs a fold/celebrate/fade exit timeline. |
| Welcome | `components/WelcomeScene` | Letter-by-letter reveal + copper light sweep, then **5 s hold that starts only after the reveal finishes**, then fade/zoom/sweep out. |
| Closed book → unlock → open | `scenes/BookOpeningScene`, `components/ClosedBookScene`, `InteractiveLock`, `AnimatedKey` | One persistent 3D book (CSS 3D). Three GSAP timelines (reveal, unlock, open), each started once, all in one context that is reverted on unmount. |
| Portfolio | `components/OpenBookPortfolio`, `BookPage`, `ChapterPages`, `ProjectGallery`, `ProjectDetail`, `FinalChapter`, `ChapterNavigation` | 12 pages = 6 spreads. Desktop: two-page spread with a 3D page turn. Narrow screens: one page at a time with a slide. |

The backdrop (`Backdrop.tsx`) is mounted once for the whole experience, so scene changes never flash.

### Interaction & accessibility
- **Lock** is a real `<button>` (Tab → Enter/Space), with a visible focus ring; it is disabled until the reveal finishes and while unlocking, so it can't fire twice. The book never opens without it.
- **Book navigation:** Prev/Next buttons, ← → keys, touch swipe, chapter dots, and a **Contents** dialog (chapter overview). `Esc` closes dialogs.
- **Skip:** a discreet "Skip to portfolio" link appears only during unlocking/opening — never on the welcome screen.
- **Reduced motion:** all scenes keep the same order and timing logic (including the 5 s welcome hold) but swap travel/rotation for simple fades; ambient CSS motion is switched off.
- Semantic headings, labelled form, inline `role="alert"` validation, `aria-live` page status, lazy-loaded images, error boundary and a loading state.
- WebGL is not used, so there is nothing to fall back from.


## Sound

- A first **"Enter with sound"** screen appears before the story. Browsers block audio until a click, so this click is what lets the robot's footsteps play in sync. "Continue without sound" is also offered.
- A speaker button (top-left) mutes/unmutes at any time.
- Sounds: robot footsteps + hello beep, form unfold, success chime, welcome shimmer, book reveal, lock tap, key sparkle/insert/turn, **unlock clunk + chime**, book-opening creak, page turns, and soft ambient background music.
- Everything is generated in the browser (Web Audio API) — no audio files needed.
- **Use your own audio:** put files in `src/assets/audio/` named `music`, `footsteps`, `key`, `unlock`, `pageturn` (mp3/wav/ogg/m4a). Any you don't supply keep the built-in sound. Code: `src/audio/sound.ts`.

## Make it yours

**Logo** — replace `src/assets/logo/logo.svg` (the current file is a *placeholder monogram*). Keep the file name, or edit the import in `src/components/Logo.tsx`. It is rendered by height only, so it is never stretched.

**Robot** — `src/components/RobotCharacter.tsx` is an SVG drawn with primitives. To use your own asset, keep the component's `pose` prop (`'walking' | 'idle' | 'waving' | 'celebrate'`) and swap the SVG/inner animation.

**Book, lock, key** — `ClosedBookScene.tsx` (structure + cover text), `InteractiveLock.tsx`, `AnimatedKey.tsx` (SVG), and the `.cover-*`, `.lock*`, `.key*` rules in `src/styles/globals.css`. Page count is `LEAF_COUNT` in `ClosedBookScene.tsx`; page thickness is `BOOK_THICKNESS`.


### Image file names (drop into `src/assets/projects/`)

Every slot already expects a file name — add a file with that name (any of `.jpg`, `.jpeg`, `.png`, `.webp`) and the placeholder is replaced automatically. See `IMAGE-NAMES.md` for the full list. Restart `npm run dev` if a newly added file doesn't appear. Run `npm run check-images` to see which slots are filled (✅) and which are still placeholders (⬜).

### Click an image → full view (with a link)

Clicking any of your images opens it full size in a popup with a circular ✕ close button (also closes with **Esc** or a click on the dark background) and a button that opens another website in a new tab. This works for the images in Chapters 01, 02 and 04 and for the big image in a project's detail view. Images that are still placeholders aren't clickable.

The link button defaults to your **Portfolio projects** link in `src/data/profile.ts`. To give one image its own link (or hide it), edit **`src/data/imageLinks.ts`**:

```ts
export const IMAGE_LINKS = {
  'reels-1': 'https://www.instagram.com/reel/your-reel/',
  'creatpix-1': { href: 'https://example.com/case-study', label: 'Read the case study' },
  'early-2': '',            // empty = no link button for this image
};
```
The key is the image name without its extension (the same names as in `IMAGE-NAMES.md`). Only `https://`, `http://` and `mailto:` links are accepted.

**Project images / videos** — drop files into `src/assets/projects/` and reference them **by file name**:

```ts
// src/data/projects.ts
{ id: 'logos-1', title: 'My first logo', category: 'logos',
  description: 'What it was and what you did.',
  image: 'logos-01.jpg',             // or video: 'reel-01.mp4'
  details: ['Tools: …', 'Format: 1080×1350'],
  before: 'before.jpg', after: 'after.jpg' }   // optional comparison slider
```
Anything without an `image`/`video` shows a clearly labelled placeholder. Add or remove entries freely; collections are defined in the same file.

**Chapter text** — `src/data/chapters.ts`: intro copy, timeline, process steps, craft samples, the six month labels/notes (`GROWTH.months`), and the thank-you text. Items with `placeholder: true` show a "PLACEHOLDER" tag — set it to `false` (or remove it) once you've written the real text. Only facts you supplied (company, role, May–Oct 2026) are stated as fact; nothing else is invented.

**Links & name** — `src/data/profile.ts` (`LINKS` are placeholder URLs: LinkedIn, email, portfolio, other).

**Colors & type** — CSS variables at the top of `src/styles/globals.css`.

## Deploy

`npm run build` produces a static site in `dist/` (`base: './'`, so it works from any sub-path).

- **Netlify / Vercel / Cloudflare Pages:** connect the repo, build command `npm run build`, output directory `dist`.
- **GitHub Pages:** build, then publish `dist/` (e.g. with the `actions/deploy-pages` action or `npx gh-pages -d dist`).
- **Any static host:** upload the contents of `dist/`.

Fonts (Cormorant Garamond, Inter) load from Google Fonts; the page falls back to system serif/sans if they're blocked.
