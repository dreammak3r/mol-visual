<template>
  <div class="mol-card">
    <div class="mol-card-header">
      <span class="lib-name">RDKit.js</span>
      <span class="lib-type">WASM-based &middot; SVG output</span>
    </div>
    <div class="mol-card-body">
      <div v-if="loading" class="status">Loading RDKit WASM...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-else ref="svgContainer" class="svg-container" v-html="svg"></div>
    </div>
    <div class="mol-card-toolbar" v-if="!loading && !error">
      <label class="tool-btn toggle" :class="{ on: showLabels }">
        <input type="checkbox" v-model="showLabels" @change="render" />
        <span>Labels</span>
      </label>
      <label class="tool-btn toggle" :class="{ on: kekulize }">
        <input type="checkbox" v-model="kekulize" @change="render" />
        <span>Kekul&eacute;</span>
      </label>
      <button class="tool-btn" @click="copySmiles" title="Copy SMILES">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getRDKitModule, smilesToSVG } from '../utils/rdkit.js'

const props = defineProps({
  smiles: { type: String, required: true },
  theme: { type: Number, default: 0 },
})

const emit = defineEmits(['loaded', 'error'])

const svg = ref('')
const loading = ref(true)
const error = ref('')
const svgContainer = ref(null)
const showLabels = ref(true)
const kekulize = ref(false)

async function render() {
  error.value = ''
  try {
    const rdkit = await getRDKitModule()
    loading.value = false
    const mol = rdkit.get_mol(props.smiles)
    if (!mol) throw new Error(`Cannot parse SMILES: ${props.smiles}`)
    const drawer = new rdkit.MolDraw2DSVG(380, 280)
    drawer.drawOptions().addStereoAnnotation = showLabels.value
    drawer.drawOptions().flagCloseContactsTemplates = false
    if (!kekulize.value) drawer.drawOptions().aromaticBonds = { ...drawer.drawOptions().aromaticBonds, kekulize: false }
    drawer.drawMolecule(mol)
    drawer.finishDrawing()
    svg.value = drawer.getDrawingText()
    mol.delete()
    drawer.delete()
    emit('loaded')
  } catch (e) {
    loading.value = false
    error.value = e.message
    emit('error', error.value)
  }
}

function copySmiles() {
  navigator.clipboard.writeText(props.smiles).catch(() => {})
}

onMounted(() => render())
watch(() => props.smiles, () => render())

defineExpose({ render })
</script>

<style scoped>
.mol-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  overflow: hidden;
}
.mol-card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.lib-name { font-weight: 600; font-size: 14px; color: #4a5af0; }
.lib-type { font-size: 11px; color: #888; }
.mol-card-body {
  padding: 12px;
  display: flex; align-items: center; justify-content: center;
  min-height: 300px;
}
.svg-container {
  display: flex; align-items: center; justify-content: center;
}
.svg-container :deep(svg) { max-width: 100%; height: auto; }
.mol-card-toolbar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid rgba(0,0,0,0.06);
  flex-wrap: wrap;
}
.tool-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; height: 28px;
  background: transparent; border: 1px solid transparent;
  border-radius: 6px; cursor: pointer;
  font-size: 11px; color: rgba(0,0,0,0.5);
  font-family: inherit; transition: all 0.15s;
}
.tool-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
.tool-btn.toggle.on {
  background: rgba(74,106,240,0.1);
  border-color: rgba(74,106,240,0.25);
  color: #4a5af0;
}
.tool-btn input { display: none; }
.status { color: #999; font-size: 14px; }
.status.error { color: #d43; }
</style>
