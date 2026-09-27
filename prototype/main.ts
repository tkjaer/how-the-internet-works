import { mount } from 'svelte';
import App from './App.svelte';
import './ui/ui.css';
import { loadTheme, settings } from './state.svelte';

// The first theme is loaded before mounting so the first paint already has the right art and fonts.
// Switching later re-renders in place (see the style effect in App.svelte).
await loadTheme(settings.style);
mount(App, { target: document.body });
