import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'hybrid',

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    mdx(),
  ],

  adapter: netlify(),
});