// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // El dominio de producción. Hace falta para `Astro.site`: las etiquetas
  // Open Graph piden URLs absolutas —un `/Hero/...` relativo no le sirve a
  // WhatsApp ni a Facebook, que leen el HTML desde fuera— y de aquí salen.
  site: 'https://doblecero.syle.studio',

  vite: {
    plugins: [tailwindcss()]
  }
});