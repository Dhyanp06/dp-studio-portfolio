/**
 * Personal details and links — edit freely.
 * The URLs below are PLACEHOLDERS until you add your real ones.
 */
export const PROFILE = {
  brand: 'DP Studio',
  person: 'Dhyan Patel',
  role: 'Graphic Designer Intern',
  company: 'CreatPix Infotech LLP',
  period: 'MAY 2026 — OCTOBER 2026',
};

export type LinkKind = 'linkedin' | 'email' | 'portfolio' | 'other';

export interface ProfileLink {
  kind: LinkKind;
  label: string;
  href: string;
}

export const LINKS: ProfileLink[] = [
  { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-profile' },
  { kind: 'email', label: 'Email', href: 'mailto:hello@example.com' },
  { kind: 'portfolio', label: 'Portfolio projects', href: 'https://www.behance.net/your-profile' },
  { kind: 'other', label: 'Other profiles', href: 'https://www.instagram.com/your-profile' },
];
