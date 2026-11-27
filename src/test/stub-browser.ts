// Controlled stand-ins for the browser globals the app's state and router touch at import time, so tests start clean.
import { vi } from 'vitest';

export function stubBrowser() {
  const url = new URL('http://localhost/');
  const setHash = (u: string) => { url.hash = new URL(u, url).hash; };
  vi.stubGlobal('location', url);
  vi.stubGlobal('history', { state: null, pushState: (_: unknown, __: string, u: string) => setHash(u), replaceState: (_: unknown, __: string, u: string) => setHash(u) });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }));
  vi.stubGlobal('window', { addEventListener: () => {} });
  vi.stubGlobal('document', { documentElement: {} });
  vi.stubGlobal('navigator', { language: 'en' });
}
