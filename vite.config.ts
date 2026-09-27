import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const spikes = ['svelte-svg'];

export default defineConfig({
  appType: 'mpa', // serve each spikes/<name>/index.html as its own page (no SPA fallback)
  plugins: [svelte()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries([
        ['gallery', 'index.html'],
        ...spikes.map((s) => [s, `spikes/${s}/index.html`]),
      ]),
    },
  },
});
