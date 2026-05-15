<template>
  <div class="viewer-card" :style="{ width, height: typeof height === 'number' ? height + 'px' : height }">
    <div class="viewer-header">
      <span class="lib-name">Mol* (MolStar)</span>
      <span class="lib-type">WebGL · PDBe toolkit</span>
    </div>
    <div class="viewer-body">
      <div v-if="loading" class="status">Loading Mol*...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div
        v-show="!loading && !error"
        ref="containerRef"
        class="molstar-container"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  smiles: { type: String, default: '' },
  sdfPath: { type: String, default: '' },
  pdbPath: { type: String, default: '' },
  width: { type: [Number, String], default: '100%' },
  height: { type: [Number, String], default: 380 },
})
const emit = defineEmits(['loaded', 'error'])

const containerRef = ref(null)
const loading = ref(true)
const error = ref('')
let viewer = null
let molstarLoaded = false

function loadMolStar() {
  if (molstarLoaded) return Promise.resolve()
  if (window.molstar?.Viewer) {
    molstarLoaded = true
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[href*="molstar.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/molstar.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = '/molstar.js'
    script.onload = () => { molstarLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Mol* viewer'))
    document.head.appendChild(script)
  })
}

async function render() {
  error.value = ''
  loading.value = true
  await nextTick()
  try {
    await loadMolStar()
    const el = containerRef.value
    if (!el) return
    if (viewer) {
      try { viewer.plugin.dispose() } catch (_) {}
      viewer = null
      el.innerHTML = ''
    }
    viewer = await window.molstar.Viewer.create(el, {
      layoutIsExpanded: false,
      layoutShowSequence: true,
      layoutShowLog: false,
      layoutShowLeftPanel: false,
      layoutShowRemoteState: false,
      layoutShowControls: true,
      viewportShowAnimation: false,
    })

    await new Promise(r => setTimeout(r, 500))

    if (props.pdbPath && props.sdfPath) {
      const [pdbData, sdfData] = await Promise.all([
        fetch(props.pdbPath).then(r => r.text()),
        fetch(props.sdfPath).then(r => r.text()),
      ])
      await viewer.loadStructureFromData(pdbData, 'pdb', { dataLabel: 'protein' })
      await viewer.loadStructureFromData(sdfData, 'sdf', { dataLabel: 'ligand' })
    } else if (props.pdbPath) {
      const pdbData = await fetch(props.pdbPath).then(r => {
        if (!r.ok) throw new Error('Failed to load PDB')
        return r.text()
      })
      await viewer.loadStructureFromData(pdbData, 'pdb', { dataLabel: 'protein' })
    } else if (props.sdfPath) {
      const sdfData = await fetch(props.sdfPath).then(r => {
        if (!r.ok) throw new Error('Failed to load SDF')
        return r.text()
      })
      await viewer.loadStructureFromData(sdfData, 'sdf', { dataLabel: 'molecule' })
    } else if (props.smiles) {
      const { getRDKitModule, smilesToMolblock } = await import('../../utils/rdkit.js')
      const rdkit = await getRDKitModule()
      const molblock = smilesToMolblock(rdkit, props.smiles)
      const sdf = molblock + '$$$$\n'
      await viewer.loadStructureFromData(sdf, 'sdf', { dataLabel: 'molecule' })
    } else {
      throw new Error('No SMILES, SDF, or PDB path provided')
    }

    loading.value = false
    emit('loaded')
  } catch (e) {
    loading.value = false
    error.value = e.message || 'Mol* render failed'
    emit('error', { message: e.message })
  }
}

onMounted(() => render())
watch(() => props.smiles, () => render())
watch(() => props.sdfPath, () => render())
watch(() => props.pdbPath, () => render())
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
.viewer-body { flex: 1; min-height: 280px; position: relative; }
.molstar-container { width: 100%; height: 100%; }
.status {
  color: #7a7a9a; font-size: 14px; padding: 20px;
  position: absolute; inset: 0; display: flex;
  align-items: center; justify-content: center;
}
.status.error { color: #f87171; }
</style>
