/**
 * Chapter content — edit freely. Items marked `placeholder: true` are
 * prompts for you to rewrite; they are shown with a "placeholder" tag.
 * Only facts you supplied are stated as fact (company, role, May–Oct 2026).
 */
export interface ChapterMeta {
  id: string;
  number: string;
  short: string;
  title: string;
  /** Index of the chapter's first (left) page in the book. */
  page: number;
}

export const CHAPTERS: ChapterMeta[] = [
  { id: 'beginning', number: '01', short: 'The Beginning', title: 'EVERY JOURNEY STARTS SOMEWHERE.', page: 0 },
  { id: 'craft', number: '02', short: 'Learning the Craft', title: 'LEARNING. EXPERIMENTING. IMPROVING.', page: 2 },
  { id: 'work', number: '03', short: 'My Creative Work', title: 'MY CREATIVE WORK.', page: 4 },
  { id: 'process', number: '04', short: 'The Design Process', title: 'FROM BRIEF TO FINAL DESIGN.', page: 6 },
  { id: 'growth', number: '05', short: 'Six Months of Growth', title: 'SIX MONTHS OF GROWTH.', page: 8 },
  {
    id: 'thanks',
    number: '∞',
    short: 'Thank You, CreatPix',
    title: 'SIX MONTHS. COUNTLESS IDEAS. ONE UNFORGETTABLE CHAPTER.',
    page: 10,
  },
];

export const PAGE_COUNT = 12;

export interface EditableText {
  text: string;
  placeholder?: boolean;
}

export interface Sample {
  label: string;
  /** File name in src/assets/projects (or a full URL). */
  image?: string;
}

/* ── Chapter 01 ─────────────────────────────────────────────── */
export const BEGINNING = {
  intro:
    'In May 2026 I began a six-month internship as a Graphic Designer Intern at CreatPix Infotech LLP. This book is a record of that journey — the work, the lessons and the growth.',
  expectations: {
    text: 'Write about what you hoped to learn and achieve when the internship began.',
    placeholder: true,
  } as EditableText,
  earlyWork: {
    text: 'Describe your first design tasks and what they taught you.',
    placeholder: true,
  } as EditableText,
  timeline: [
    { label: 'MAY 2026', text: 'The internship begins at CreatPix Infotech LLP.' },
    { label: 'THE FIRST WEEKS', text: 'Edit: your first tasks and early learning.', placeholder: true },
    { label: 'LOOKING AHEAD', text: 'Edit: what you set out to achieve.', placeholder: true },
  ] as (EditableText & { label: string })[],
  samples: [
    { label: 'Early work 01', image: 'early-1' },
    { label: 'Early work 02', image: 'early-2' },
    { label: 'Early work 03', image: 'early-3' },
  ] as Sample[],
};

/* ── Chapter 02 ─────────────────────────────────────────────── */
export interface CraftCategory {
  id: string;
  title: string;
  blurb: string;
  samples: Sample[];
}

export const CRAFT = {
  intro:
    'Design is a craft learned by doing. These are the areas I explored and practised along the way.',
  categories: [
    { id: 'type', title: 'Typography', blurb: 'Choosing, pairing and setting type with intent.' },
    { id: 'layout', title: 'Layout & Composition', blurb: 'Grids, spacing and balance on the page.' },
    { id: 'color', title: 'Color & Visual Hierarchy', blurb: 'Guiding the eye with colour and contrast.' },
  ].map((c) => ({ ...c, samples: [1, 2].map((n) => ({ label: `${c.title} — sample ${n}`, image: `craft-${c.id}-${n}` })) })) as CraftCategory[],
};

/* ── Chapter 04 ─────────────────────────────────────────────── */
export interface ProcessStep {
  id: string;
  title: string;
  text: string;
  placeholder?: boolean;
  image?: string;
}

export const PROCESS = {
  intro: 'Every design starts with a question. This is how a brief becomes a finished piece.',
  steps: [
    { id: 'brief', title: 'Brief / Objective', text: 'Edit: what was the goal and who was it for?' },
    { id: 'concept', title: 'Initial Concept', text: 'Edit: your first ideas, sketches or moodboard.' },
    { id: 'explore', title: 'Visual Exploration', text: 'Edit: the directions you tried — type, colour, layout.' },
    { id: 'feedback', title: 'Feedback & Revisions', text: 'Edit: what changed after review, and why.' },
    { id: 'final', title: 'Final Design', text: 'Edit: the finished piece and what you learned.' },
  ].map((s, i) => ({ ...s, placeholder: true, image: `process-${i + 1}-${s.id}` })) as ProcessStep[],
};

/* ── Chapter 05 ─────────────────────────────────────────────── */
export interface Month {
  month: string;
  label: string;
  text: string;
}

/** Labels and text are editable — change them to match what actually happened. */
export const GROWTH = {
  intro: 'Six months, six themes — a month-by-month look at how I grew as a designer.',
  months: [
    {
      month: 'MAY',
      label: 'BEGINNING',
      text: 'I joined CreatPix Infotech LLP as a Graphic Designer Intern and started learning how design work is planned and delivered.',
    },
    {
      month: 'JUNE',
      label: 'LEARNING',
      text: 'I built my foundations in typography, layout and colour, and became more confident with my design tools.',
    },
    {
      month: 'JULY',
      label: 'EXPERIMENTING',
      text: 'I tried new ideas and tools, including AI assistants like ChatGPT, Claude and Sarvam AI, to explore different directions for my designs.',
    },
    {
      month: 'AUGUST',
      label: 'CREATING',
      text: 'I started creating finished pieces, such as logos, an avatar and posts for CreatPix, taking each one from idea to final design.',
    },
    {
      month: 'SEPTEMBER',
      label: 'REFINING',
      text: 'I focused on the details, like spacing, hierarchy and consistency, and improved my work by revising it.',
    },
    {
      month: 'OCTOBER',
      label: 'REFLECTING',
      text: 'I looked back on the six months, from my first designs to my reels, logos and posts, and on how much I have grown as a designer.',
    },
  ] as Month[],
};

/* ── Final chapter ──────────────────────────────────────────── */
export const THANKS = {
  message: 'Thank you to CreatPix Infotech LLP for being part of my growth as a designer.',
  closing: 'THE BOOK CLOSES. THE STORY CONTINUES.',
};
