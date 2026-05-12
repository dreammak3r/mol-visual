<template>
  <div class="viewer-card" :style="{ width, height: typeof height === 'number' ? height + 'px' : height }">
    <div class="viewer-header">
      <span class="lib-name">3Dmol.js</span>
      <span class="lib-type">WebGL · Three.js based</span>
    </div>

    <!-- Sequence Panel -->
    <div v-if="sequence.length" class="sequence-bar">
      <div class="seq-scroll" ref="seqScrollRef">
        <span
          v-for="(res, i) in sequence"
          :key="i"
          class="seq-res"
          :class="{
            active: selectedResi === res.resi && selectedChain === res.chain,
            highlight: hoveredResi === res.resi && hoveredChain === res.chain,
          }"
          @click="selectResidue(res.chain, res.resi, res.resn)"
          @mouseenter="previewResidue(res.chain, res.resi, res.resn)"
          @mouseleave="clearPreview"
        >{{ oneLetter(res.resn) }}</span>
      </div>
    </div>

    <div class="viewer-body">
      <div v-if="loading" class="status">Loading 3Dmol...</div>
      <div v-if="error" class="status error">{{ error }}</div>
      <div v-show="!loading && !error" ref="viewerRef" class="mol-container"></div>
    </div>

    <!-- Selection Info -->
    <div v-if="selectedInfo" class="sel-info">{{ selectedInfo }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import $3Dmol from '3dmol'

const res3to1 = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
  GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
  LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
  SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
  DA: 'A', DC: 'C', DG: 'G', DT: 'T',
  A: 'A', C: 'C', G: 'G', T: 'T', U: 'U',
}
function oneLetter(resn) { return res3to1[resn] || '?' }

const styleSpecs = {
  'ball-stick': { stick: { radius: 0.15 }, sphere: { scale: 0.25 } },
  stick: { stick: { radius: 0.15 } },
  spacefill: { sphere: { scale: 0.8 } },
  line: { line: {} },
  ribbon: { cartoon: { color: 'spectrum' } },
  surface: null,
}

const props = defineProps({
  smiles: { type: String, default: '' },
  sdfPath: { type: String, default: '' },
  pdbPath: { type: String, default: '' },
  style: { type: String, default: 'ball-stick' },
  width: { type: [Number, String], default: '100%' },
  height: { type: [Number, String], default: 380 },
})
const emit = defineEmits(['loaded', 'error'])

const viewerRef = ref(null)
const seqScrollRef = ref(null)
const loading = ref(true)
const error = ref('')
const sequence = ref([])
const selectedResi = ref(null)
const selectedChain = ref(null)
const hoveredResi = ref(null)
const hoveredChain = ref(null)
const selectedInfo = ref('')
let viewer = null
let hasProtein = false

function getBaseStyle() {
  if (hasProtein) return { cartoon: { color: 'spectrum' } }
  const spec = styleSpecs[props.style]
  return spec || { stick: { radius: 0.15 } }
}

function isSmallMoleculeStyle() {
  return !hasProtein && ['ribbon', 'surface'].includes(props.style)
}

function applyBaseStyle() {
  viewer.removeAllSurfaces()
  const base = getBaseStyle()
  viewer.setStyle({}, base)
  if (hasProtein) {
    // ligand style on non-protein chains/models
    viewer.setStyle({ hetflag: true }, { stick: { radius: 0.3, colorscheme: 'Jmol' } })
  }
  if (!hasProtein && props.style === 'surface') {
    try { viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.8, color: 'white' }, {}) } catch (_) {}
  }
}

