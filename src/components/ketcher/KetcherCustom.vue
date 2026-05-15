<template>
  <div class="mol-card">
    <div class="mol-card-header">
      <span class="lib-name">Ketcher (Custom)</span>
      <span class="lib-type">ketcher-core &middot; SVG output</span>
    </div>
    <div class="mol-card-body">
      <div v-if="loading" class="status">Loading Ketcher engine...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-show="!loading && !error" ref="molContainer" class="mol-container"></div>
    </div>
    <div class="mol-card-toolbar" v-if="!loading && !error">
      <button class="tool-btn" @click="resetView" title="Reset view">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 12a9 9 0 11-3-6.3" stroke-linecap="round"/><polyline points="20 5.7 23 5.7 23 8.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="tool-btn" @click="copySmiles" title="Copy SMILES">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
      <label class="tool-label">
        <input type="checkbox" v-model="showLabels" @change="reRender" />
        <span>Labels</span>
      </label>
      <label class="tool-label">
        <input type="checkbox" v-model="aromaticCircles" @change="reRender" />
        <span>Aromatic</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getRDKitModule, smilesToMolblock } from '../../utils/rdkit.js'
import { MolSerializer } from 'ketcher-core'
import { RenderStruct } from 'ketcher-core'

const props = defineProps({
  smiles: { type: String, required: true },
  theme: { type: Number, default: 0 },
})

const emit = defineEmits(['loaded', 'error'])

const loading = ref(true)
const error = ref('')
const molContainer = ref(null)
const showLabels = ref(true)
const aromaticCircles = ref(true)

let currentStruct = null

function molblockToStruct(molblock) {
  const serializer = new MolSerializer()
  return serializer.deserialize(molblock)
}

function renderStruct() {
  if (!molContainer.value || !currentStruct) return
  molContainer.value.innerHTML = ''
  RenderStruct.render(molContainer.value, currentStruct, {
    autoScale: true,
    autoScaleMargin: 10,
    showAtomIds: false,
    showBondIds: false,
    showHalfBondIds: false,
    showValenceWarnings: false,
    atomColoring: true,
    hideImplicitHydrogen: !showLabels.value,
    carbonExplicitly: showLabels.value,
    aromaticCircle: aromaticCircles.value,
    showCharge: true,
    showHydrogenLabels: 'off',
    showValence: false,
    font: 'Arial',
    fontsz: 14,
    fontszUnit: 'px',
    bondLength: 40,
    bondLengthUnit: 'px',
    bondThickness: 2,
    bondThicknessUnit: 'px',
    viewOnlyMode: true,
  })
}

async function render() {
  error.value = ''
  try {
    const rdkit = await getRDKitModule()
    const molblock = smilesToMolblock(rdkit, props.smiles)
    currentStruct = molblockToStruct(molblock)
    loading.value = false
    await nextTick()
    renderStruct()
    emit('loaded')
  } catch (e) {
    loading.value = false
    error.value = e.message
    emit('error', error.value)
  }
}

function reRender() {
  if (currentStruct) renderStruct()
}

function resetView() {
  if (molContainer.value) {
    const svg = molContainer.value.querySelector('svg')
    if (svg) {
      svg.setAttribute('viewBox', `0 0 380 280`)
    }
  }
  reRender()
}

function copySmiles() {
  navigator.clipboard.writeText(props.smiles).catch(() => {})
}

onMounted(() => render())
onBeforeUnmount(() => {
  if (molContainer.value) molContainer.value.innerHTML = ''
  currentStruct = null
})

watch(() => props.smiles, () => render())

defineExpose({ render, resetView })
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
  display: flex; align-items: center; justify-content: center;
  min-height: 300px;
  position: relative;
}
.mol-container {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 300px;
}
.mol-container :deep(svg) { max-width: 100%; height: auto; }
.mol-card-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid rgba(0,0,0,0.06);
  flex-wrap: wrap;
}
.tool-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: transparent; border: 1px solid transparent;
  border-radius: 6px; cursor: pointer;
  color: rgba(0,0,0,0.5); transition: all 0.15s;
}
.tool-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
.tool-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #666; cursor: pointer;
  user-select: none;
}
.tool-label input { margin: 0; }
.status { color: #999; font-size: 14px; padding: 20px; }
.status.error { color: #d43; }
</style>
