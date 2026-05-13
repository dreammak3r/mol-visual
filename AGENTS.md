# MolVisual — Molecular Visualization Comparison

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Architecture
Vue 3 + Vue Router SPA comparing molecular visualization libraries side by side.

**Routes:** `/` (home), `/2d` (Compare2D), `/3d` (Compare3D)

**2D viewers** (in `/2d`): RDKit.js (WASM→SVG), SmilesDrawer (pure JS→Canvas), Ketcher (iframe at `/public/ketcher/standalone/`)

**3D viewers** (in `/3d`): 3Dmol.js (npm, WebGL), Mol* / MolStar (`/public/molstar.js` + `.css`, loaded via dynamic script/link injection), NGL Viewer (npm, WebGL, not currently used in view)

## Data
- Small molecules: `src/data/molecules.js` (Aspirin, Ibuprofen, Caffeine, Paracetamol) with SMILES + SDF files in `/public/sdf/`
- Proteins: `src/data/molecules.js` (Crambin, B-DNA, Estrogen Receptor) with PDB files in `/public/pdb/`

## Key Integration Details
- **Mol* (CDN)** — `MolStarViewer.vue` loads via pre-built CDN bundle at runtime (`/public/molstar.js`). Must inject `<link>` for `/molstar.css` and `<script>` for `/molstar.js`. `window.molstar.Viewer.create(el, options)` is the entrypoint. Includes React UI.
- **Mol* (npm, no React)** — `MolStarCustom.vue` imports `PluginContext` from `molstar/lib/mol-plugin/context.js` via npm. No React dependency. Vue UI built from scratch via `plugin.builders`, `plugin.managers`, `PluginCommands`. The previously documented Vite+mutative CJS issue is resolved in current dependency versions.
- **RDKit WASM** — loaded from `/public/rdkit/RDKit_minimal.js`. Centralized in `src/utils/rdkit.js` with singleton pattern. Used by RdkitViewer, ThreeDmolViewer, KetcherViewer, and others for SMILES→Molblock/SVG conversion.
- **Ketcher** — runs in an iframe; molecule must be set via `contentWindow.ketcher.setMolecule(molblock)` after iframe load (polling-based readiness check).
- **3Dmol.js style switching** — `setStyle({}, spec)` + `render()` for `ball-stick`, `stick`, `spacefill`, `line`; `addSurface()` for surface mode.

## No lint/typecheck/test scripts configured
