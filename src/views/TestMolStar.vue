<template>
  <div class="test-page">
    <div class="page-header">
      <h2>Mol* Custom — Standalone Test</h2>
      <p>Light background · Resizable panel · PluginContext API (no React)</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <span class="label">Small Molecule</span>
        <button
          v-for="mol in molecules"
          :key="mol.id"
          class="chip"
          :class="{ active: selectedMol?.id === mol.id }"
          @click="selectedMol = mol"
        >{{ mol.name }}</button>
        <button class="chip" :class="{ active: !selectedMol }" @click="selectedMol = null">None</button>
      </div>

      <div class="control-group">
        <span class="label">Protein</span>
        <button
          v-for="p in proteins"
          :key="p.id"
          class="chip"
          :class="{ active: selectedProtein?.id === p.id }"
          @click="selectedProtein = p"
        >{{ p.name }}</button>
        <button class="chip" :class="{ active: !selectedProtein }" @click="selectedProtein = null">None</button>
      </div>
    </div>

    <div
      ref="wrapperRef"
      class="viewer-wrapper"
      :style="{ width: panelW + 'px', height: panelH + 'px' }"
    >
      <MolStarCustom
        :sdf-path="selectedMol?.sdfPath || ''"
        :pdb-path="selectedProtein?.pdbPath || ''"
      />

      <!-- resize handles -->
      <div class="resize-handle right" @mousedown="startResize($event, 'right')"></div>
      <div class="resize-handle bottom" @mousedown="startResize($event, 'bottom')"></div>
      <div class="resize-handle corner" @mousedown="startResize($event, 'corner')"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import MolStarCustom from '../components/molstar/MolStarCustom.vue'
import { molecules, proteins } from '../data/molecules.js'

const selectedMol = ref(molecules[0])
const selectedProtein = ref(null)

const panelW = ref(520)
const panelH = ref(480)
const MIN_W = 320
const MIN_H = 300
const wrapperRef = ref(null)

let resizing = null

function startResize(e, dir) {
  e.preventDefault()
  const rect = wrapperRef.value?.getBoundingClientRect()
  if (!rect) return
  panelW.value = rect.width
  panelH.value = rect.height
  resizing = {
    dir,
    startX: e.clientX,
    startY: e.clientY,
    startW: panelW.value,
    startH: panelH.value,
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e) {
  if (!resizing) return
  const dx = e.clientX - resizing.startX
  const dy = e.clientY - resizing.startY

  if (resizing.dir === 'right' || resizing.dir === 'corner') {
    const rawW = resizing.startW + dx
    if (rawW < MIN_W) {
      panelW.value = MIN_W
      resizing.startX = e.clientX
      resizing.startW = MIN_W
    } else {
      panelW.value = rawW
    }
  }
  if (resizing.dir === 'bottom' || resizing.dir === 'corner') {
    const rawH = resizing.startH + dy
    if (rawH < MIN_H) {
      panelH.value = MIN_H
      resizing.startY = e.clientY
      resizing.startH = MIN_H
    } else {
      panelH.value = rawH
    }
  }
}

function stopResize() {
  resizing = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.test-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px;
}
.page-header p {
  font-size: 13px; color: #888;
}

.controls {
  display: flex; gap: 24px; flex-wrap: wrap;
  margin-bottom: 18px;
}
.control-group {
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap;
}
.label {
  font-size: 12px; font-weight: 600; color: #666;
  margin-right: 4px;
}
.chip {
  background: #f0f0f5; border: 1px solid #d4d4d8;
  border-radius: 6px; padding: 5px 12px;
  cursor: pointer; font-size: 12px; color: #555;
  font-family: inherit; transition: all 0.15s;
}
.chip:hover { border-color: #999; color: #333; }
.chip.active {
  background: #e8ecff; border-color: #7c8cf8; color: #4a5af0;
}

.viewer-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}
.viewer-wrapper > :first-child {
  width: 100%; height: 100%;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}
.resize-handle.right {
  right: 0; top: 0; bottom: 0; width: 6px;
  cursor: ew-resize;
}
.resize-handle.bottom {
  left: 0; right: 0; bottom: 0; height: 6px;
  cursor: ns-resize;
}
.resize-handle.corner {
  right: 0; bottom: 0; width: 14px; height: 14px;
  cursor: nwse-resize;
}
.resize-handle.right:hover,
.resize-handle.corner:hover,
.resize-handle.bottom:hover {
  background: rgba(124,140,248,0.15);
}
</style>
