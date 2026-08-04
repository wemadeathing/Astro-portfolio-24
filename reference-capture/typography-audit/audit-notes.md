# Typography Accessibility Audit

Surface: `/projects/kota-ai`
Date: 2026-08-03

## Captures

- `00-kota-project-top.png` - desktop top/hero state
- `01-kota-project-current.png` - desktop mid-page reading state
- `02-kota-project-mobile-390-top.png` - mobile top/hero state
- `03-kota-project-mobile-390-reading.png` - mobile reading state
- `04-kota-project-after-desktop.png` - desktop after typography pass
- `05-kota-project-after-mobile-top.png` - mobile top after typography pass
- `06-kota-project-after-mobile-reading.png` - mobile reading after typography pass

## Main Findings

1. Body text on the project template renders in TASA Orbiter because Tailwind `font-sans` maps to TASA, even though global body CSS sets Inter. This gives paragraph copy a display-face feel and hurts long-form readability.
2. The global `--font-scale: 1.125` makes the root font size 18px, but `.type-h1`, `.type-h2`, and `.type-h3` are counter-scaled down. Body text grows while headings are held fixed, weakening hierarchy and making the accessibility scale inconsistent.
3. Headings use tight default display settings: `letter-spacing: -0.045em` and `line-height: 0.98`, with project-specific heading line heights around 1.15. This is acceptable for short labels but brittle for wrapping headings and translated/dynamic text.
4. Kicker/meta labels are frequently 10-11px uppercase monospace with 0.18-0.2em tracking. Contrast generally passes, but the text is visually effortful and should be treated as decorative/supporting, not essential instruction.
5. Mobile has enough body size in many places, but content columns crop horizontally in the captured 390px state. Typography should be reviewed together with responsive containment.

## Suggested Direction

- Make a readable sans family the default `font-sans`; reserve display faces for short brand/display moments only.
- Remove the heading counter-scale rules so accessibility text scaling affects headings and body consistently.
- Relax heading defaults to roughly `letter-spacing: -0.02em` and `line-height: 1.08-1.18`.
- Raise essential mono labels to at least 12px, reduce tracking to about 0.1-0.14em, or hide decorative labels from the reading burden.
- Keep body copy at 16-18px with 1.65-1.8 line-height, but avoid using the display font for paragraphs.

## Implementation Pass

- Switched the default readable stack to DM Sans across body, heading, and display roles.
- Removed the leftover Google font import for Inter/TASA so DM Sans is the actual primary face.
- Removed the heading counter-scale rules so the site's accessibility font scale applies consistently.
- Relaxed global heading tracking and line-height, and made project headings fixed by breakpoint instead of viewport-fluid.
- Increased project-page meta labels to `text-xs` and reduced uppercase tracking to `0.12em`.
- Increased TLDR body copy to `text-base` with a comfortable `1.75` line-height.
- Verified the readable sans stack is live for body and headings, mobile/desktop horizontal overflow is clear, and the TLDR labels now measure above 4.5:1 contrast.
