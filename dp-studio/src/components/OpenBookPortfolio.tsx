import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookPage from './BookPage';
import ChapterNavigation from './ChapterNavigation';
import Logo from './Logo';
import ProjectDetail from './ProjectDetail';
import { CollectionPicker, ProjectGrid } from './ProjectGallery';
import { FinalLeftPage, FinalRightPage } from './FinalChapter';
import {
  BeginningLeft,
  BeginningRight,
  CraftLeft,
  CraftRight,
  GrowthLeft,
  GrowthRight,
  ProcessLeft,
  ProcessRight,
  WorkLeft,
} from './ChapterPages';
import { CHAPTERS, PAGE_COUNT } from '../data/chapters';
import type { CollectionId, Project } from '../data/projects';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { sound } from '../audio/sound';

interface Props {
  name: string;
  /** Fired when the entrance transition has finished (the 3D stage can go). */
  onEntered: () => void;
}

interface Turn {
  dir: 'next' | 'prev';
  from: number;
}

interface PageDef {
  chapter: number;
  node: ReactNode;
}

const markInert = (el: HTMLElement | null) => {
  if (el) el.setAttribute('inert', '');
};

/**
 * The open book: the portfolio's primary container.
 * Desktop/tablet-landscape shows a two-page spread with a 3D page turn;
 * narrower screens show one legible page at a time with a slide transition.
 */
