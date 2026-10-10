import { ExternalLink, FolderOpen, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';
import { LINKS, type LinkKind } from '../data/profile';
import { THANKS } from '../data/chapters';
import { CHAPTERS } from '../data/chapters';

const ICONS: Record<LinkKind, typeof Mail> = {
  linkedin: Linkedin,
  email: Mail,
  portfolio: FolderOpen,
  other: ExternalLink,
};

/** Left page of the final chapter. */
export function FinalLeftPage() {
  const chapter = CHAPTERS[CHAPTERS.length - 1];
  return (
    <div className="chapter-title-page final-left">
      <p className="eyebrow">FINAL CHAPTER</p>
      <h2 className="display display--sm">{chapter.title}</h2>
      <span className="rule" aria-hidden="true" />
      <p className="page-p lead">“{THANKS.message}”</p>
    </div>
  );
}

/** Right page of the final chapter — logo, closing line and links. */
export function FinalRightPage() {
  return (
    <div className="final-right">
      <Logo height={84} />
      <p className="closing-line">{THANKS.closing}</p>
      <span className="rule" aria-hidden="true" />
      <ul className="link-list" aria-label="Contact and profile links">
        {LINKS.map((l) => {
          const Icon = ICONS[l.kind];
          const external = !l.href.startsWith('mailto:') && !l.href.startsWith('#');
          return (
            <li key={l.label}>
              <a
                className="link-btn"
                href={l.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{l.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="field-note">Links are placeholders — update them in src/data/profile.ts</p>
    </div>
  );
}

export default function FinalChapter() {
  return (
    <>
      <FinalLeftPage />
      <FinalRightPage />
    </>
  );
}
