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
];

export const getArchiveProject = (slug: string): ArchiveProject | undefined =>
  archiveProjects.find((p) => p.slug === slug);
