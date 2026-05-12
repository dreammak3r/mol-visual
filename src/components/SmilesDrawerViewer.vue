<template>
  <div class="viewer-card">
    <div class="viewer-header">
      <span class="lib-name">SmilesDrawer</span>
      <span class="lib-type">Pure JS · Canvas output</span>
    </div>
    <div class="viewer-body">
      <div v-if="error" class="status error">{{ error }}</div>
      <canvas
        v-show="!error"
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="draw-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import SmilesDrawer from 'smiles-drawer'

const props = defineProps({
  smiles: { type: String, required: true },
})

const error = ref('')
const canvasRef = ref(null)
const canvasWidth = 380
const canvasHeight = 280

let drawer = null

function render() {
  error.value = ''
  try {
    SmilesDrawer.parse(props.smiles, (tree) => {
      nextTick(() => {
        const canvas = canvasRef.value
        if (!canvas) return
        drawer.draw(tree, canvas, 'dark')
      })
    }, (err) => {
      error.value = 'Cannot parse SMILES: ' + err
    })
  } catch (e) {
    error.value = e.message
  }
}

onMounted(() => {
  drawer = new SmilesDrawer.Drawer({
    width: canvasWidth,
    height: canvasHeight,
    bondThickness: 1.5,
    shortBondLength: 0.8,
  })
  render()
})

watch(() => props.smiles, () => {
  nextTick(() => render())
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

.draw-canvas {
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
