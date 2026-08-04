/**
 * Archive projects: older client work shown as image galleries at /archive.
 *
 * Images live in public/images/archive/<slug>/ as <slug>-NN.webp.
 * Every image in a project shares the same native ratio (width x height),
 * so grids can render exact aspect ratios with no cropping.
 *
 * name/description are display copy. Edit freely.
 */

export interface ArchiveProject {
  slug: string;
  name: string;
  description: string;
  hidden?: boolean;
  width: number;
  height: number;
  images: string[];
}

const imagePaths = (slug: string, count: number): string[] =>
  Array.from(
    { length: count },
    (_, i) => `/images/archive/${slug}/${slug}-${String(i + 1).padStart(2, '0')}.webp`
  );

export const archiveProjects: ArchiveProject[] = [
  {
    slug: 'nsf-project',
    name: 'NSF Project',
    description:
      'Clothing brand taken end to end: original illustration in vector and pencil, brand development, print specifications, garment and material selection, through to production.',
    width: 1600,
    height: 1200,
    images: imagePaths('nsf-project', 16),
  },
  {
    slug: 'musica',
    name: 'Musica',
    description:
      'Magazine print series and in-store point of sale: banners, stickers and A-frame displays. Illustrated and concepted from scratch, carried through print production.',
    width: 1600,
    height: 1200,
    images: imagePaths('musica', 9),
  },
  {
    slug: 'icgeb',
    name: 'ICGEB',
    description: 'Design and print production of a conference booklet.',
    width: 1440,
    height: 1000,
    images: imagePaths('icgeb', 5),
  },
  {
    slug: 'expo-pro',
    name: 'Expo Pro',
    description:
      'Complete brand identity system: brand development and strategy, business cards, letterhead and website.',
    width: 1440,
    height: 1000,
    images: imagePaths('expo-pro', 4),
  },
  {
    slug: 'uct',
    name: 'UCT',
    description:
      'Brochure designed from scratch with no template, including original photography and typesetting.',
    width: 1440,
    height: 1000,
    images: imagePaths('uct', 3),
  },
  {
    slug: 'bold-signs',
    name: 'Bold Signs',
    hidden: true,
    description:
      'Website for a Cape Town signage studio: a bold, gallery-driven site that matches the craft of the work it sells.',
    width: 1440,
    height: 900,
    images: [
      '/images/work/bold-signs-hero.webp',
      '/images/work/bold-signs-work.webp',
    ],
  },
  {
    slug: 'ecos-consulting',
    name: 'Ecos Consulting',
    hidden: true,
    description:
      'Web presence for a Cape Town environmental consulting firm: a fast, credible B2B site the client updates themselves.',
    width: 1280,
    height: 720,
    images: [
      '/images/work/ecos-consulting-website-1.webp',
      '/images/work/ecos-consulting-website-2.webp',
    ],
  },
  {
    slug: 'brand-marks',
    name: 'Brand Marks',
    hidden: true,
    description:
      'A collection of brand marks from years of identity work, across hospitality, healthcare, technology, retail, and more.',
    width: 1440,
    height: 1020,
    images: [
      '/images/client-logos/amra-logo.webp',
      '/images/client-logos/arabica-logo.webp',
      '/images/client-logos/clicks-hc-conf-logo.webp',
      '/images/client-logos/cloud-logo.webp',
      '/images/client-logos/dr-logo.webp',
      '/images/client-logos/ecos-logo.webp',
      '/images/client-logos/edge-logo.webp',
      '/images/client-logos/expo-logo.webp',
      '/images/client-logos/kota-logo.webp',
      '/images/client-logos/mizan-logo.webp',
      '/images/client-logos/passiflora-logo.webp',
      '/images/client-logos/pastelle-logo.webp',
      '/images/client-logos/qamar-logo.webp',
      '/images/client-logos/ridenote-logo.webp',
      '/images/client-logos/ses-logo.webp',
      '/images/client-logos/straptec-logo.webp',
      '/images/client-logos/zahra-logo.webp',
    ],
  },
];

export const visibleArchiveProjects = archiveProjects.filter((p) => !p.hidden);

export const getArchiveProject = (slug: string): ArchiveProject | undefined =>
  archiveProjects.find((p) => p.slug === slug);
