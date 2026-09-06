// Framer Motion variants for the chat surface. One shared `ease` so the
// entry screen, card grids and message list all decelerate identically —
// mixing curves across a single view is what makes an interface feel
// assembled from parts rather than designed.
export const ease = [0.25, 0, 0, 1] as const;

export const heroContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const heroItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

export const sectionReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const cardGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

export const cardItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export const messageEnter = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease } },
};
