import type { CSSProperties } from 'react';
import InteractiveLock from './InteractiveLock';
import Logo from './Logo';
import { PROFILE } from '../data/profile';

/** Visual page-block thickness in px (also used for the page z-spacing). */
export const BOOK_THICKNESS = 22;
export const LEAF_COUNT = 6;

interface Props {
  onLockActivate: () => void;
  lockDisabled: boolean;
}

/**
 * The 3D book, built from CSS 3D transforms (light and smooth — no WebGL).
 * It starts closed and locked; BookOpeningScene animates the same DOM through
 * reveal → unlock → opening, so there is never a jump between scenes.
 *
 * Replace the cover art by editing `.cover-front` in styles/globals.css or by
 * swapping the children of `.cover-front` below.
 */
export default function ClosedBookScene({ onLockActivate, lockDisabled }: Props) {
  const leafStep = BOOK_THICKNESS / (LEAF_COUNT + 2);

  return (
    <div className="book-camera" style={{ ['--thick' as string]: `${BOOK_THICKNESS}px` } as CSSProperties}>
      <div className="book-aura" aria-hidden="true" />
      <div className="book-shadow" aria-hidden="true" />

      <div className="book3d" role="group" aria-label="DP Studio journal — closed and locked">
        <div className="book-back" style={{ transform: `translateZ(${-BOOK_THICKNESS}px)` }} />
        <div className="page-edge" aria-hidden="true" />

        {Array.from({ length: LEAF_COUNT }, (_, i) => (
          <div
            key={i}
            className="leaf"
            style={{ transform: `translateZ(${-(i + 1) * leafStep}px)` }}
            aria-hidden="true"
          >
            <div className="leaf-face leaf-front" />
            <div className="leaf-face leaf-rear" />
          </div>
        ))}

        <div className="cover" style={{ transform: 'translateZ(1px)' }}>
          <div className="cover-face cover-front">
            <span className="corner corner--tl" aria-hidden="true" />
            <span className="corner corner--tr" aria-hidden="true" />
            <span className="corner corner--bl" aria-hidden="true" />
            <span className="corner corner--br" aria-hidden="true" />
            <span className="cover-spine" aria-hidden="true" />

            <div className="cover-top">
              <Logo height="100%" className="cover-logo" />
              <p className="cover-brand">DP STUDIO</p>
              <p className="cover-sub">MY 6-MONTH JOURNEY</p>
            </div>

            <InteractiveLock onActivate={onLockActivate} disabled={lockDisabled} />

            <p className="cover-company">{PROFILE.company.toUpperCase()}</p>
          </div>
          <div className="cover-face cover-inside" aria-hidden="true" />
          <div className="cover-shade" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
