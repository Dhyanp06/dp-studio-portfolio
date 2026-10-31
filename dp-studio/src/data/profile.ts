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
  { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/dhyan-patel-96852023a?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
  { kind: 'email', label: 'Email', href: 'mailto:dhyanpatel.2605@gmail.com' },
  { kind: 'portfolio', label: 'Portfolio projects', href: 'https://dhyanp06.github.io/dhyanpatel/' },
  { kind: 'other', label: 'Other profiles', href: 'https://www.instagram.com/djp26_05?srtk=MW43cnhoZXY5eDRmOA==' },
];

export interface CreatPixLink {
  name: string;
  note: string;
  href: string;
}

export const CREATPIX_LINKS: CreatPixLink[] = [
  { name: 'CreatPix', note: 'Company website', href: 'https://creatpix.com/' },
  { name: 'EcomSpy', note: 'Website', href: 'https://ecomspy.io/' },
  { name: 'AutoMinds', note: 'Shopify App Store app', href: 'https://apps.shopify.com/autominds-content-agent?search_id=f38bfa1c-931f-4d8d-ac99-1a59d9abe2f7&surface_detail=AutoMinds&surface_inter_position=1&surface_intra_position=2&surface_type=search' },
  { name: 'Lumos', note: 'Shopify App Store app', href: 'https://apps.shopify.com/lumos-llms-generator?search_id=e553b2bc-156a-4512-b9af-9d471622cab8&surface_detail=Lumos&surface_inter_position=1&surface_intra_position=3&surface_type=search' },
];
