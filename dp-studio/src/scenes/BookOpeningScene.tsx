import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ClosedBookScene, { LEAF_COUNT } from '../components/ClosedBookScene';
import AnimatedKey from '../components/AnimatedKey';
import { useReducedMotion } from '../hooks/useReducedMotion';
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
        tl.set('.book3d', { rotationY: R ? -22 : -64, rotationX: R ? 4 : 12, scale: R ? 1 : 0.82, opacity: 0 })
          // 1. glow expands from the centre
          .fromTo('.stage-glow', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: R ? 0.4 : 1.3 }, 0)
          .fromTo('.book-shadow', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.4)
          // 2–4. fades in, scales up, rotates to three-quarter view, settles
          .to('.book3d', { opacity: 1, scale: 1, duration: R ? 0.4 : 1.1 }, 0.35)
          .to('.book3d', { rotationY: -22, rotationX: 4, duration: R ? 0.01 : 1.7, ease: 'power3.out' }, 0.35)
          .fromTo('.book3d', { y: R ? 0 : -14 }, { y: 0, duration: R ? 0.01 : 1.1, ease: 'sine.out' }, 0.5);
        // 5. the lock catches a highlight
        if (!R) {
          tl.fromTo('.lock-shine', { x: 0 }, { x: 170, duration: 1.1, ease: 'power2.inOut' }, '>-0.5');
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

    /* ── Scene 5 · key, lock, unlock ────────────────────────────── */
    if (scene === 'unlocking' && !started.current.unlock) {
      started.current.unlock = true;
      c.add(() => {
        const rootRect = el.getBoundingClientRect();
        const holeEl = el.querySelector('.keyhole') as SVGGraphicsElement | null;
        const keyEl = el.querySelector('.key') as HTMLElement | null;
        if (!holeEl || !keyEl) {
          advanceRef.current('unlocking');
          return;
        }
        const hole = holeEl.getBoundingClientRect();
        const keyW = keyEl.offsetWidth;
        const keyH = keyEl.offsetHeight;
        const tipX = keyW * 0.025;
        const tipY = keyH / 2;
        // key top-left coordinates (in the stage) that put the key's tip at (px, py)
        const kx = (px: number) => px - rootRect.left - tipX;
        const ky = (py: number) => py - rootRect.top - tipY;

        const holeX = hole.left + hole.width / 2;
        const holeY = hole.top + hole.height / 2;
        const startX = kx(rootRect.right + keyW);
        const startY = ky(holeY - 110);
        const nearX = kx(holeX + keyW * 0.85);
        const nearY = ky(holeY);
        const inX = kx(holeX + 2);

        const done = () => advanceRef.current('unlocking');

        if (R) {
          gsap
            .timeline()
            .to('.book-instruction', { autoAlpha: 0, duration: 0.3 })
            .to('.lock', { autoAlpha: 0, duration: 0.5 })
            .to('.book-aura', { opacity: 0.8, duration: 0.5 }, '<')
            .call(done);
          return;
        }

        gsap.set(keyEl, { x: startX, y: startY, autoAlpha: 0, rotation: 8, transformOrigin: `${tipX}px ${tipY}px` });
        const sparks = gsap.utils.toArray<HTMLElement>('.key-spark');
        gsap.set(sparks, { x: startX, y: startY, autoAlpha: 0 });

        const tl = gsap.timeline();
        // 1. the lock reacts with a small bounce
        tl.to('.lock', { y: -7, rotation: -4, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 100%' })
          .to('.lock', { y: 0, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
          .to('.book-instruction', { autoAlpha: 0, y: 10, duration: 0.4 }, 0)
          // 2–3. the key slides in from the side with a sparkle trail
          .to(keyEl, { autoAlpha: 1, duration: 0.2 }, 0.3)
          .to(keyEl, { x: nearX, duration: 1.1, ease: 'power2.inOut' }, 0.3)
          .to(keyEl, { y: nearY, rotation: 0, duration: 1.1, ease: 'power2.out' }, 0.3);
        sparks.forEach((s, i) => {
          const t0 = 0.3 + i * 0.07;
          const wob = i % 2 ? 7 : -7;
          tl.fromTo(
            s,
            { x: startX + keyW * 0.6, y: startY + wob, autoAlpha: 0, scale: 0.5 },
            { x: nearX + keyW * 0.5, y: nearY + wob * 1.4, autoAlpha: 0.95, scale: 1, duration: 0.9, ease: 'power2.inOut' },
            t0,
          ).to(s, { autoAlpha: 0, scale: 0.2, duration: 0.35 }, t0 + 0.9);
        });
        const tEnter = 0.3 + 1.1 + 0.15;
        // 4. aligns with the keyhole
        tl.to(keyEl, { y: ky(holeY), duration: 0.25, ease: 'sine.inOut' }, tEnter - 0.1)
          // 5. slips into the keyhole
          .to(keyEl, { x: inX, scale: 0.9, duration: 0.5, ease: 'power2.inOut' }, tEnter + 0.2)
          // 6. turns
          .to(keyEl, { rotation: -80, duration: 0.8, ease: 'power2.inOut' }, '>0.1')
          // 7. the shackle pops open
          .to('.lock-shackle', { y: -11, rotation: -32, svgOrigin: '57 50', duration: 0.5, ease: 'back.out(2.2)' }, '>-0.25')
          .to('.lock-body', { y: 1.5, duration: 0.12, yoyo: true, repeat: 1 }, '<')
          // key withdraws
          .to(keyEl, { x: inX + keyW * 0.35, autoAlpha: 0, scale: 0.8, duration: 0.45, ease: 'power2.in' }, '>0.1')
          // 8. the lock lets go and falls away
          .to('.lock', { y: 240, rotation: 24, autoAlpha: 0, duration: 0.85, ease: 'power2.in' }, '>-0.2')
          // 9. copper light spills from the book's edges
          .to('.book-aura', { opacity: 0.9, scale: 1.04, duration: 0.9, ease: 'power2.out' }, '<0.1')
          .call(done);
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
            .to('.book-instruction', { autoAlpha: 0, duration: 0.2 })
            .to('.open-glow', { opacity: 1, duration: 0.5 }, 0)
            .to('.book-camera', { opacity: 0, duration: 0.6 }, 0.3)
            .call(done);
          return;
        }

        const leaves = gsap.utils.toArray<HTMLElement>('.leaf').slice(0, LEAF_COUNT - 1);
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        tl.to('.book-instruction', { autoAlpha: 0, duration: 0.2 }, 0)
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

  return (
    <div ref={root} className="book-stage" data-scene={scene}>
      <div className="stage-glow" aria-hidden="true" />
      <div className="open-glow" aria-hidden="true" />

      <h1 className="sr-only">DP Studio — My 6-month journey, a story waiting to be unlocked</h1>

      <ClosedBookScene onLockActivate={() => advanceRef.current('closed-book')} lockDisabled={!lockReady || scene !== 'closed-book'} />

      <div className="book-instruction">
        <p className="instr-top">A STORY WAITING TO BE UNLOCKED</p>
        <p className="instr-bottom">CLICK THE LOCK TO BEGIN</p>
      </div>

      <AnimatedKey />

      {showSkip && (
        <button type="button" className="skip-link" onClick={onSkip}>
          Skip to portfolio
        </button>
      )}
    </div>
  );
}
