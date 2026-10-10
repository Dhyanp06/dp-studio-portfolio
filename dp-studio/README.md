# DP Studio — Interactive Portfolio

A scroll-free, story-driven portfolio: **robot arrives → name form → personalised welcome (5 s) → closed book → click the lock → key unlocks → book opens → chapters**.

Stack: React 18 · Vite · TypeScript · GSAP (timelines) · CSS 3D transforms (no WebGL needed) · Lucide icons · custom CSS.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to /dist
npm run preview    # serve the production build locally
```

Requires Node 18+.

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

## Make it yours

**Logo** — replace `src/assets/logo/logo.svg` (the current file is a *placeholder monogram*). Keep the file name, or edit the import in `src/components/Logo.tsx`. It is rendered by height only, so it is never stretched.

**Robot** — `src/components/RobotCharacter.tsx` is an SVG drawn with primitives. To use your own asset, keep the component's `pose` prop (`'walking' | 'idle' | 'waving' | 'celebrate'`) and swap the SVG/inner animation.

**Book, lock, key** — `ClosedBookScene.tsx` (structure + cover text), `InteractiveLock.tsx`, `AnimatedKey.tsx` (SVG), and the `.cover-*`, `.lock*`, `.key*` rules in `src/styles/globals.css`. Page count is `LEAF_COUNT` in `ClosedBookScene.tsx`; page thickness is `BOOK_THICKNESS`.

**Project images / videos** — drop files into `src/assets/projects/` and reference them **by file name**:

```ts
// src/data/projects.ts
{ id: 'social-1', title: 'My first post', category: 'social',
  description: 'What it was and what you did.',
  image: 'social-01.jpg',            // or video: 'reel-01.mp4'
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