export default function OpenBookPortfolio({ name, onEntered }: Props) {
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const dual = useMediaQuery('(min-width: 900px)');

  const root = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const pendingIn = useRef<'next' | 'prev' | null>(null);
  const enteredRef = useRef(onEntered);
  enteredRef.current = onEntered;
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [collection, setCollection] = useState<CollectionId>('social');
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const step = dual ? 2 : 1;
  const maxIndex = dual ? PAGE_COUNT - 2 : PAGE_COUNT - 1;

  // Keep the left-page index even when switching to the two-page layout.
  useEffect(() => {
    if (dual && index % 2 === 1) setIndex((i) => i - 1);
  }, [dual, index]);

  /* ── pages ─────────────────────────────────────────────────── */
  const pages: PageDef[] = [
    { chapter: 0, node: <BeginningLeft /> },
    { chapter: 0, node: <BeginningRight /> },
    { chapter: 1, node: <CraftLeft /> },
    { chapter: 1, node: <CraftRight /> },
    { chapter: 2, node: (<WorkLeft><CollectionPicker value={collection} onChange={setCollection} /></WorkLeft>) },
    { chapter: 2, node: <ProjectGrid collection={collection} onOpen={(p) => { sound.play('click'); setOpenProject(p); }} /> },
    { chapter: 3, node: <ProcessLeft /> },
    { chapter: 3, node: <ProcessRight /> },
    { chapter: 4, node: <GrowthLeft /> },
    { chapter: 4, node: <GrowthRight /> },
    { chapter: 5, node: <FinalLeftPage /> },
    { chapter: 5, node: <FinalRightPage /> },
  ];

  const renderPage = (i: number) => {
    const p = pages[i];
    if (!p) return <div className="book-page book-page--blank" />;
    const ch = CHAPTERS[p.chapter];
    const label = ch.id === 'thanks' ? 'FINAL CHAPTER' : `CHAPTER ${ch.number} · ${ch.short.toUpperCase()}`;
    return (
      <BookPage side={dual && i % 2 === 0 ? 'left' : 'right'} folio={i + 1} chapterLabel={label}>
        {p.node}
      </BookPage>
    );
  };

  const chapterIndex = (() => {
    let c = 0;
    CHAPTERS.forEach((ch, i) => {
      if (ch.page <= index) c = i;
    });
    return c;
  })();

  /* ── navigation ────────────────────────────────────────────── */
  /** Fade/slide transition used for single-page view, reduced motion and chapter jumps. */
  const swap = useCallback((target: number, dir: 'next' | 'prev') => {
    const pagesEl = spreadRef.current?.querySelector('.spread-pages');
    if (!pagesEl) {
      setIndex(target);
      busy.current = false;
      return;
    }
    const R = reducedRef.current;
    gsap.to(pagesEl, {
      opacity: 0,
      x: R ? 0 : dir === 'next' ? -26 : 26,
      duration: R ? 0.1 : 0.2,
      ease: 'power2.in',
      onComplete: () => {
        pendingIn.current = dir;
        setIndex(target);
      },
    });
  }, []);

  useLayoutEffect(() => {
    const dir = pendingIn.current;
    if (!dir) return;
    pendingIn.current = null;
    const pagesEl = spreadRef.current?.querySelector('.spread-pages');
    if (!pagesEl) {
      busy.current = false;
      return;
    }
    const R = reducedRef.current;
    gsap.fromTo(
      pagesEl,
      { opacity: 0, x: R ? 0 : dir === 'next' ? 26 : -26 },
      { opacity: 1, x: 0, duration: R ? 0.12 : 0.32, ease: 'power2.out', onComplete: () => void (busy.current = false) },
    );
  }, [index]);

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (busy.current) return;
      const target = dir === 'next' ? index + step : index - step;
      if (target < 0 || target > maxIndex) return;
      busy.current = true;
      sound.play('pageTurn');
      if (dual && !reducedRef.current) setTurn({ dir, from: index });
      else swap(target, dir);
    },
    [dual, index, maxIndex, step, swap],
  );

  const goToChapter = useCallback(
    (ci: number) => {
      if (busy.current) return;
      const raw = CHAPTERS[ci].page;
      const target = dual ? raw - (raw % 2) : raw;
      if (target === index) return;
      const dir = target > index ? 'next' : 'prev';
      if (dual && !reducedRef.current && Math.abs(target - index) === 2) {
        go(dir);
        return;
      }
      busy.current = true;
      sound.play('pageTurn');
      swap(target, dir);
    },
    [dual, go, index, swap],
  );

  // 3D page turn
  useLayoutEffect(() => {
    if (!turn) return;
    const el = flipperRef.current;
    if (!el) return;
    const tl = gsap.timeline({
      onComplete: () => {
        setIndex(turn.dir === 'next' ? turn.from + 2 : turn.from - 2);
        setTurn(null);
        busy.current = false;
      },
    });
    tl.fromTo(el, { rotationY: 0 }, { rotationY: turn.dir === 'next' ? -180 : 180, duration: 1.1, ease: 'power2.inOut' }, 0).fromTo(
      el.querySelectorAll('.flip-shade'),
      { opacity: 0 },
      { opacity: 0.5, duration: 0.55, yoyo: true, repeat: 1, ease: 'sine.inOut' },
      0,
    );
    return () => {
      tl.kill();
    };
  }, [turn]);

  // Keyboard: arrow keys turn pages (not while a dialog is open or a field is focused).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openProject || navOpen) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') go('next');
      else if (e.key === 'ArrowLeft') go('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, openProject, navOpen]);

  // Swipe (touch / pen)
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 'next' : 'prev');
  };

  /* ── entrance: the first chapter appears on the open pages ── */
  useLayoutEffect(() => {
    const R = reducedRef.current;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ onComplete: () => enteredRef.current() })
        .fromTo(
          '.portfolio-stage',
          { opacity: 0, scale: R ? 1 : 0.88, y: R ? 0 : 24 },
          { opacity: 1, scale: 1, y: 0, duration: R ? 0.4 : 1.1, ease: 'power3.out' },
        )
        .fromTo(
          '.portfolio-fade',
          { autoAlpha: 0, y: R ? 0 : 10 },
          { autoAlpha: 1, y: 0, duration: R ? 0.3 : 0.6, stagger: 0.1, ease: 'power2.out' },
          '-=0.45',
        );
    }, root);
    return () => ctx.revert();
  }, []);

  const status = dual ? `Pages ${index + 1}–${index + 2} of ${PAGE_COUNT}` : `Page ${index + 1} of ${PAGE_COUNT}`;
  const locked = turn !== null;

  return (
    <div ref={root} className="portfolio">
      <h1 className="sr-only">DP Studio — My 6-month journey. Welcome, {name}.</h1>

      <header className="portfolio-header portfolio-fade">
        <Logo height={34} />
        <ChapterNavigation current={chapterIndex} open={navOpen} onOpenChange={setNavOpen} onSelect={goToChapter} />
      </header>

      <div className="portfolio-stage">
        <div className={`spread-frame${dual ? '' : ' spread-frame--single'}`}>
          <div
            ref={spreadRef}
            className={`spread${dual ? '' : ' spread--single'}`}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
          >
            <div className="spread-pages">
              {dual ? (
                turn ? (
                  turn.dir === 'next' ? (
                    <>
                      {renderPage(index)}
                      {renderPage(index + 3)}
                    </>
                  ) : (
                    <>
                      {renderPage(index - 2)}
                      {renderPage(index + 1)}
                    </>
                  )
                ) : (
                  <>
                    {renderPage(index)}
                    {renderPage(index + 1)}
                  </>
                )
              ) : (
                renderPage(index)
              )}
            </div>

            {dual && turn && (
              <div ref={(el) => { flipperRef.current = el; markInert(el); }} className={`flipper flipper--${turn.dir}`} aria-hidden="true">
                <div className="flip-face flip-front">
                  {renderPage(turn.dir === 'next' ? index + 1 : index)}
                  <span className="flip-shade" />
                </div>
                <div className="flip-face flip-back">
                  {renderPage(turn.dir === 'next' ? index + 2 : index - 1)}
                  <span className="flip-shade" />
                </div>
              </div>
            )}

            {dual && <span className="gutter" aria-hidden="true" />}
          </div>
        </div>
      </div>

      <div className="portfolio-controls portfolio-fade">
        <button type="button" className="btn btn-ghost nav-btn" onClick={() => go('prev')} disabled={index <= 0 || locked} aria-label="Previous page">
          <ChevronLeft size={18} aria-hidden="true" />
          <span>Prev</span>
        </button>
        <p className="page-status" aria-live="polite">
          <strong>{CHAPTERS[chapterIndex].short}</strong>
          <span>{status}</span>
        </p>
        <button type="button" className="btn btn-ghost nav-btn" onClick={() => go('next')} disabled={index >= maxIndex || locked} aria-label="Next page">
          <span>Next</span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {openProject && (
        <ProjectDetail project={openProject} onClose={() => setOpenProject(null)} onNavigate={setOpenProject} />
      )}
    </div>
  );
}
