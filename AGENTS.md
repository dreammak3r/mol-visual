# MolVisual — Molecular Visualization Comparison

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Architecture
Vue 3 + Vue Router SPA comparing molecular visualization libraries side by side.

**Architecture:** Vue 3 + Vue Router SPA comparing molecular visualization libraries side by side.

**Routes:** `/` (home), `/2d` (Compare2D), `/3d` (Compare3D), `/test/molstar` (TestMolStar .vue)

## 2D Viewers

All 2D viewers share unified dark card design (`.mol-card`, 16px border-radius), bottom toolbar with rendering controls, and consistent component interface.

### Ketcher
| File | Engine | Output | Description |
|------|--------|--------|-------------|
| `src/components/ketcher/KetcherViewer.vue` | Indigo WASM (iframe) | Full editor | Original Ketcher via iframe at `/ketcher/standalone/` |
| `src/components/ketcher/KetcherCustom.vue` | ketcher-core (npm) + Raphael SVG | SVG viewer | Vue rewrite using `MolSerializer` + `RenderStruct.render()` |

### Others
| Component | Engine | Output | Toolbar Controls |
|-----------|--------|--------|------------------|
| `RdkitViewer.vue` | RDKit WASM (`get_svg`) | SVG | Labels toggle, Kekulé toggle, Copy SMILES |
| `SmilesDrawerViewer.vue` | SmilesDrawer (npm) | Canvas | Dark/Light theme toggle, Copy SMILES |

**Common interface:** `props: { smiles, theme }`, `emits: ['loaded', 'error']`, `expose: { render }`

## 3D Viewers

| Component | Engine | UI |
|-----------|--------|----|
| `ThreeDmolViewer.vue` | 3Dmol.js (npm, WebGL) | Minimal |
| `src/components/molstar/MolStarViewer.vue` | Mol* CDN bundle (React) | React inside iframe |
| `src/components/molstar/MolStarCustom.vue` | Mol* npm `PluginContext` | Full Vue UI, no React |

### MolStarCustom.vue Key Details
- **Theme system**: 3 presets (Light, Dusk, Forest) with CSS custom properties. Props: `pdbPath`, `sdfPath`, `theme` (number). Emits: `loaded`, `error`, `residue-click`, `theme-change`. Exposes: `resetCamera`, `switchStyle`, `displayMode`, `currentStyle`, `currentTheme`, `cycleTheme`.
- `ignoreLight`: theme-dependent (`false` for Light/Forest, `true` for Dusk). Used in `buildManualRepr()` and re-applied via `switchStyle()` after initial `applyPreset`.
- Sequence panel: inline chain flow with `chain-gap`. Tooltip via `ResizeObserver`. No-seq toast slides down 2s.
- Toolbar: auto-hide (macOS dock style) with animated arrow matching bar slide speed (0.35s).

## Data
- Small molecules: `src/data/molecules.js` (Aspirin, Ibuprofen, Caffeine, Paracetamol) — SMILES + SDF in `/public/sdf/`
- Proteins: `src/data/molecules.js` (Crambin, B-DNA, Estrogen Receptor) — PDB in `/public/pdb/`

## Design System
- **Glassmorphism** (3D overlays): `.glass` class with `rgba(255,255,255,0.72)`, `blur(10px)`, semi-transparent border, subtle shadow. 2D cards use dark solid `#16162a` background.
- **Border-radius**: container 20px, cards/panels 16px, large buttons 12px, small buttons 10px, residues 4px, scrollbar 4px
- **Animations**: `0.35s ease` for slides/transforms, `0.25s ease` for opacity

## Vite Config
- `process.env` polyfill via `define: { 'process.env': '({})' }`
- `window.process` polyfill via `transformIndexHtml` plugin script injection (ketcher-core needs it)
- Plugin: `@vitejs/plugin-vue`

## No lint/typecheck/test scripts configured