function selectResidue(chain, resi, resn) {
  // Toggle off if clicking same residue
  if (selectedResi.value === resi && selectedChain.value === chain) {
    selectedResi.value = null
    selectedChain.value = null
    selectedInfo.value = ''
    applyBaseStyle()
    viewer.render()
    return
  }
  selectedResi.value = resi
  selectedChain.value = chain
  selectedInfo.value = `Chain ${chain} ${oneLetter(resn) || ''} ${resn} ${resi}`
  applyBaseStyle()
  // Highlight selected by overlaying a stick representation
  viewer.setStyle({ chain, resi }, { stick: { color: 'red', radius: 0.3 } })
  viewer.render()
  // Scroll sequence into view
  nextTick(() => {
    const el = seqScrollRef.value
    if (!el) return
    const target = el.querySelector('.seq-res.active')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
}

function previewResidue(chain, resi, resn) {
  hoveredResi.value = resi
  hoveredChain.value = chain
}

function clearPreview() {
  hoveredResi.value = null
  hoveredChain.value = null
}

function extractSequence() {
  const atoms = viewer.selectedAtoms({})
  const seen = new Set()
  const seq = []
  for (const atom of atoms) {
    if (atom.resi === undefined) continue
    const key = `${atom.chain}_${atom.resi}`
    if (!seen.has(key)) {
      seen.add(key)
      seq.push({ chain: atom.chain || 'A', resi: atom.resi, resn: atom.resn })
    }
  }
  seq.sort((a, b) => a.resi - b.resi)
  sequence.value = seq
}

async function render() {
  error.value = ''
  loading.value = true
  selectedResi.value = null
  selectedChain.value = null
  selectedInfo.value = ''
  sequence.value = []
  hasProtein = false
  try {
    const el = viewerRef.value
    if (!el) return
    if (viewer) {
      viewer.removeAllModels()
      viewer.removeAllSurfaces()
      viewer.removeAllShapes()
    }
    viewer = $3Dmol.createViewer(el, {
      backgroundColor: '0xf8f8ff',
      disableFog: true,
      antialias: true,
    })

    if (props.pdbPath && props.sdfPath) {
      hasProtein = true
      const [pdbData, sdfData] = await Promise.all([
        fetch(props.pdbPath).then(r => { if (!r.ok) throw new Error('Failed to load PDB'); return r.text() }),
        fetch(props.sdfPath).then(r => { if (!r.ok) throw new Error('Failed to load SDF'); return r.text() }),
      ])
      viewer.addModel(pdbData, 'pdb')
      viewer.addModel(sdfData, 'sdf')
      applyBaseStyle()
    } else if (props.pdbPath) {
      hasProtein = true
      const pdbData = await fetch(props.pdbPath).then(r => { if (!r.ok) throw new Error('Failed to load PDB'); return r.text() })
      viewer.addModel(pdbData, 'pdb')
      applyBaseStyle()
    } else if (props.sdfPath) {
      const sdfData = await fetch(props.sdfPath).then(r => { if (!r.ok) throw new Error('Failed to load SDF'); return r.text() })
      viewer.addModel(sdfData, 'sdf')
      applyBaseStyle()
    } else if (props.smiles) {
      const { getRDKitModule, smilesToMolblock } = await import('../utils/rdkit.js')
      const rdkit = await getRDKitModule()
      const molblock = smilesToMolblock(rdkit, props.smiles)
      viewer.addModel(molblock, 'mol')
      applyBaseStyle()
    } else {
      throw new Error('No SMILES, SDF, or PDB path provided')
    }

    viewer.zoomTo()
    viewer.render()

    // Setup click handler for 3D selection
    viewer.setClickable({}, true, (atom) => {
      selectResidue(atom.chain || 'A', atom.resi, atom.resn)
    })

    // Extract sequence for protein structures
    if (hasProtein) extractSequence()

    loading.value = false
    emit('loaded')
  } catch (e) {
    loading.value = false
    error.value = e.message
    emit('error', { message: e.message })
  }
}

onMounted(() => render())
watch(() => props.smiles, () => render())
watch(() => props.sdfPath, () => render())
watch(() => props.pdbPath, () => render())
watch(() => props.style, () => {
  if (!viewer) return
  error.value = ''
  selectedResi.value = null
  selectedChain.value = null
  selectedInfo.value = ''
  applyBaseStyle()
  viewer.render()
})
</script>

<style scoped>
.viewer-card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.viewer-header {
  padding: 10px 16px;
  background: #1c1c36;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.lib-name { font-weight: 600; font-size: 14px; color: #c8d0ff; }
.lib-type { font-size: 11px; color: #6a6a8a; }

.sequence-bar {
  background: #0e0e20;
  border-bottom: 1px solid #2a2a4a;
  padding: 6px 8px;
  max-height: 52px;
  overflow-y: auto;
}
.seq-scroll {
  display: flex;
  gap: 1px;
  flex-wrap: wrap;
}
.seq-res {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 600;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  color: #6a6a8a;
  background: #1a1a30;
  flex-shrink: 0;
  transition: all 0.1s;
}
.seq-res:hover { background: #2a2a4a; color: #aaaacc; }
.seq-res.highlight { background: #3a3a5a; color: #c8d0ff; }
.seq-res.active { background: #7c8cf8; color: #fff; }

.viewer-body {
  flex: 1;
  min-height: 280px;
  position: relative;
}
.mol-container { width: 100%; height: 100%; position: relative; }
.status {
  color: #7a7a9a; font-size: 14px; padding: 20px;
  position: absolute; inset: 0; display: flex;
  align-items: center; justify-content: center;
}
.status.error { color: #f87171; }

.sel-info {
  padding: 6px 12px;
  background: #1c1c36;
  border-top: 1px solid #2a2a4a;
  color: #7c8cf8;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}
</style>
