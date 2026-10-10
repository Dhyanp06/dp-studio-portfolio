import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';

interface Props {
  current: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (chapterIndex: number) => void;
}

/**
 * Chapter overview (a dialog) plus a compact set of chapter "bookmarks".
 * Fully operable without any page-turn gesture.
 */
export default function ChapterNavigation({ current, open, onOpenChange, onSelect }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const select = (i: number) => {
    onSelect(i);
    onOpenChange(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <nav className="bookmarks" aria-label="Chapters">
        <button ref={triggerRef} type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenChange(true)} aria-haspopup="dialog">
          <BookOpen size={15} aria-hidden="true" /> Contents
        </button>
        <ol className="dots">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`dot${i === current ? ' is-current' : ''}`}
                onClick={() => select(i)}
                aria-label={`Chapter ${c.number}: ${c.short}`}
                aria-current={i === current ? 'true' : undefined}
                title={c.short}
              />
            </li>
          ))}
        </ol>
      </nav>

      {open &&
        createPortal(
        <div className="overview-backdrop" onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}>
          <div className="overview" role="dialog" aria-modal="true" aria-labelledby="overview-title">
            <button type="button" className="icon-btn overview-close" onClick={() => onOpenChange(false)} aria-label="Close contents">
              <X size={18} />
            </button>
            <p className="eyebrow">CHAPTER OVERVIEW</p>
            <h2 id="overview-title" className="page-h2">
              Contents
            </h2>
            <ol className="overview-list">
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <button
                    ref={i === 0 ? firstRef : undefined}
                    type="button"
                    className={`overview-item${i === current ? ' is-current' : ''}`}
                    onClick={() => select(i)}
                    aria-current={i === current ? 'true' : undefined}
                  >
                    <span className="overview-num">{c.number}</span>
                    <span className="overview-text">
                      <strong>{c.short}</strong>
                      <small>Pages {c.page + 1}–{c.page + 2}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
