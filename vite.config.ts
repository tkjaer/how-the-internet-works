import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const spikes = ['svg-gsap', 'svelte-svg', 'pixi', 'three-25d'];

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages project site lives under /how-the-internet-works/
  base: command === 'build' || isPreview ? '/how-the-internet-works/' : '/',
  appType: 'mpa', // serve each spikes/<name>/index.html as its own page (no SPA fallback)
  plugins: [svelte()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800, // three.js spike is ~670 kB raw by design
    rollupOptions: {
      input: Object.fromEntries([
        ['gallery', 'index.html'],
        ...spikes.map((s) => [s, `spikes/${s}/index.html`]),
      ]),
    },
  },
}));
