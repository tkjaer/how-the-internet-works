import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  appType: 'mpa', // serve index.html (start page) and prototype/index.html as separate pages
  plugins: [svelte()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: { gallery: 'index.html', prototype: 'prototype/index.html' },
    },
  },
});
