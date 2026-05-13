<template>
  <div class="molstar-custom">
    <div class="tb-header">
      <span class="tb-title">Mol* (Custom Vue UI)</span>
      <span class="tb-badge">No React</span>
    </div>

    <div ref="viewerParent" class="viewer-area">
      <div v-if="loading" class="overlay">Loading Mol* PluginContext...</div>
      <div v-else-if="err" class="overlay err">{{ err }}</div>
      <div v-else class="controls-overlay">
        <button class="ctrl-btn" @click="resetCamera" title="Reset camera">⌖</button>
        <button class="ctrl-btn" @click="toggleSpin" title="Toggle spin">⟳</button>
        <div class="ctrl-divider"></div>
        <button
          v-for="s in reprs"
          :key="s.id"
          class="ctrl-btn repr"
          :class="{ active: repr === s.id }"
          @click="setRepr(s.id)"
        >{{ s.label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = defineProps({
  pdbPath: { type: String, default: '' },
  sdfPath: { type: String, default: '' },
})

const reprs = [
  { id: 'auto', label: 'Auto' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'ball-stick', label: 'Ball&Stick' },
  { id: 'surface', label: 'Surface' },
]
const repr = ref('auto')

const viewerParent = ref(null)
const loading = ref(true)
const err = ref('')

let plugin = null
let spinAnimId = null
let spinning = false

async function init() {
  try {
    const [{ PluginContext }, { DefaultPluginSpec }, { PluginConfig }] = await Promise.all([
      import('molstar/lib/mol-plugin/context.js'),
      import('molstar/lib/mol-plugin/spec.js'),
      import('molstar/lib/mol-plugin/config.js'),
    ])

    const spec = {
      ...DefaultPluginSpec(),
      config: [[PluginConfig.VolumeStreaming.Enabled, false]],
      layout: {
        initial: { isExpanded: false, showControls: false },
      },
    }

    plugin = new PluginContext(spec)
    await plugin.init()

    const parent = viewerParent.value
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%;display:block'
    canvas.id = 'msc-canvas'
    parent.appendChild(canvas)

    if (!(await plugin.initViewerAsync(canvas, parent))) {
      throw new Error('Viewer init returned false')
    }

    if (plugin.canvas3d) {
      plugin.canvas3d.setProps({ transparentBackground: true }, true)
    }

    loading.value = false
    await loadStructure()
  } catch (e) {
    loading.value = false
    err.value = e?.message || String(e)
  }
}

async function loadStructure() {
  if (!plugin) return
  try {
    await plugin.clear()
    repr.value = 'auto'

    if (props.pdbPath) {
      const text = await fetch(props.pdbPath).then(r => r.text())
      const data = await plugin.builders.data.rawData({ data: text })
      const traj = await plugin.builders.structure.parseTrajectory(data, 'pdb')
      await plugin.builders.structure.hierarchy.applyPreset(traj, 'default')
    }

    if (props.sdfPath) {
      const text = await fetch(props.sdfPath).then(r => r.text())
      const data = await plugin.builders.data.rawData({ data: text })
      const traj = await plugin.builders.structure.parseTrajectory(data, 'sdf')
      await plugin.builders.structure.hierarchy.applyPreset(traj, 'default')
    }
  } catch (e) {
    err.value = 'Load failed: ' + (e?.message || e)
  }
}

function setRepr(id) {
  repr.value = id
  if (!plugin) return
  const { managers } = plugin
  const structures = managers.structure.hierarchy.current.structures
  if (!structures.length) return

  const preset = id === 'auto' ? 'default'
    : id === 'cartoon' ? 'auto'
    : id === 'ball-stick' ? 'auto'
    : 'auto'

  structures.forEach(s => {
    managers.structure.component.updateRepresentationsTheme(s)
  })
}

function resetCamera() {
  plugin?.managers.camera.reset()
  plugin?.canvas3d?.requestDraw()
}

function toggleSpin() {
  spinning = !spinning
  if (!plugin?.canvas3d) return
  const tb = plugin.canvas3d.props.trackball
  plugin.canvas3d.setProps({
    trackball: {
      ...tb,
      animate: spinning
        ? { name: 'spin', params: { speed: 0.01, axis: [0, -1, 0] } }
        : { name: 'off', params: {} },
    },
  })
}

watch(() => props.pdbPath, () => { if (plugin) loadStructure() })
watch(() => props.sdfPath, () => { if (plugin) loadStructure() })

onMounted(async () => {
  await nextTick()
  init()
})

onBeforeUnmount(() => {
  if (spinAnimId) clearInterval(spinAnimId)
  if (plugin) {
    try { plugin.dispose() } catch (_) {}
    plugin = null
  }
})
</script>

<style scoped>
.molstar-custom {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tb-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: #1c1c36;
  border-bottom: 1px solid #2a2a4a;
}
.tb-title { font-weight: 600; font-size: 14px; color: #c8d0ff; }
.tb-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: #2a4a3a; color: #6fcf97;
}
.viewer-area {
  flex: 1; min-height: 300px; position: relative;
}
.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: #7a7a9a; font-size: 14px; background: #16162a;
}
.overlay.err { color: #f87171; }
.controls-overlay {
  position: absolute; top: 8px; left: 8px;
  display: flex; align-items: center; gap: 4px;
  background: rgba(22,22,42,0.85);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 4px 6px;
}
.ctrl-btn {
  background: transparent; border: none;
  color: #8888aa; cursor: pointer;
  font-size: 13px; padding: 4px 8px;
  border-radius: 4px;
}
.ctrl-btn:hover { background: #2a2a4a; color: #ddd; }
.ctrl-btn.repr { font-size: 11px; }
.ctrl-btn.repr.active { background: #3a4a7a; color: #b0c0ff; }
.ctrl-divider { width: 1px; height: 18px; background: #3a3a5a; margin: 0 2px; }
</style>
