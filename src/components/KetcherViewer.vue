<template>
  <div class="mol-card">
    <div class="mol-card-header">
      <span class="lib-name">Ketcher</span>
      <span class="lib-type">WASM iframe &middot; Indigo engine</span>
    </div>
    <div class="mol-card-body">
      <div v-if="loading" class="status">Loading Ketcher standalone...</div>
      <div v-if="error" class="status error">{{ error }}</div>
      <iframe
        v-show="!loading && !error"
        ref="iframeRef"
        :src="iframeSrc"
        class="ketcher-frame"
        @load="onFrameLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { getRDKitModule, smilesToMolblock } from '../utils/rdkit.js'

const props = defineProps({
  smiles: { type: String, required: true },
  theme: { type: Number, default: 0 },
})

const emit = defineEmits(['loaded', 'error'])

const iframeRef = ref(null)
const loading = ref(true)
const error = ref('')
let ketcherReady = false
let checkInterval = null

const iframeSrc = '/ketcher/standalone/index.html'

async function setKetcherMolecule() {
  if (!ketcherReady || !iframeRef.value) return
  try {
    const rdkit = await getRDKitModule()
    const molblock = smilesToMolblock(rdkit, props.smiles)
    iframeRef.value.contentWindow.ketcher.setMolecule(molblock)
    emit('loaded')
  } catch (e) {
    error.value = 'Failed to set molecule: ' + e.message
    emit('error', error.value)
  }
}

function tryInitKetcher() {
  if (!iframeRef.value) return
  try {
    const win = iframeRef.value.contentWindow
    if (win && win.ketcher && typeof win.ketcher.setMolecule === 'function') {
      ketcherReady = true
      loading.value = false
      if (checkInterval) { clearInterval(checkInterval); checkInterval = null }
      setKetcherMolecule()
    }
  } catch (_) {}
}

function onFrameLoad() {
  checkInterval = setInterval(tryInitKetcher, 300)
  setTimeout(() => {
    if (!ketcherReady) {
      if (checkInterval) clearInterval(checkInterval)
      loading.value = false
      error.value = 'Ketcher init timed out (check console)'
      emit('error', error.value)
    }
  }, 30000)
}

watch(() => props.smiles, () => { if (ketcherReady) setKetcherMolecule() })

onBeforeUnmount(() => { if (checkInterval) clearInterval(checkInterval) })
</script>

<style scoped>
.mol-card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  overflow: hidden;
}
.mol-card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: #1c1c36;
  border-bottom: 1px solid #2a2a4a;
}
.lib-name { font-weight: 600; font-size: 14px; color: #c8d0ff; }
.lib-type { font-size: 11px; color: #6a6a8a; }
.mol-card-body {
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  min-height: 380px;
  position: relative;
}
.ketcher-frame { width: 100%; height: 380px; border: none; }
.status { color: #999; font-size: 14px; padding: 20px; }
.status.error { color: #d43; }
</style>
