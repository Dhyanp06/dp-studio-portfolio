import { BEGINNING, CHAPTERS, CRAFT, GROWTH, PROCESS, type EditableText, type Sample } from '../data/chapters';
import { PROFILE } from '../data/profile';
import { projectAsset } from '../utils/assets';
import Placeholder from './Placeholder';

/* ── shared bits ─────────────────────────────────────────────── */

function Editable({ item, as: Tag = 'p' }: { item: EditableText; as?: 'p' | 'span' }) {
  return (
    <Tag className={item.placeholder ? 'ph-text' : 'page-p'}>
      {item.text}
      {item.placeholder && <span className="ph-tag">PLACEHOLDER</span>}
    </Tag>
  );
}

function Figure({ sample, ratio = '4 / 3' }: { sample: Sample; ratio?: string }) {
  const src = projectAsset(sample.image);
  return (
    <figure className="figure">
      {src ? (
        <img src={src} alt={sample.label} loading="lazy" decoding="async" style={{ aspectRatio: ratio }} />
      ) : (
        <Placeholder label={sample.label} compact ratio={ratio} />
      )}
      <figcaption>{sample.label}</figcaption>
    </figure>
  );
}

function TitlePage({ index, children }: { index: number; children?: React.ReactNode }) {
  const ch = CHAPTERS[index];
  return (
    <div className="chapter-title-page">
      <p className="eyebrow">CHAPTER {ch.number}</p>
      <h2 className="display">{ch.title}</h2>
      <span className="rule" aria-hidden="true" />
      {children}
    </div>
  );
}

/* ── Chapter 01 · The Beginning ──────────────────────────────── */

export function BeginningLeft() {
  return (
    <TitlePage index={0}>
      <p className="page-p lead">{BEGINNING.intro}</p>
      <p className="byline">
        {PROFILE.role} · {PROFILE.company}
        <br />
        {PROFILE.period}
      </p>
    </TitlePage>
  );
}

export function BeginningRight() {
  return (
    <div className="stack">
      <section>
        <h3 className="page-h3">Starting out</h3>
        <ol className="mini-timeline">
          {BEGINNING.timeline.map((t) => (
            <li key={t.label}>
              <span className="mt-label">{t.label}</span>
              <Editable item={t} />
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="page-h3">My initial expectations</h3>
        <Editable item={BEGINNING.expectations} />
      </section>
      <section>
        <h3 className="page-h3">Early design work &amp; learning</h3>
        <Editable item={BEGINNING.earlyWork} />
        <div className="figure-row">
          {BEGINNING.samples.map((s) => (
            <Figure key={s.label} sample={s} ratio="1 / 1" />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Chapter 02 · Learning the Craft ─────────────────────────── */

export function CraftLeft() {
  return (
    <TitlePage index={1}>
      <p className="page-p lead">{CRAFT.intro}</p>
      <ul className="chip-list" aria-label="Areas explored">
        {CRAFT.categories.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
    </TitlePage>
  );
}

export function CraftRight() {
  return (
    <div className="stack">
      {CRAFT.categories.map((c) => (
        <section key={c.id}>
          <h3 className="page-h3">{c.title}</h3>
          <p className="page-p small">{c.blurb}</p>
          <div className="figure-row figure-row--2">
            {c.samples.map((s) => (
              <Figure key={s.label} sample={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ── Chapter 03 · My Creative Work (title page; grid lives in ProjectGallery) ── */

export function WorkLeft({ children }: { children: React.ReactNode }) {
  return (
    <TitlePage index={2}>
      <p className="page-p lead">Choose a collection, then open any project to see it as a full spread.</p>
      {children}
    </TitlePage>
  );
}

/* ── Chapter 04 · The Design Process ─────────────────────────── */

export function ProcessLeft() {
  return (
    <TitlePage index={3}>
      <p className="page-p lead">{PROCESS.intro}</p>
      <ol className="step-list">
        {PROCESS.steps.map((s, i) => (
          <li key={s.id}>
            <span className="step-num">{i + 1}</span>
            {s.title}
          </li>
        ))}
      </ol>
    </TitlePage>
  );
}

export function ProcessRight() {
  return (
    <div className="stack">
      {PROCESS.steps.map((s, i) => (
        <section key={s.id} className="process-card">
          <h3 className="page-h3">
            <span className="step-num">{i + 1}</span> {s.title}
          </h3>
          <Editable item={{ text: s.text, placeholder: s.placeholder }} />
          <Figure sample={{ label: `${s.title} — sample`, image: s.image }} ratio="16 / 9" />
        </section>
      ))}
    </div>
  );
}

/* ── Chapter 05 · Six Months of Growth ───────────────────────── */

function MonthList({ from, to }: { from: number; to: number }) {
  return (
    <ol className="growth-timeline">
      {GROWTH.months.slice(from, to).map((m) => (
        <li key={m.month}>
          <span className="growth-dot" aria-hidden="true" />
          <h3 className="growth-title">
            {m.month} — {m.label}
          </h3>
          <p className="ph-text">
            {m.text}
            <span className="ph-tag">EDITABLE</span>
          </p>
        </li>
      ))}
    </ol>
  );
}

export function GrowthLeft() {
  return (
    <TitlePage index={4}>
      <p className="page-p lead">{GROWTH.intro}</p>
      <MonthList from={0} to={3} />
    </TitlePage>
  );
}

export function GrowthRight() {
  return <MonthList from={3} to={6} />;
}
