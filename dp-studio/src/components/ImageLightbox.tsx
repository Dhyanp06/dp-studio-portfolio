import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import type { ImageLink } from '../data/imageLinks';

interface Props {
  src: string;
  title: string;
  /** Link button under the image (null = no button). */
  link: ImageLink | null;
  onClose: () => void;
}

/**
 * Full-view popup for an image: the picture at full size, a circular ✕ close button
 * (top-right), and a button that opens another website in a new tab.
 * Closes with the ✕, the Esc key, or a click on the dark backdrop.
 */
export default function ImageLightbox({ src, title, link, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // move focus into the popup, and give it back to the image that opened it afterwards
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Capture phase: this popup handles the keys first so Esc doesn't also close a project
  // behind it, and the arrow keys don't turn the book's pages underneath.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopImmediatePropagation();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]'));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return createPortal(
    <div
      className="lb-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      // React events bubble through portals — keep swipes/clicks here from reaching the book underneath
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={dialogRef} className="lb" role="dialog" aria-modal="true" aria-label={`${title} — full view`}>
        <button ref={closeRef} type="button" className="icon-btn lb-close" onClick={onClose} aria-label="Close full view">
          <X size={22} aria-hidden="true" />
        </button>

        <img className="lb-img" src={src} alt={title} decoding="async" draggable={false} />

        <div className="lb-bar">
          <span className="lb-title">{title}</span>
          {link && (
            <a className="lb-link" href={link.href} target="_blank" rel="noopener noreferrer">
              <span>{link.label}</span>
              <ExternalLink size={16} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
