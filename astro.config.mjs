import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo. Cámbialo aquí si al final la web vive en otro.
const SITE = 'https://ohpia.com';

const noIndex = ['/aviso-legal', '/privacidad', '/cookies', '/gracias', '/404'];

export default defineConfig({
  site: SITE,
  adapter: vercel(),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !noIndex.some((p) => page.replace(/\/$/, '').endsWith(p)),
    }),
  ],
});
