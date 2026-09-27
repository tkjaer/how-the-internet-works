<svelte:options namespace="svg" />
<!-- Neon HUD shared definitions: cheap grids, no SVG filters. -->
<defs>
  <pattern id="neon-grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
    <path d="M24 0H0V24" fill="none" stroke="#2ff4ff" stroke-opacity="0.08" stroke-width="1" />
  </pattern>
  <pattern id="neon-grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
    <path d="M120 0H0V120" fill="none" stroke="#56f6ff" stroke-opacity="0.16" stroke-width="1.4" />
  </pattern>
  <pattern id="neon-panel-grid" width="64" height="64" patternUnits="userSpaceOnUse">
    <path d="M64 0H0V64" fill="none" stroke="#51edff" stroke-opacity="0.11" stroke-width="1" />
    <path d="M32 0V64M0 32H64" fill="none" stroke="#51edff" stroke-opacity="0.045" stroke-width="1" />
  </pattern>
  <linearGradient id="neon-fibre-core" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#21f2ff" stop-opacity="0.1" />
    <stop offset="0.5" stop-color="#ff4fe9" stop-opacity="0.22" />
    <stop offset="1" stop-color="#b9ff44" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="neon-glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#122a5d" stop-opacity="0.72" />
    <stop offset="1" stop-color="#020716" stop-opacity="0.9" />
  </linearGradient>
  <radialGradient id="neon-vignette" cx="50%" cy="45%" r="72%">
    <stop offset="0" stop-color="#000814" stop-opacity="0" />
    <stop offset="0.66" stop-color="#000814" stop-opacity="0.05" />
    <stop offset="1" stop-color="#000814" stop-opacity="0.64" />
  </radialGradient>
</defs>
