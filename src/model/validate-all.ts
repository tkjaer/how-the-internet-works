// Dev-time content check (imported dynamically from main.ts behind import.meta.env.DEV, so zod stays out of the build).
import { content } from './registry';
import { loadAllPacks, type Json } from './strings';
import { formatProblems, validate } from './validate';

const files = Object.keys(import.meta.glob('/content/*/*/Scene.svelte'));
const locales = import.meta.glob<Json>('/content/*/*/locales/*.json', { eager: true, import: 'default' });
const ui = import.meta.glob<Json>('/content/locales/*/ui.json', { eager: true, import: 'default' });

export async function validateAll() {
  const problems = validate({ content, packs: await loadAllPacks(), files, locales, ui });
  if (!problems.length) return;
  const msg = `Content problems (${problems.length}):\n${formatProblems(problems)}`;
  console.error(msg);
  throw new Error(msg);
}
