import { COLLECTIONS, PROJECTS, isPlaceholder, type CollectionId, type Project } from '../data/projects';
import { projectAsset } from '../utils/assets';
import Placeholder from './Placeholder';
import { Play } from 'lucide-react';

interface PickerProps {
  value: CollectionId;
  onChange: (id: CollectionId) => void;
}

/** Left page of Chapter 03 — choose a collection. */
export function CollectionPicker({ value, onChange }: PickerProps) {
  return (
    <ul className="collection-list" aria-label="Project collections">
      {COLLECTIONS.map((c, i) => {
        const count = PROJECTS.filter((p) => p.category === c.id).length;
        const active = c.id === value;
        return (
          <li key={c.id}>
            <button
              type="button"
              className={`collection-btn${active ? ' is-active' : ''}`}
              onClick={() => onChange(c.id)}
              aria-pressed={active}
            >
              <span className="collection-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="collection-text">
                <strong>{c.label}</strong>
                <small>{c.blurb}</small>
              </span>
              <span className="collection-count" aria-label={`${count} projects`}>
                {count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface CardProps {
  project: Project;
  onOpen: (p: Project) => void;
}

function ProjectCard({ project, onOpen }: CardProps) {
  const img = projectAsset(project.image);
  const hasVideo = Boolean(project.video);
  return (
    <li>
      <button type="button" className="project-card" onClick={() => onOpen(project)} aria-label={`Open project: ${project.title}`}>
        <span className="project-media">
          {img ? (
            <img src={img} alt={project.title} loading="lazy" decoding="async" />
          ) : (
            <Placeholder label={isPlaceholder(project) ? 'Placeholder' : 'Add image'} compact ratio="4 / 3" />
          )}
          {hasVideo && (
            <span className="project-badge">
              <Play size={12} aria-hidden="true" /> Video
            </span>
          )}
        </span>
        <span className="project-meta">
          <strong>{project.title}</strong>
          <small>{COLLECTIONS.find((c) => c.id === project.category)?.label}</small>
        </span>
      </button>
    </li>
  );
}

interface GridProps {
  collection: CollectionId;
  onOpen: (p: Project) => void;
}

/** Right page of Chapter 03 — the projects in the chosen collection. */
export function ProjectGrid({ collection, onOpen }: GridProps) {
  const info = COLLECTIONS.find((c) => c.id === collection)!;
  const items = PROJECTS.filter((p) => p.category === collection);
  return (
    <div className="project-grid-wrap">
      <p className="eyebrow">COLLECTION</p>
      <h3 className="page-h3">{info.label}</h3>
      <p className="page-p">{info.blurb}</p>
      {items.length === 0 ? (
        <p className="empty-note">No projects in this collection yet — add some in src/data/projects.ts.</p>
      ) : (
        <ul className="project-grid">
          {items.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </div>
  );
}
