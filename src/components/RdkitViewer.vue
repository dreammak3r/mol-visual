<template>
  <div class="viewer-card">
    <div class="viewer-header">
      <span class="lib-name">RDKit.js</span>
      <span class="lib-type">WASM-based · SVG output</span>
    </div>
    <div class="viewer-body">
      <div v-if="loading" class="status">Loading RDKit WASM...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div v-else ref="svgContainer" class="svg-container" v-html="svg"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getRDKitModule, smilesToSVG } from '../utils/rdkit.js'

const props = defineProps({
  smiles: { type: String, required: true },
})

const svg = ref('')
const loading = ref(true)
const error = ref('')
const svgContainer = ref(null)

async function render() {
  error.value = ''
  try {
    const rdkit = await getRDKitModule()
    loading.value = false
    svg.value = smilesToSVG(rdkit, props.smiles, 380, 280)
  } catch (e) {
    loading.value = false
    error.value = e.message
  }
}

onMounted(() => render())
watch(() => props.smiles, () => render())
</script>

<style scoped>
.viewer-card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  overflow: hidden;
}

.viewer-header {
  padding: 10px 16px;
  background: #1c1c36;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.lib-name {
  font-weight: 600;
  font-size: 14px;
  color: #c8d0ff;
}

.lib-type {
  font-size: 11px;
  color: #6a6a8a;
}

.viewer-body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.svg-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

.status {
  color: #7a7a9a;
  font-size: 14px;
}

.status.error {
  color: #f87171;
}
</style>
