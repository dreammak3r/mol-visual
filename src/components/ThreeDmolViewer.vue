<template>
  <div class="viewer-card" :style="{ width, height: typeof height === 'number' ? height + 'px' : height }">
    <div class="viewer-header">
      <span class="lib-name">3Dmol.js</span>
      <span class="lib-type">WebGL · Three.js based</span>
    </div>

    <!-- Sequence Panel -->
    <div v-if="sequence.length" class="sequence-bar" ref="seqWrapRef">
      <div class="seq-scroll" ref="seqScrollRef">
        <div v-for="(seg, si) in seqSegments" :key="si" class="seg-group">
          <span class="seg-num">{{ seg.start }}</span>
          <span
            v-for="(res, i) in seg.residues"
            :key="i"
            class="seq-res"
            :class="{
              active: selectedResi === res.resi && selectedChain === res.chain,
              hovered: hoveredResi === res.resi && hoveredChain === res.chain,
            }"
            @click="selectResidue(res.chain, res.resi, res.resn)"
            @mouseenter="hoverResidue(res.chain, res.resi, res.resn)"
            @mouseleave="unhoverResidue"
          >{{ oneLetter(res.resn) }}</span>
        </div>
      </div>
    </div>

    <div class="viewer-body">
      <div v-if="loading" class="status">Loading 3Dmol...</div>
      <div v-if="error" class="status error">{{ error }}</div>
      <div v-show="!loading && !error" ref="viewerRef" class="mol-container"></div>
    </div>

    <div v-if="selectedInfo" class="sel-info">{{ selectedInfo }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import $3Dmol from '3dmol'

const res3to1 = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
  GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
  LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
  SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
  DA: 'A', DC: 'C', DG: 'G', DT: 'T',
  A: 'A', C: 'C', G: 'G', T: 'T', U: 'U',
  MSE: 'M', UNK: '?',
}
function oneLetter(resn) { return res3to1[resn] || '?' }

const HIGHLIGHT_COLOR = '0x4a7dff'
const HOVER_COLOR = '0x88bbff'

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
const seqWrapRef = ref(null)
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

const seqSegments = computed(() => {
  const segs = []
  const step = 10
  for (let i = 0; i < sequence.value.length; i += step) {
    segs.push({
      start: sequence.value[i].resi,
      residues: sequence.value.slice(i, i + step),
    })
  }
  return segs
})

function getBaseStyle() {
  if (hasProtein) return { cartoon: { color: 'spectrum' } }
  const spec = styleSpecs[props.style]
  return spec || { stick: { radius: 0.15 } }
}

function applyBaseStyle() {
  viewer.removeAllSurfaces()
  viewer.setStyle({}, getBaseStyle())
  if (hasProtein) {
    viewer.setStyle({ hetflag: true }, { stick: { radius: 0.3, colorscheme: 'Jmol' } })
  }
  if (!hasProtein && props.style === 'surface') {
    try { viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.8, color: 'white' }, {}) } catch (_) {}
  }
}

function highlightResidue(chain, resi, color) {
  viewer.setStyle({ chain, resi }, {
    cartoon: { color },
    stick: { color, radius: 0.3 },
  })
  viewer.render()
}

function clearHighlight(chain, resi) {
  // Reapply base style for this residue
  if (hasProtein) {
    viewer.setStyle({ chain, resi }, { cartoon: { color: 'spectrum' } })
  } else {
    viewer.setStyle({ chain, resi }, getBaseStyle())
  }
  // Reapply hetflag style for ligand
  if (hasProtein) {
    viewer.setStyle({ chain, resi, hetflag: true }, { stick: { radius: 0.3, colorscheme: 'Jmol' } })
  }
}

function selectResidue(chain, resi, resn) {
  if (selectedResi.value === resi && selectedChain.value === chain) {
    // Deselect
    clearHighlight(selectedChain.value, selectedResi.value)
    selectedResi.value = null
    selectedChain.value = null
    selectedInfo.value = ''
    viewer.render()
    return
  }
  // Clear previous selection
  if (selectedResi.value !== null) {
    clearHighlight(selectedChain.value, selectedResi.value)
  }
  selectedResi.value = resi
  selectedChain.value = chain
  selectedInfo.value = `Chain ${chain} · ${oneLetter(resn)} ${resn} · ${resi}`
  highlightResidue(chain, resi, HIGHLIGHT_COLOR)
}

function hoverResidue(chain, resi, resn) {
  if (hoveredResi.value === resi && hoveredChain.value === chain) return
  // Clear previous hover
  if (hoveredResi.value !== null && !(hoveredResi.value === selectedResi.value && hoveredChain.value === selectedChain.value)) {
    clearHighlight(hoveredChain.value, hoveredResi.value)
  }
  hoveredResi.value = resi
  hoveredChain.value = chain
  // Don't override selection color
  if (!(selectedResi.value === resi && selectedChain.value === chain)) {
    highlightResidue(chain, resi, HOVER_COLOR)
  }
}

function unhoverResidue() {
  if (hoveredResi.value !== null && !(hoveredResi.value === selectedResi.value && hoveredChain.value === selectedChain.value)) {
    clearHighlight(hoveredChain.value, hoveredResi.value)
  }
  hoveredResi.value = null
  hoveredChain.value = null
  if (selectedResi.value !== null) {
    highlightResidue(selectedChain.value, selectedResi.value, HIGHLIGHT_COLOR)
  }
  viewer.render()
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

    viewer.setClickable({}, true, (atom) => {
      selectResidue(atom.chain || 'A', atom.resi, atom.resn)
    })

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

/* Sequence Panel */
.sequence-bar {
  background: #0c0c1e;
  border-bottom: 1px solid #2a2a4a;
  padding: 4px 8px;
  max-height: 44px;
  overflow: hidden;
}
.seq-scroll {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #2a2a4a transparent;
  padding: 2px 0;
}
.seg-group {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.seg-num {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: #4a4a6a;
  min-width: 20px;
  text-align: right;
  padding-right: 2px;
  user-select: none;
}
.seq-res {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  width: 20px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  color: #6a6a8a;
  background: #12122a;
  flex-shrink: 0;
  transition: all 0.08s ease;
  letter-spacing: -0.5px;
}
.seq-res:hover {
  background: #22224a;
  color: #aaaadd;
}
.seq-res.hovered {
  background: #2a3a6a;
  color: #aaccff;
}
.seq-res.active {
  background: #4a7dff;
  color: #ffffff;
  box-shadow: 0 0 6px rgba(74, 125, 255, 0.4);
}

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
  padding: 5px 12px;
  background: #1c1c36;
  border-top: 1px solid #2a2a4a;
  color: #7c8cf8;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}
</style>
