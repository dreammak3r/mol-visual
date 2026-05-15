# MolVisual — Molecular Visualization Comparison

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Architecture
Vue 3 + Vue Router SPA comparing molecular visualization libraries side by side.

**Routes:** `/` (home), `/2d` (Compare2D), `/3d` (Compare3D), `/test/molstar` (TestMolStar .vue)

## 2D Viewers (`src/components/`)
All 2D viewers share a unified glassmorphism card design (`.mol-card`, 16px border-radius), bottom toolbar with rendering controls, and the same component interface:

| Component | Engine | Output | Toolbar Controls |
|-----------|--------|--------|------------------|
| `RdkitViewer.vue` | RDKit WASM (`MolDraw2DSVG`) | SVG | Labels toggle, Kekulé toggle, Copy SMILES |
| `SmilesDrawerViewer.vue` | SmilesDrawer (npm) | Canvas | Dark/Light theme toggle, Copy SMILES |
| `KetcherViewer.vue` | ketcher-core (npm) + Raphael SVG | SVG | Reset view, Labels/Aromatic toggles, Copy SMILES |

**Common interface:** `props: { smiles, theme }`, `emits: ['loaded', 'error']`, `expose: { render }`

**Ketcher** was rewritten from iframe → Vue component using `ketcher-core`'s `MolSerializer` + `RenderStruct.render()` for native SVG rendering. Requires `window.process = { env: {} }` polyfill (injected via `vite.config.js` `transformIndexHtml` plugin).

## 3D Viewers (`src/components/`)
| Component | Engine | UI |
|-----------|--------|----|
| `ThreeDmolViewer.vue` | 3Dmol.js (npm, WebGL) | Minimal |
| `MolStarViewer.vue` | Mol* CDN bundle (React) | React inside iframe |
| `MolStarCustom.vue` | Mol* npm `PluginContext` | Full Vue UI, no React |

### MolStarCustom.vue Key Details
- **Theme system**: 3 presets (Light, Dusk, Forest) with CSS custom properties. Props: `pdbPath`, `sdfPath`, `theme` (number). Emits: `loaded`, `error`, `residue-click`, `theme-change`. Exposes: `resetCamera`, `switchStyle`, `displayMode`, `currentStyle`, `currentTheme`, `cycleTheme`.
- **ignoreLight**: theme-dependent (`false` for Light/Forest, `true` for Dusk). Used in `buildManualRepr()` and re-applied after initial `applyPreset` when loading.
- **Theme switching**: button in toolbar or via `:theme` prop. Applies CSS vars to root element + updates `canvas3d` background/axis colors via `applyCanvasTheme()`.
- **Sequence panel**: flat single-row layout using `<template v-for="(ch, ci) in chains">` with `chain-gap` spans. No entity-key dedup. `ResizeObserver` for tooltip position tracking.
- **Toolbar**: auto-hide (macOS dock style) with animated arrow. Glassmorphism overlays on 3D canvas.
- **Tooltip**: accent color only on compId (residue/chemical name). Chain ID and seq number are plain bold.
- **No-seq toast**: when clicking sequence toggle with no data, a centered `width: fit-content` glassmorphism toast slides down (same `slide` transition), auto-hides after 2s.

## Data
- Small molecules: `src/data/molecules.js` (Aspirin, Ibuprofen, Caffeine, Paracetamol) with SMILES + SDF in `/public/sdf/`
- Proteins: `src/data/molecules.js` (Crambin, B-DNA, Estrogen Receptor) with PDB in `/public/pdb/`

## Design System
- **Glassmorphism**: `.glass` class with `rgba(255,255,255,0.72)`, `blur(10px)`, semi-transparent border, subtle shadow
- **Border-radius hierarchy**: container 20px, cards/panels 16px, large buttons 12px, small buttons 10px, residues 4px, scrollbar thumb 4px
- **Animations**: `0.35s ease` for slides/transforms, `0.25s ease` for opacity
- **All floating overlays**: `.glass` class (white frosted glass), no CSS box-shadow on WebGL axis indicator

## Vite Config
- `process.env` polyfill via `define: { 'process.env': '({})' }`
- `window.process` polyfill via `transformIndexHtml` plugin script injection
- Plugin: `@vitejs/plugin-vue`

## No lint/typecheck/test scripts configured
