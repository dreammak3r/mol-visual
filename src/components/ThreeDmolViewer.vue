<template>
  <div class="viewer-card" :style="{ width, height: typeof height === 'number' ? height + 'px' : height }">
    <div class="viewer-header">
      <span class="lib-name">3Dmol.js</span>
      <span class="lib-type">WebGL · Three.js based</span>
    </div>
    <div class="viewer-body">
      <div v-if="loading" class="status">Loading 3Dmol...</div>
      <div v-if="error" class="status error">{{ error }}</div>
      <div v-show="!loading && !error" ref="viewerRef" class="mol-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import $3Dmol from '3dmol'

const styleSpecs = {
  'ball-stick': { stick: { radius: 0.15 }, sphere: { scale: 0.25 } },
  stick: { stick: { radius: 0.15 } },
  spacefill: { sphere: { scale: 0.8 } },
  line: { line: {} },
  ribbon: null,
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
const loading = ref(true)
const error = ref('')
let viewer = null

async function render() {
  error.value = ''
  loading.value = true
  try {
    const el = viewerRef.value
    if (!el) return
    if (viewer) {
      viewer.removeAllModels()
      viewer.removeAllSurfaces()
      viewer.removeAllShapes()
    }
    viewer = $3Dmol.createViewer(el, {
      backgroundColor: '0xffffff',
      disableFog: true,
    })

    if (props.pdbPath && props.sdfPath) {
      const pdbData = await fetch(props.pdbPath).then(r => {
        if (!r.ok) throw new Error('Failed to load PDB')
        return r.text()
      })
      viewer.addModel(pdbData, 'pdb')
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } })

      const sdfData = await fetch(props.sdfPath).then(r => {
        if (!r.ok) throw new Error('Failed to load SDF')
        return r.text()
      })
      viewer.addModel(sdfData, 'sdf')
      viewer.setStyle({ model: -1 }, { stick: { radius: 0.3, colorscheme: 'Jmol' } })
    } else if (props.pdbPath) {
      const pdbData = await fetch(props.pdbPath).then(r => {
        if (!r.ok) throw new Error('Failed to load PDB')
        return r.text()
      })
      viewer.addModel(pdbData, 'pdb')
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } })
    } else if (props.sdfPath) {
      const sdfData = await fetch(props.sdfPath).then(r => {
        if (!r.ok) throw new Error('Failed to load SDF')
        return r.text()
      })
      viewer.addModel(sdfData, 'sdf')
    } else if (props.smiles) {
      const rdkit = await import('../utils/rdkit.js').then(m => m.getRDKitModule())
      const molblock = await import('../utils/rdkit.js').then(m => m.smilesToMolblock(rdkit, props.smiles))
      await viewer.addModel(molblock, 'mol')
    } else {
      throw new Error('No SMILES, SDF, or PDB path provided')
    }

    if (!props.pdbPath) {
      applyStyle()
    }

    viewer.zoomTo()
    viewer.render()
    viewer.zoom(0.85)
    loading.value = false
    emit('loaded')
  } catch (e) {
    loading.value = false
    error.value = e.message
    emit('error', { message: e.message })
  }
}

function applyStyle() {
  if (!viewer) return
  viewer.removeAllSurfaces()
  const spec = styleSpecs[props.style]
  if (spec) {
    viewer.setStyle({}, spec)
  } else if (props.style === 'ribbon') {
    viewer.setStyle({}, styleSpecs['ball-stick'])
  } else if (props.style === 'surface') {
    viewer.setStyle({}, styleSpecs['ball-stick'])
    try { viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.8, color: 'white' }, {}) } catch (_) {}
  } else {
    viewer.setStyle({}, styleSpecs['ball-stick'])
  }
  viewer.render()
}

onMounted(() => render())
watch(() => props.smiles, () => render())
watch(() => props.sdfPath, () => render())
watch(() => props.pdbPath, () => render())
watch(() => props.style, () => {
  if (viewer && !props.pdbPath) {
    error.value = ''
    applyStyle()
  }
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
</style>