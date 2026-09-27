// Spike 2: Svelte 5 components rendering SVG from the shared scene data.
import { mount } from 'svelte';
import '../shared/ui.css';
import '../shared/svg-scene.css';
import App from './App.svelte';

mount(App, { target: document.body });
