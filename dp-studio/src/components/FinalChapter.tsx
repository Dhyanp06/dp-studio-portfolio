import { useState } from 'react';
import { Copy, ExternalLink, FolderOpen, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';
import { CREATPIX_LINKS, LINKS, type LinkKind } from '../data/profile';
import { THANKS } from '../data/chapters';
import { CHAPTERS } from '../data/chapters';

const ICONS: Record<LinkKind, typeof Mail> = {
  linkedin: Linkedin,
  email: Mail,
  portfolio: FolderOpen,
  other: ExternalLink,
};

/**
 * Extra ways to email when the visitor's computer has no default mail app (a plain mailto: link then
 * does nothing): open a Gmail compose tab, or copy the address.
 */
function EmailHelp({ href }: { href: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const address = decodeURIComponent(href.replace(/^mailto:/i, '').split('?')[0]);
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 3500);
  };
  return (
    <div className="email-help">
      <span className="email-help-text">No mail app opens?</span>
      <a href={gmail} target="_blank" rel="noopener noreferrer">
        Write in Gmail
      </a>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={copy}>
        <Copy size={12} aria-hidden="true" /> Copy address
      </button>
      <span className="email-help-status" role="status" aria-live="polite">
        {state === 'copied' ? 'Copied!' : state === 'failed' ? address : ''}
      </span>
    </div>
  );
}

/** Left page of the final chapter. */
export function FinalLeftPage() {
  const chapter = CHAPTERS[CHAPTERS.length - 1];
  return (
    <div className="chapter-title-page final-left">
      <p className="eyebrow">FINAL CHAPTER</p>
      <h2 className="display display--sm">{chapter.title}</h2>
      <span className="rule" aria-hidden="true" />
      <p className="page-p lead">“{THANKS.message}”</p>
      <section className="cp-block" aria-labelledby="cp-title">
        <h3 id="cp-title" className="page-h3">
          Explore CreatPix
        </h3>
        <p className="page-p small">Websites and Shopify apps by CreatPix Infotech LLP.</p>
        <ul className="cp-grid">
          {CREATPIX_LINKS.map((l) => {
            const inner = (
              <>
                <strong>{l.name}</strong>
                <small>{l.href ? l.note : 'Link coming soon'}</small>
              </>
            );
            return (
              <li key={l.name}>
                {l.href ? (
                  <a className="cp-card" href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`${l.name} — ${l.note} (opens in a new tab)`}>
                    {inner}
                    <ExternalLink size={14} aria-hidden="true" className="cp-ext" />
                  </a>
                ) : (
                  <span className="cp-card is-off" aria-disabled="true">
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
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
              {l.kind === 'email' && l.href.startsWith('mailto:') && <EmailHelp href={l.href} />}
            </li>
          );
        })}
      </ul>
      {LINKS.some((l) => /your-profile|example\.com/.test(l.href)) && (
        <p className="field-note">Links are placeholders — update them in src/data/profile.ts</p>
      )}
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
