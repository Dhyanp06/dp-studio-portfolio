/**
 * Project gallery data — edit this file to add your real work.
 *
 * Put image/video files in `src/assets/projects/` and reference them by file
 * name. Anything without an `image`/`video` is shown as a clearly labelled
 * placeholder. Nothing here is a real client or result — replace it all.
 */
import { projectAsset } from '../utils/assets';

export type CollectionId = 'social' | 'banners' | 'email' | 'motion' | 'campaign' | 'other';

export interface Collection {
  id: CollectionId;
  label: string;
  blurb: string;
}

export interface Project {
  id: string;
  title: string;
  category: CollectionId;
  description: string;
  /** File name in src/assets/projects (or a full URL). */
  image?: string;
  /** Optional video file name; shown instead of the image when present. */
  video?: string;
  /** Optional bullet-point details (tools, format, your role…). */
  details?: string[];
  /** Optional before / after pair — both are needed to show the comparison. */
  before?: string;
  after?: string;
}

export const COLLECTIONS: Collection[] = [
  { id: 'social', label: 'Social Media Creatives', blurb: 'Posts, carousels and stories.' },
  { id: 'banners', label: 'Marketing Banners', blurb: 'Web and promotional banners.' },
  { id: 'email', label: 'Email Templates', blurb: 'Layouts designed for the inbox.' },
  { id: 'motion', label: 'Reels and Motion Graphics', blurb: 'Short-form video and motion.' },
  { id: 'campaign', label: 'Campaign Creatives', blurb: 'Multi-piece campaign work.' },
  { id: 'other', label: 'Other Graphic Design Work', blurb: 'Everything else from the journey.' },
];

const PLACEHOLDER_DESCRIPTION =
  'Placeholder — replace this with a short description of the project and your role in it.';

const placeholders = (category: CollectionId, label: string): Project[] =>
  [1, 2].map((n) => ({
    id: `${category}-${n}`,
    title: `${label} 0${n}`,
    category,
    // Drop `<category>-<n>.jpg|png|webp` into src/assets/projects/ (e.g. social-1.jpg)
    image: `${category}-${n}`,
    description: PLACEHOLDER_DESCRIPTION,
    details: ['Add tools used', 'Add format / size', 'Add your contribution'],
  }));

export const PROJECTS: Project[] = [
  ...placeholders('social', 'Social Media Creative'),
  ...placeholders('banners', 'Marketing Banner'),
  ...placeholders('email', 'Email Template'),
  ...placeholders('motion', 'Reel / Motion Piece'),
  ...placeholders('campaign', 'Campaign Creative'),
  ...placeholders('other', 'Design Work'),
];

export const isPlaceholder = (p: Project) => !projectAsset(p.image) && !projectAsset(p.video);
