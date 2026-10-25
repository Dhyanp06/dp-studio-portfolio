import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ClosedBookScene, { LEAF_COUNT } from '../components/ClosedBookScene';
import PasscodeModal from '../components/PasscodeModal';
import { UNLOCK_MODE } from '../config';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { sound } from '../audio/sound';
import type { Scene } from '../hooks/useSceneController';

interface Props {
  scene: Scene;
  onAdvance: (from: Scene) => void;
  onSkip: () => void;
}

/**
 * Scenes 4–6: closed-book reveal → lock/key unlock → the book opens.
 *
 * One GSAP context lives for the whole component; each phase adds its own
 * timeline to it exactly once (guarded by `started`), so nothing can run twice
 * and everything is killed on unmount.
 */
export default function BookOpeningScene({ scene, onAdvance, onSkip }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const ctx = useRef<gsap.Context | null>(null);
  const started = useRef({ reveal: false, unlock: false, open: false });
  const reduced = useReducedMotion();
  const [lockReady, setLockReady] = useState(false);
  const [askPass, setAskPass] = useState(false);

  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useLayoutEffect(() => {
    started.current = { reveal: false, unlock: false, open: false };
    ctx.current = gsap.context(() => {}, root);
    return () => {
      ctx.current?.revert();
      ctx.current = null;
    };
  }, []);

  useEffect(() => {
    const c = ctx.current;
    const el = root.current;
    if (!c || !el) return;
    const R = reducedRef.current;

    /* ── Scene 4 · reveal the closed book ───────────────────────── */
    if (scene === 'closed-book' && !started.current.reveal) {
      started.current.reveal = true;
      c.add(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => setLockReady(true) });
        tl.call(() => sound.play('reveal'), undefined, 0).set('.book3d', { rotationY: R ? -22 : -64, rotationX: R ? 4 : 12, scale: R ? 1 : 0.82, opacity: 0 })
          // 1. glow expands from the centre
          .fromTo('.stage-glow', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: R ? 0.4 : 1.3 }, 0)
          .fromTo('.book-shadow', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.4)
          // 2–4. fades in, scales up, rotates to three-quarter view, settles
          .to('.book3d', { opacity: 1, scale: 1, duration: R ? 0.4 : 1.1 }, 0.35)
          .to('.book3d', { rotationY: -22, rotationX: 4, duration: R ? 0.01 : 1.7, ease: 'power3.out' }, 0.35)
          .fromTo('.book3d', { y: R ? 0 : -14 }, { y: 0, duration: R ? 0.01 : 1.1, ease: 'sine.out' }, 0.5);
        // 5. the lock catches a highlight
        if (!R) {
          tl.call(() => sound.play('shimmer'), undefined, '>-0.5').fromTo('.lock-shine', { x: 0 }, { x: 170, duration: 1.1, ease: 'power2.inOut' }, '<');
        }
        // 6. the instruction appears
        tl.fromTo(
          '.book-instruction > *',
          { autoAlpha: 0, y: R ? 0 : 12 },
          { autoAlpha: 1, y: 0, duration: R ? 0.3 : 0.7, stagger: 0.18 },
          '>-0.5',
        );
      });
    }

    /* ── Scene 5 · key, lock, unlock ──────────────────────────────
       All positions are in the lock's own coordinate space (the cover face), so the
       key follows the book's 3D tilt. The key comes in from the right, swings up to
       point at the keyway on the bottom of the lock, slides up INTO the lock (it is
       drawn behind the lock face, so the tip disappears), turns on its own axis, the
       shackle pops, the key slips out and the lock lets go. */
    if (scene === 'unlocking' && !started.current.unlock) {
      started.current.unlock = true;
      c.add(() => {
        const lockEl = el.querySelector('.lock') as HTMLElement | null;
        const keyEl = el.querySelector('.key') as HTMLElement | null;
        const done = () => advanceRef.current('unlocking');
        if (!lockEl || !keyEl) {
          done();
          return;
        }

        if (R) {
          gsap
            .timeline()
            .call(() => sound.play('unlock'))
            .to('.book-instruction', { autoAlpha: 0, duration: 0.3 })
            .to('.lock', { autoAlpha: 0, duration: 0.5 })
            .to('.book-aura', { opacity: 0.8, duration: 0.5 }, '<')
            .call(done);
          return;
        }

        const lx = lockEl.offsetLeft;
        const ly = lockEl.offsetTop;
        const lw = lockEl.offsetWidth;
        const lh = lockEl.offsetHeight;
        const keyW = keyEl.offsetWidth;
        const keyH = keyEl.offsetHeight;
        const tipX = keyW * 0.025; // the key tip, inside the key box (it points left)
        const tipY = keyH / 2;
        // keyway: bottom-centre of the lock (SVG viewBox 80x104 → x 40, y 98)
        const hx = lx + lw * 0.5;
        const hy = ly + lh * (98 / 104);
        // top-left of the key box that puts its tip at (px, py) — the key pivots on its tip
        const at = (px: number, py: number) => ({ x: px - tipX, y: py - tipY });

        const sA = at(hx + keyW * 2.0, hy + keyW * 0.95); // off to the right
        const sB = at(hx + keyW * 0.45, hy + keyW * 0.7); // swinging in
        const sC = at(hx, hy + keyW * 0.42); // under the keyway, pointing up
        const sD = at(hx, ly + lh * 0.6); // tip inside the lock (hidden behind the face)

        gsap.set(keyEl, { x: sA.x, y: sA.y, rotation: 0, scaleY: 1, autoAlpha: 0, transformOrigin: `${tipX}px ${tipY}px` });

        const T_FLY = 0.35;
        const D_FLY = 1.15;
        const T_ALIGN = T_FLY + D_FLY; // 1.5
        const T_INSERT = T_ALIGN + 0.55; // 2.05
        const T_TURN = T_INSERT + 0.5; // 2.55
        const T_POP = T_TURN + 0.8; // 3.35

        const tl = gsap.timeline();
        // 1. the lock reacts with a small bounce
        tl.call(() => sound.play('lockTap'), undefined, 0)
          .to('.lock', { y: -7, rotation: -4, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 100%' }, 0)
          .to('.lock', { y: 0, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }, 0.18)
          .to('.book-instruction', { autoAlpha: 0, y: 10, duration: 0.4 }, 0)
          // 2. the key appears and swings in from the right (tip first), leaving sparkles
          .to(keyEl, { autoAlpha: 1, duration: 0.2 }, T_FLY)
          .call(() => sound.play('keyTrail'), undefined, T_FLY)
          .to(keyEl, { x: sB.x, y: sB.y, rotation: 55, duration: D_FLY, ease: 'power2.inOut' }, T_FLY)
          // 3. it straightens to point straight up at the keyway
          .to(keyEl, { x: sC.x, y: sC.y, rotation: 90, duration: 0.55, ease: 'power2.out' }, T_ALIGN)
          // 4. it slides up into the keyway — the tip vanishes behind the lock face
          .call(() => sound.play('keyInsert'), undefined, T_INSERT)
          .to(keyEl, { x: sD.x, y: sD.y, duration: 0.42, ease: 'power1.inOut' }, T_INSERT)
          // 5. it turns about its own axis (flattens edge-on), with little mechanical judders
          .call(() => sound.play('keyTurn'), undefined, T_TURN)
          .to(keyEl, { scaleY: 0.14, duration: 0.7, ease: 'power2.inOut' }, T_TURN)
          .to('.lock-body', { x: 0.7, duration: 0.07, yoyo: true, repeat: 7, ease: 'none' }, T_TURN + 0.05)
          // 6. the shackle pops open
          .call(() => sound.play('unlock'), undefined, T_POP)
          .to('.lock-shackle', { y: -11, rotation: -32, svgOrigin: '57 50', duration: 0.5, ease: 'back.out(2.2)' }, T_POP)
          .to('.lock-body', { y: 1.5, duration: 0.12, yoyo: true, repeat: 1 }, T_POP)
          // the key slips back out and fades
          .to(keyEl, { y: sC.y + keyW * 0.55, scaleY: 1, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, T_POP + 0.12)
          // 7. the lock lets go and falls away
          .call(() => sound.play('lockDrop'), undefined, T_POP + 0.3)
          .to('.lock', { y: 240, rotation: 24, autoAlpha: 0, duration: 0.85, ease: 'power2.in' }, T_POP + 0.3)
          // 8. copper light spills from the book's edges
          .to('.book-aura', { opacity: 0.9, scale: 1.04, duration: 0.9, ease: 'power2.out' }, T_POP + 0.35)
          .call(done, undefined, '>');

        // sparkle trail, emitted along the key's flight path
        const flyEase = gsap.parseEase('power2.inOut');
        const sparks = Array.from(el.querySelectorAll<HTMLElement>('.key-spark'));
        sparks.forEach((spark, i) => {
          const u = (i + 1) / (sparks.length + 1);
          const e = flyEase(u);
          const rot = (55 * e * Math.PI) / 180;
          // the key's far end (its bow) at that moment of the flight, plus a little wobble
          const px = sA.x + tipX + (sB.x - sA.x) * e + Math.cos(rot) * keyW * 0.9;
          const py = sA.y + tipY + (sB.y - sA.y) * e + Math.sin(rot) * keyW * 0.9 + (i % 2 ? 7 : -7);
          const t = T_FLY + u * D_FLY;
          tl.set(spark, { x: px, y: py, scale: 0.5, autoAlpha: 0 }, t)
            .to(spark, { autoAlpha: 0.95, scale: 1, duration: 0.15 }, t)
            .to(spark, { autoAlpha: 0, scale: 0.2, y: py + 16, duration: 0.45, ease: 'power1.in' }, t + 0.15);
        });
      });
    }

    /* ── Scene 6 · the book opens ───────────────────────────────── */
    if (scene === 'book-opening' && !started.current.open) {
      started.current.open = true;
      c.add(() => {
        const book = el.querySelector('.book3d') as HTMLElement | null;
        if (!book) {
          advanceRef.current('book-opening');
          return;
        }
        const bw = book.offsetWidth;
        const bh = book.offsetHeight;
        const camera = Math.max(
          0.5,
          Math.min(1.5, (window.innerWidth * 0.92) / (2 * bw), (window.innerHeight * 0.7) / bh),
        );
        const done = () => advanceRef.current('book-opening');

        if (R) {
          gsap
            .timeline()
            .call(() => sound.play('bookOpen'))
            .to('.book-instruction', { autoAlpha: 0, duration: 0.2 })
            .to('.open-glow', { opacity: 1, duration: 0.5 }, 0)
            .to('.book-camera', { opacity: 0, duration: 0.6 }, 0.3)
            .call(done);
          return;
        }

        const leaves = gsap.utils.toArray<HTMLElement>('.leaf').slice(0, LEAF_COUNT - 1);
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        tl.call(() => sound.play('bookOpen'), undefined, 0)
          .to('.book-instruction', { autoAlpha: 0, duration: 0.2 }, 0)
          // the book squares up and slides so the open spread is centred
          .to('.book3d', { rotationY: -4, rotationX: 2, x: bw / 2, duration: 2.6 }, 0)
          // 6. the camera gently moves closer
          .to('.book-camera', { scale: camera, duration: 3.3 }, 0.2)
          .to('.book-shadow', { scaleX: 2, opacity: 0.7, duration: 2.6 }, 0.2)
          // 1–2. the front cover lifts from the right edge, pivoting on the spine
          .to('.cover', { rotationY: -180, duration: 1.8 }, 0.3)
          .to('.cover-shade', { opacity: 0.55, duration: 0.9, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.3);
        // 3–4. pages become visible and several turn
        leaves.forEach((leaf, i) => {
          if (i % 2 === 0) tl.call(() => sound.play('pageTurn'), undefined, 1.35 + i * 0.2);
          tl.to(leaf, { rotationY: -180, duration: 1.15 }, 1.35 + i * 0.2);
        });
        // 5. a warm glow rises from the gutter
        tl.to('.open-glow', { opacity: 1, scale: 1.1, duration: 1.5, ease: 'power2.out' }, 1.7)
          .to('.book-aura', { opacity: 0.35, duration: 1.2 }, 1.7)
          // 7. hand over to the portfolio, which fades in on the open pages
          .call(done, undefined, '>-0.3');
      });
    }
  }, [scene]);

  const showSkip = scene === 'unlocking' || scene === 'book-opening';
  const passcodeMode = UNLOCK_MODE === 'passcode';

  // Clicking the lock: 'key' mode starts the unlock straight away; 'passcode' mode first
  // asks for an email passcode, and only the server's "verified" answer starts the unlock.
  const onLock = () => {
    if (!passcodeMode) {
      advanceRef.current('closed-book');
      return;
    }
    sound.play('lockTap');
    ctx.current?.add(() => {
      gsap.fromTo('.lock', { rotation: -5, transformOrigin: '50% 100%' }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
    });
    setAskPass(true);
  };

  return (
    <div ref={root} className="book-stage" data-scene={scene}>
      <div className="stage-glow" aria-hidden="true" />
      <div className="open-glow" aria-hidden="true" />

      <h1 className="sr-only">DP Studio — My 6-month journey, a story waiting to be unlocked</h1>

      <ClosedBookScene onLockActivate={onLock} lockDisabled={!lockReady || scene !== 'closed-book'} />

      <div className="book-instruction">
        <p className="instr-top">A STORY WAITING TO BE UNLOCKED</p>
        <p className="instr-bottom">{passcodeMode ? 'CLICK THE LOCK TO GET YOUR PASSCODE' : 'CLICK THE LOCK TO BEGIN'}</p>
      </div>

      {askPass && scene === 'closed-book' && (
        <PasscodeModal
          onClose={() => setAskPass(false)}
          onVerified={() => {
            setAskPass(false);
            advanceRef.current('closed-book');
          }}
        />
      )}

      {showSkip && (
        <button type="button" className="skip-link" onClick={onSkip}>
          Skip to portfolio
        </button>
      )}
    </div>
  );
}
