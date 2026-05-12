<template>
  <div class="viewer-card">
    <div class="viewer-header">
      <span class="lib-name">NGL Viewer</span>
      <span class="lib-type">WebGL · Protein/molecule viewer</span>
    </div>
    <div class="viewer-body">
      <div v-if="loading" class="status">Loading NGL...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <div
        v-show="!loading && !error"
        ref="containerRef"
        class="ngl-container"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { Stage } from 'ngl'

const props = defineProps({
  smiles: { type: String, default: '' },
  sdfPath: { type: String, default: '' },
})

const containerRef = ref(null)
const loading = ref(true)
const error = ref('')
let stage = null

async function render() {
  error.value = ''
  loading.value = true

  await nextTick()

  try {
    if (stage) {
      stage.removeAllComponents()
    }

    const el = containerRef.value
    if (!el) return

    if (!stage) {
      stage = new Stage(el, {
        backgroundColor: '#16162a',
      })
    }

    if (props.sdfPath) {
      await stage.loadFile(props.sdfPath, { ext: 'sdf' })
    } else if (props.smiles) {
      const { getRDKitModule, smilesToMolblock } = await import('../utils/rdkit.js')
      const rdkit = await getRDKitModule()
      const molblock = smilesToMolblock(rdkit, props.smiles)
      const sdf = molblock + '$$$$\n'
      const blob = new Blob([sdf], { type: 'text/plain' })
      await stage.loadFile(blob, { ext: 'sdf', name: 'molecule.sdf' })
    } else {
      throw new Error('No SMILES or SDF path provided')
    }

    stage.autoView()
    loading.value = false
  } catch (e) {
    loading.value = false
    error.value = e.message || 'NGL render failed'
  }
}

onMounted(() => render())
watch(() => props.smiles, () => render())
watch(() => props.sdfPath, () => render())

onBeforeUnmount(() => {
  if (stage) stage.dispose()
})
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
}

.lib-type {
  font-size: 11px;
  color: #6a6a8a;
}

.viewer-body {
  padding: 0;
  min-height: 380px;
  position: relative;
}

.ngl-container {
  width: 100%;
  height: 380px;
}

.status {
  color: #7a7a9a;
  font-size: 14px;
  padding: 20px;
}

.status.error {
  color: #f87171;
}
</style>