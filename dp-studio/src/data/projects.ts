/**
 * Project gallery data — edit this file to add your real work.
 *
 * Put image/video files in `src/assets/projects/` and reference them by file
 * name. Anything without an `image`/`video` is shown as a clearly labelled
 * placeholder. Nothing here is a real client or result — replace it all.
 */
import { projectAsset } from '../utils/assets';

export type CollectionId = 'reels' | 'logos' | 'avatar' | 'creatpix';

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
  { id: 'reels', label: 'Reels', blurb: 'Short-form reels I designed.' },
  { id: 'logos', label: 'Logo Designs', blurb: 'Logos I designed.' },
  { id: 'avatar', label: 'Avatar Design', blurb: 'An avatar I designed.' },
  { id: 'creatpix', label: 'CreatPix Posts', blurb: 'Posts I designed at CreatPix Infotech.' },
];

/*
 * Tools used — edit these two lines if the list changes, they feed every project below.
 * Reels: motion + music.   Design: logos, avatar and posts.
 */
const REEL_TOOLS = 'Tools: Canva, Adobe After Effects, ChatGPT, Claude, Sarvam AI';
const REEL_MUSIC = 'Music: ElevenLabs';
const DESIGN_TOOLS = 'Tools: Canva, ChatGPT, Claude, Sarvam AI';

/** Reels are MP4 videos: put `reels-1.mp4` in the folder. An optional cover is `reels-1-cover.jpg`. */
const reel = (n: number, description: string): Project => ({
  id: `reels-${n}`,
  title: `Reel 0${n}`,
  category: 'reels',
  video: `reels-${n}.mp4`,
  image: `reels-${n}-cover`,
  description,
  details: [REEL_TOOLS, REEL_MUSIC, 'Format: Short-form reel'],
});

/** Pictures: put `<id>.jpg|png|webp` in the folder (e.g. logos-1.png). */
const design = (category: CollectionId, n: number, title: string, description: string, format: string): Project => ({
  id: `${category}-${n}`,
  title,
  category,
  image: `${category}-${n}`,
  description,
  details: [DESIGN_TOOLS, format],
});

export const PROJECTS: Project[] = [
  reel(
    1,
    'A short-form reel I designed from idea to finished video. I shaped the concept and script with AI assistants, built the visuals in Canva, added the motion in Adobe After Effects, and created the music track with ElevenLabs.',
  ),
  reel(
    2,
    'A second reel where I focused on clear, simple motion that keeps the message easy to follow. The visuals were designed in Canva, animated in Adobe After Effects, and paired with music made in ElevenLabs.',
  ),
  design(
    'logos',
    1,
    'Logo 01',
    'A logo I designed with a clean, simple mark that stays clear at small and large sizes. I explored ideas and directions with ChatGPT, Claude and Sarvam AI, then refined the final design in Canva.',
    'Format: Logo design',
  ),
  design(
    'logos',
    2,
    'Logo 02',
    'A second logo I designed, concentrating on shape, colour and balance. Ideas were explored with AI assistants, and the final artwork was built and polished in Canva.',
    'Format: Logo design',
  ),
  design(
    'avatar',
    1,
    'Avatar 01',
    'An avatar I designed to be friendly and easy to recognise as a profile image. I developed the idea with AI assistants and finished the artwork in Canva.',
    'Format: Avatar / profile image',
  ),
  design(
    'creatpix',
    1,
    'CreatPix Post 01',
    'A social media post I designed for CreatPix. I focused on a clear message, a strong layout and consistent colours, working in Canva with AI assistants helping with ideas and copy.',
    'Format: Social media post',
  ),
  design(
    'creatpix',
    2,
    'CreatPix Post 02',
    'Another CreatPix post, designed to keep the look consistent while giving the topic its own visual identity. Built in Canva, with ChatGPT, Claude and Sarvam AI supporting ideas and wording.',
    'Format: Social media post',
  ),
  design(
    'creatpix',
    3,
    'CreatPix Post 03',
    'A third CreatPix post that continues the same style. I paid attention to hierarchy and readability so the message is clear at a glance. Designed in Canva with AI-assisted ideas and copy.',
    'Format: Social media post',
  ),
];

export const isPlaceholder = (p: Project) => !projectAsset(p.image) && !projectAsset(p.video);
