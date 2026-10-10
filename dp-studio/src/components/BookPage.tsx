import type { ReactNode } from 'react';

interface Props {
  side: 'left' | 'right';
  /** 1-based page number shown in the folio. */
  folio: number;
  chapterLabel: string;
  children: ReactNode;
}

/** One printed page of the open book. Content scrolls inside it if it overflows. */
export default function BookPage({ side, folio, chapterLabel, children }: Props) {
  return (
    <div className={`book-page book-page--${side}`} role="group" aria-label={`Page ${folio}`}>
      <header className="page-head">{chapterLabel}</header>
      <div className="page-scroll">{children}</div>
      <footer className="page-folio">{String(folio).padStart(2, '0')}</footer>
    </div>
  );
}
