import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://dogpilot.pl',
  integrations: [sitemap()],
  i18n: { defaultLocale: 'pl', locales: ['pl', 'en'], routing: { prefixDefaultLocale: false } },
  build: { inlineStylesheets: 'auto' },
});
