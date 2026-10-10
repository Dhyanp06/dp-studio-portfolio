import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { COLLECTIONS, PROJECTS, isPlaceholder, type Project } from '../data/projects';
import { projectAsset } from '../utils/assets';
import Placeholder from './Placeholder';

interface Props {
  project: Project;
  onClose: () => void;
  onNavigate: (p: Project) => void;
}

function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ba">
      <div className="ba-stage">
        <img src={after} alt={`${title} — after`} loading="lazy" decoding="async" />
        <img
          className="ba-before"
          src={before}
          alt={`${title} — before`}
          loading="lazy"
          decoding="async"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <span className="ba-line" style={{ left: `${pos}%` }} aria-hidden="true" />
      </div>
      <label className="ba-label">
        <span>Before ←→ After</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Before and after comparison" />
      </label>
    </div>
  );
}

/** A full book-spread view of a single project: media left, story right. */
export default function ProjectDetail({ project, onClose, onNavigate }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const siblings = PROJECTS.filter((p) => p.category === project.category);
  const idx = siblings.findIndex((p) => p.id === project.id);
  const prev = idx > 0 ? siblings[idx - 1] : undefined;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : undefined;

  const img = projectAsset(project.image);
  const video = projectAsset(project.video);
  const before = projectAsset(project.before);
  const after = projectAsset(project.after);
  const category = COLLECTIONS.find((c) => c.id === project.category)?.label;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight' && next) onNavigate(next);
      else if (e.key === 'ArrowLeft' && prev) onNavigate(prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, next, prev]);

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-spread">
        <button ref={closeRef} type="button" className="icon-btn detail-close" onClick={onClose} aria-label="Close project">
          <X size={18} />
        </button>

        <div className="detail-page detail-media">
          {before && after ? (
            <BeforeAfter before={before} after={after} title={project.title} />
          ) : video ? (
            <video src={video} controls playsInline preload="metadata" poster={img} />
          ) : img ? (
            <img src={img} alt={project.title} loading="lazy" decoding="async" />
          ) : (
            <Placeholder label="Your project image or video goes here" ratio="4 / 5" />
          )}
        </div>

        <div className="detail-page detail-copy">
          <p className="eyebrow">{category}</p>
          <h2 id="detail-title" className="page-h2">
            {project.title}
          </h2>
          <span className="rule" aria-hidden="true" />
          <p className="page-p">{project.description}</p>
          {isPlaceholder(project) && <p className="ph-tag">PLACEHOLDER — EDIT IN src/data/projects.ts</p>}
          {project.details && project.details.length > 0 && (
            <ul className="detail-list">
              {project.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <div className="detail-nav">
            <button type="button" className="btn btn-ghost" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </button>
            <button type="button" className="btn btn-ghost" disabled={!next} onClick={() => next && onNavigate(next)}>
              Next <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
