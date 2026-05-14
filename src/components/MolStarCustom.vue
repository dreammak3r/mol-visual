<template>
  <div class="molstar-custom" :style="themes[currentTheme].vars" @mousemove="onMouseMove" @mouseleave="onMouseLeaveRoot">
    <div ref="viewerParent" class="canvas-fill"></div>

    <div v-if="loading" class="overlay">Loading Mol* PluginContext...</div>
    <div v-else-if="err" class="overlay err">{{ err }}</div>

    <template v-if="!loading && !err">
      <Transition name="slide">
        <div class="float-seq glass" v-if="showSeq" ref="seqPanelRef">
        <div class="seq-scroll" @mousemove="onSeqMove" @mouseleave="clearHover">
          <div class="chain-row">
            <div class="residues">
              <template v-for="(ch, ci) in chains" :key="ci">
                <template v-if="ci > 0"><span class="chain-gap"></span></template>
                <span v-for="(r, ri) in ch.residues" :key="ci + '-' + ri" class="res-wrap">
                  <span v-if="showSeqNum(ri, ch.residues)" class="seq-num">{{ r.authSeqId }}{{ r.insCode }}</span>
                  <span
                    class="residue"
                  :class="{ active: r.highlighted, hover: hoveredRes === r, muted: r.missing }"
                  :ref="(el) => { if (el) residueEls.set(r, el) }"
                  :data-ri="ri"
                  :data-ci="ci"
                  @click="focusResidue(ch, r)"
                  @mousedown.prevent="startRange(ch, r)"
                >{{ '\u200b' + r.code + '\u200b' }}</span>
              </span>
              </template>
            </div>
          </div>
        </div>
      </div>
      </Transition>

      <div class="res-tooltip glass" v-if="hoveredRes" :style="{ top: tooltipTopVal + 'px' }">
        <b>{{ hoveredRes.chainId || chains[0]?.id }}</b> | <b>{{ hoveredRes.compId }}</b><template v-if="hoveredRes.code && hoveredRes.code.length === 1"> ({{ hoveredRes.code }})</template> <b>{{ hoveredRes.authSeqId }}{{ hoveredRes.insCode }}</b><template v-if="hoveredRes.authSeqId !== hoveredRes.seqId"> <span class="tip-auth">[auth {{ hoveredRes.authSeqId }}]</span></template>
      </div>

      <div class="float-bottom glass" :class="{ raised: barVisible }">
        <button class="bar-btn" @click="resetCamera" title="Reset view">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 12a9 9 0 11-3-6.3" stroke-linecap="round"/><polyline points="20 5.7 23 5.7 23 8.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>

        <div class="bar-divider"></div>

        <button class="bar-btn seq-toggle" :class="{ on: showSeq }" @click="showSeq = chains.length ? !showSeq : false" title="Toggle sequence panel">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="6" cy="8" r="2.2"/><line x1="8.2" y1="8" x2="18" y2="8"/>
            <circle cx="6" cy="16" r="2.2"/><line x1="8.2" y1="16" x2="18" y2="16"/>
          </svg>
        </button>

        <div class="bar-divider"></div>

        <button
          v-for="s in styles"
          :key="s.id"
          class="bar-btn style-btn"
          :class="{ active: currentStyle === s.id }"
          @click="switchStyle(s.id)"
          :title="s.label"
        >
          <span v-html="s.icon"></span>
        </button>

        <div class="bar-divider"></div>

        <button class="bar-btn" @click="cycleTheme" title="Cycle theme">
          <span v-html="themes[currentTheme].icon"></span>
        </button>
      </div>

      <div class="bar-arrow" :class="{ down: barVisible }" @click="barVisible = !barVisible">
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 7l6-4 6 4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, reactive } from 'vue'
import { StructureElement, StructureProperties, Unit } from 'molstar/lib/mol-model/structure.js'
import { OrderedSet } from 'molstar/lib/mol-data/int.js'
import { StateObjectRef } from 'molstar/lib/mol-state/index.js'

const props = defineProps({
  pdbPath: { type: String, default: '' },
  sdfPath: { type: String, default: '' },
  theme: { type: Number, default: 0 },
})

const emit = defineEmits(['loaded', 'error', 'residue-click', 'theme-change'])

const displayMode = computed(() => {
  const hasPDB = !!props.pdbPath
  const hasSDF = !!props.sdfPath
  if (hasPDB && hasSDF) return 'complex'
  if (hasPDB) return 'pdb'
  if (hasSDF) return 'sdf'
  return 'empty'
})

const styles = [
  {
    id: 'polymer-cartoon', label: 'Cartoon',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12c2-4 4-7 8-7s5 3 8 7" stroke-linecap="round"/></svg>'
  },
  {
    id: 'atomic-detail', label: 'Ball & Stick',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5.5" cy="12" r="3.8" fill="currentColor" opacity="0.3"/><line x1="9.3" y1="12" x2="15.7" y2="12" stroke-width="2.8"/><circle cx="18.5" cy="12" r="3.8" fill="currentColor" opacity="0.3"/></svg>'
  },
  {
    id: 'molecular-surface', label: 'Surface',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5C7.5 5 4.5 7.8 4.5 12s2.8 7 7.5 7 7.5-2.8 7.5-7-3-7-7.5-7z" fill="currentColor" opacity="0.2" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'illustrative', label: 'Spacefill',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7.5" cy="8" r="4.5" fill="currentColor" opacity="0.28"/><circle cx="16" cy="8.5" r="5" fill="currentColor" opacity="0.28"/><circle cx="11.5" cy="16" r="4.5" fill="currentColor" opacity="0.28"/></svg>'
  },
]
const currentStyle = ref('polymer-cartoon')
const currentTheme = ref(props.theme >= 0 && props.theme < 3 ? props.theme : 0)
const themes = [
  {
    name: 'Light', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 2v2m0 16v2m-10-10H0m20 0h4M3.5 3.5l1.4 1.4m14.2 14.2l1.4 1.4M3.5 20.5l1.4-1.4m14.2-14.2l1.4-1.4"/></svg>',
    vars: {
      '--bg': '#f0f0f0',
      '--glass-bg': 'rgba(255,255,255,0.72)',
      '--glass-blur': '10px',
      '--glass-border': '1px solid rgba(255,255,255,0.55)',
      '--glass-shadow': '0 2px 12px rgba(0,0,0,0.04)',
      '--accent': '#4a5af0',
      '--accent-light': '#7c8cf8',
      '--accent-active': '#5b7bf0',
      '--accent-bg': 'rgba(74,106,240,0.1)',
      '--accent-border': 'rgba(74,106,240,0.3)',
      '--text': '#2a2a3a',
      '--text-secondary': '#555',
      '--text-muted': '#bbb',
      '--text-active': '#fff',
      '--res-hover-bg': '#e8ecff',
      '--res-hover-outline': 'rgba(124,140,248,0.35)',
      '--btn-color': 'rgba(0,0,0,0.55)',
      '--btn-hover-bg': 'rgba(0,0,0,0.06)',
      '--btn-hover-color': '#333',
      '--divider': 'rgba(0,0,0,0.1)',
      '--arrow-stroke': 'rgba(0,0,0,0.4)',
      '--overlay-text': '#999',
      '--err-color': '#d43',
      '--tip-sub': '#666',
      '--tip-auth': '#888',
    },
    canvas: { bg: 0xf0f0f0, x: 0xc08080, y: 0x80c080, z: 0x7c8cf8, origin: 0xd0d0d0 },
    ignoreLight: false,
  },
  {
    name: 'Dusk', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
    vars: {
      '--bg': '#141420',
      '--glass-bg': 'rgba(28,28,46,0.82)',
      '--glass-blur': '12px',
      '--glass-border': '1px solid rgba(255,255,255,0.08)',
      '--glass-shadow': '0 2px 16px rgba(0,0,0,0.4)',
      '--accent': '#4dd0e1',
      '--accent-light': '#80deea',
      '--accent-active': '#26c6da',
      '--accent-bg': 'rgba(77,208,225,0.14)',
      '--accent-border': 'rgba(77,208,225,0.3)',
      '--text': '#e8e8f0',
      '--text-secondary': '#b0b0c0',
      '--text-muted': '#56566e',
      '--text-active': '#141420',
      '--res-hover-bg': 'rgba(77,208,225,0.18)',
      '--res-hover-outline': 'rgba(77,208,225,0.35)',
      '--btn-color': 'rgba(220,220,240,0.52)',
      '--btn-hover-bg': 'rgba(220,220,240,0.08)',
      '--btn-hover-color': '#e8e8f0',
      '--divider': 'rgba(220,220,240,0.08)',
      '--arrow-stroke': 'rgba(220,220,240,0.42)',
      '--overlay-text': '#808098',
      '--err-color': '#ef5350',
      '--tip-sub': '#a0a0b8',
      '--tip-auth': '#7c7c96',
    },
    canvas: { bg: 0x141420, x: 0x906565, y: 0x659065, z: 0x4dd0e1, origin: 0x404055 },
    ignoreLight: true,
  },
  {
    name: 'Forest', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L4 13h4l-3 7h14l-3-7h4L12 2z" stroke-linejoin="round"/></svg>',
    vars: {
      '--bg': '#f2f7f2',
      '--glass-bg': 'rgba(242,247,242,0.75)',
      '--glass-blur': '10px',
      '--glass-border': '1px solid rgba(100,160,100,0.25)',
      '--glass-shadow': '0 2px 12px rgba(0,0,0,0.04)',
      '--accent': '#2e7d32',
      '--accent-light': '#4caf50',
      '--accent-active': '#388e3c',
      '--accent-bg': 'rgba(46,125,50,0.1)',
      '--accent-border': 'rgba(46,125,50,0.3)',
      '--text': '#2a3a2a',
      '--text-secondary': '#556655',
      '--text-muted': '#aabbab',
      '--text-active': '#fff',
      '--res-hover-bg': '#e6f0e6',
      '--res-hover-outline': 'rgba(76,175,80,0.3)',
      '--btn-color': 'rgba(40,60,40,0.5)',
      '--btn-hover-bg': 'rgba(40,60,40,0.06)',
      '--btn-hover-color': '#2a3a2a',
      '--divider': 'rgba(40,60,40,0.1)',
      '--arrow-stroke': 'rgba(40,60,40,0.4)',
      '--overlay-text': '#888',
      '--err-color': '#c62828',
      '--tip-sub': '#667566',
      '--tip-auth': '#889988',
    },
    canvas: { bg: 0xf2f7f2, x: 0x809080, y: 0x609060, z: 0x4caf50, origin: 0xd0e0d0 },
    ignoreLight: false,
  },
]
const showSeq = ref(false)
const chains = reactive([])
const hoveredRes = ref(null)

const viewerParent = ref(null)
const seqPanelRef = ref(null)
const tooltipTopVal = ref(10)
const barVisible = ref(false)
const loading = ref(true)
const err = ref('')

let plugin = null
const residueEls = new WeakMap()

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
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    parent.appendChild(canvas)

    if (!(await plugin.initViewerAsync(canvas, parent))) {
      throw new Error('Viewer init returned false')
    }

    if (plugin.canvas3d) {
      applyCanvasTheme()
      plugin.canvas3d.setProps({
        transparentBackground: false,
        cameraHelper: {
          axes: {
            name: 'on',
            params: {
              alpha: 0.7,
              scale: 0.4,
              radiusScale: 0.05,
              showPlanes: false,
              showLabels: true,
              labelOpacity: 0.6,
              labelScale: 0.2,
              location: 'bottom-left',
              locationOffsetX: 8,
              locationOffsetY: 8,
            },
          },
        },
      }, true)
    }

    await loadStructure()
    loading.value = false
    emit('loaded')

    try {
      plugin.behaviors.interaction.click.subscribe(({ current }) => {
        if (!showSeq.value) return
        const loci = current?.loci
        if (!loci || !StructureElement.Loci.is(loci) || StructureElement.Loci.isEmpty(loci)) {
          for (const ch of chains) for (const r of ch.residues) r.highlighted = false
          return
        }
        syncSelectionFromLoci(loci)
      })
    } catch (_) {}
    try {
      plugin.managers.structure.focus.behaviors.current.subscribe((entry) => {
        if (!showSeq.value) return
        if (!entry || !entry.loci || StructureElement.Loci.isEmpty(entry.loci)) {
          for (const ch of chains) for (const r of ch.residues) r.highlighted = false
        }
      })
    } catch (_) {}
    try {
      plugin.managers.interactivity.lociHighlights.addProvider((reprLoci) => {
        if (!showSeq.value) return
        const loci = reprLoci?.loci
        if (!loci || !StructureElement.Loci.is(loci)) {
          hoveredRes.value = null
          return
        }
        syncHoverFromLoci(loci)
      })
    } catch (_) {}
    try {
      plugin.behaviors.interaction.hover.subscribe(({ current }) => {
        if (!showSeq.value) return
        const loci = current?.loci
        if (!loci || !StructureElement.Loci.is(loci)) {
          hoveredRes.value = null
          return
        }
        syncHoverFromLoci(loci)
      })
    } catch (_) {}
  } catch (e) {
    loading.value = false
    err.value = e?.message || String(e)
    emit('error', err.value)
  }
}

async function loadStructure() {
  if (!plugin) return
  try {
    await plugin.clear()
    chains.length = 0
    showSeq.value = false

    if (props.pdbPath) {
      const text = await fetch(props.pdbPath).then(r => r.text())
      const data = await plugin.builders.data.rawData({ data: text })
      const traj = await plugin.builders.structure.parseTrajectory(data, 'pdb')
      currentStyle.value = 'polymer-cartoon'
      await plugin.builders.structure.hierarchy.applyPreset(traj, 'default', {
        representationPreset: 'polymer-cartoon',
      })
    }

    if (props.sdfPath) {
      const text = await fetch(props.sdfPath).then(r => r.text())
      const data = await plugin.builders.data.rawData({ data: text })
      const traj = await plugin.builders.structure.parseTrajectory(data, 'sdf')
      const sdfStyle = props.pdbPath ? 'atomic-detail' : 'atomic-detail'
      if (!props.pdbPath) currentStyle.value = 'atomic-detail'
      await plugin.builders.structure.hierarchy.applyPreset(traj, 'default', {
        representationPreset: sdfStyle,
      })
    }

    if (props.pdbPath) {
      await nextTick()
      extractSequence()
    }
  } catch (e) {
    err.value = 'Load failed: ' + (e?.message || e)
  }
}

function reprTypeParams() {
  const h = plugin.managers.structure.component.state.options.hydrogens
  const mat = plugin.managers.structure.component.state.options.materialStyle
  return {
    quality: plugin.managers.structure.component.state.options.visualQuality,
    ignoreHydrogens: h !== 'all',
    ignoreHydrogensVariant: h === 'only-polar' ? 'non-polar' : 'all',
    ignoreLight: themes[currentTheme.value].ignoreLight,
    material: mat,
  }
}

function hasSymmetry(structure) {
  return structure.units.some(u => !u.conformation.operator.assembly && u.conformation.operator.spgrOp >= 0)
}

async function buildManualRepr(structureCell, styleId) {
  const structure = structureCell.obj?.data
  if (!structure) return

  const tp = reprTypeParams()
  const sym = hasSymmetry(structure)

  let component, reprProps

  if (styleId === 'polymer-cartoon') {
    component = await plugin.builders.structure.tryCreateComponentStatic(structureCell, 'polymer')
    if (component && component.obj?.data?.elementCount > 0) {
      reprProps = {
        type: 'cartoon', typeParams: tp,
        color: sym ? 'operator-name' : 'chain-id', colorParams: {},
      }
    } else {
      component = await plugin.builders.structure.tryCreateComponentStatic(structureCell, 'all')
      reprProps = { type: 'ball-and-stick', typeParams: tp }
    }
  } else if (styleId === 'atomic-detail') {
    component = await plugin.builders.structure.tryCreateComponentStatic(structureCell, 'all')
    reprProps = { type: 'ball-and-stick', typeParams: tp }
  } else if (styleId === 'molecular-surface') {
    component = await plugin.builders.structure.tryCreateComponentStatic(structureCell, 'all')
    reprProps = {
      type: 'molecular-surface', typeParams: tp,
      color: 'entity-id', colorParams: { overrideWater: true },
    }
  } else if (styleId === 'illustrative') {
    component = await plugin.builders.structure.tryCreateComponentStatic(structureCell, 'all')
    reprProps = {
      type: 'spacefill',
      typeParams: tp,
      color: 'illustrative',
      colorParams: { style: { name: 'entity-id', params: { overrideWater: true } } },
    }
  }

  if (!component) return

  const update = plugin.state.data.build()
  plugin.builders.structure.representation.buildRepresentation(update, component, reprProps, { tag: styleId })
  await update.commit({ revertOnError: true })
}

async function switchStyle(id) {
  currentStyle.value = id
  if (!plugin) return
  try {
    const allComponents = []
    const currentStructures = plugin.managers.structure.component.currentStructures
    for (const s of currentStructures) {
      for (const c of s.components) {
        allComponents.push(c)
      }
    }
    if (allComponents.length) {
      await plugin.managers.structure.component.removeRepresentations(allComponents)
    }

    const structures = plugin.managers.structure.hierarchy.current.structures
    for (const s of structures) {
      const cell = StateObjectRef.resolveAndCheck(plugin.state.data, s.cell)
      if (cell) await buildManualRepr(cell, id)
    }

    plugin.managers.camera.reset()
    plugin.canvas3d?.requestDraw()
  } catch (e) {
    err.value = 'Switch style failed: ' + (e?.message || e)
  }
}

function applyCanvasTheme() {
  if (!plugin?.canvas3d) return
  const c = themes[currentTheme.value].canvas
  plugin.canvas3d.setProps({
    renderer: { backgroundColor: c.bg },
    cameraHelper: {
      axes: {
        params: {
          colorX: c.x, colorY: c.y, colorZ: c.z, originColor: c.origin,
          labelColorX: c.x, labelColorY: c.y, labelColorZ: c.z,
        },
      },
    },
  })
  plugin.canvas3d.requestDraw()
}

function cycleTheme() {
  currentTheme.value = (currentTheme.value + 1) % themes.length
  applyCanvasTheme()
  emit('theme-change', currentTheme.value)
}

function extractSequence() {
  if (!plugin) return
  const structures = plugin.managers.structure.hierarchy.current.structures
  if (!structures.length) return
  const structure = structures[0].cell.obj.data
  if (!structure) return

  chains.length = 0

  for (const unit of structure.units) {
    if (!Unit.isAtomic(unit)) continue
    if (!unit.polymerElements || unit.polymerElements.length === 0) continue

    const l = StructureElement.Location.create(structure, unit, unit.elements[0])
    const asymId = StructureProperties.chain.label_asym_id(l)
    const entityKey = StructureProperties.entity.key(l)

    const entitySeq = unit.model.sequence.byEntityKey[entityKey]
    if (!entitySeq) {
      const h = unit.model.atomicHierarchy
      if (!h) continue
      const residues = []
      const riSet = new Set()
      for (let ei = 0; ei < unit.elements.length; ei++) {
        riSet.add(h.residueAtomSegments.index[unit.elements[ei]])
      }
      const sorted = [...riSet].sort((a, b) => a - b)
      for (const ri of sorted) {
        const compId = h.atoms.label_comp_id.value(h.residueAtomSegments.offsets[ri])
        const seqId = h.residues.label_seq_id.value(ri)
        let authSeqId = seqId
        try { authSeqId = h.residues.auth_seq_id.value(ri) } catch { /* keep seqId */ }
        let insCode = ''
        try { insCode = h.residues.pdbx_PDB_ins_code.value(ri) || '' } catch { /* ignore */ }
        const code = oneLetterCode(compId)
        residues.push({ compId, seqId, authSeqId, insCode, code: code || 'X', highlighted: false, missing: false, unit, ri, chainId: asymId })
      }
      if (residues.length) chains.push({ id: asymId, residues })
      continue
    }

    const seq = entitySeq.sequence
    const missingResidues = unit.model.properties?.missingResidues
    const modelNum = unit.model.modelNum
    const residues = []
    for (let si = 0; si < seq.length; si++) {
      const compId = seq.compId.value(si)
      const seqId = seq.seqId.value(si)
      let code = ''
      try { code = seq.code.value(si) } catch { code = oneLetterCode(compId) || 'X' }
      if (!code) code = 'X'
      const isMissing = !!missingResidues?.has(modelNum, asymId, seqId)
      residues.push({
        compId, seqId, authSeqId: seqId, insCode: '', code,
        highlighted: false, missing: isMissing,
        unit: isMissing ? null : unit, seqIndex: si, chainId: asymId,
      })
    }
    if (residues.length) chains.push({ id: asymId, residues })
  }
}

function oneLetterCode(three) {
  const map = {
    ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
    GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
    LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
    SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
  }
  return map[three] || ''
}

function showSeqNum(ri, residues) {
  if (ri === 0) return true
  const prev = residues[ri - 1]
  const cur = residues[ri]
  if (!prev || !cur) return false
  if (Math.floor((cur.authSeqId - 1) / 10) !== Math.floor((prev.authSeqId - 1) / 10)) return true
  return false
}

function syncSelectionFromLoci(loci) {
  if (!plugin || !loci.elements) return
  const structure = plugin.managers.structure.hierarchy.current.structures[0]?.cell?.obj?.data
  if (!structure) return

  for (const ch of chains) for (const r of ch.residues) r.highlighted = false

  for (const e of loci.elements) {
    const unit = e.unit
    if (!Unit.isAtomic(unit)) continue
    const h = unit.model?.atomicHierarchy
    if (!h) continue
    const { label_seq_id } = h.residues
    const { index: residueIndex } = h.residueAtomSegments

    let ri0 = -1
    for (let i = 0; i < OrderedSet.size(e.indices); i++) {
      const ei = OrderedSet.getAt(e.indices, i)
      const atomIdx = unit.elements[ei]
      if (atomIdx === undefined) continue
      ri0 = residueIndex[atomIdx]
      break
    }
    if (ri0 < 0) continue
    const seqId = label_seq_id.value(ri0)
    if (seqId === undefined) continue

    const l = StructureElement.Location.create(structure, unit, unit.elements[OrderedSet.getAt(e.indices, 0)])
    const asymId = StructureProperties.chain.label_asym_id(l)

    for (const ch of chains) {
      if (ch.id !== asymId) continue
      for (const r of ch.residues) {
        if (r.seqId === seqId) r.highlighted = true
      }
    }
  }
}

function syncHoverFromLoci(loci) {
  if (!loci.elements || !plugin) return
  const structure = plugin.managers.structure.hierarchy.current.structures[0]?.cell?.obj?.data
  if (!structure) return

  for (const e of loci.elements) {
    const unit = e.unit
    if (!Unit.isAtomic(unit)) continue
    const h = unit.model?.atomicHierarchy
    if (!h) continue
    const labelSeqId = h.residues.label_seq_id
    const { index: residueIndex } = h.residueAtomSegments

    let ri0 = -1
    for (let i = 0; i < OrderedSet.size(e.indices); i++) {
      const ei = OrderedSet.getAt(e.indices, i)
      const atomIdx = unit.elements[ei]
      if (atomIdx === undefined) continue
      ri0 = residueIndex[atomIdx]
      break
    }
    if (ri0 < 0) continue
    const seqId = labelSeqId.value(ri0)
    if (seqId === undefined) continue

    const l = StructureElement.Location.create(structure, unit, unit.elements[OrderedSet.getAt(e.indices, 0)])
    const asymId = StructureProperties.chain.label_asym_id(l)

    for (const ch of chains) {
      if (ch.id !== asymId) continue
      for (const r of ch.residues) {
        if (r.seqId === seqId) {
          hoveredRes.value = r
          scrollToResidue(r)
          return
        }
      }
    }
  }
  hoveredRes.value = null
}

function collectResidueElements(unit, seqId) {
  const h = unit.model.atomicHierarchy
  if (!h) return null
  const { label_seq_id } = h.residues
  const { index: residueIndex } = h.residueAtomSegments
  const elements = []
  for (let ei = 0; ei < unit.elements.length; ei++) {
    const ri = residueIndex[unit.elements[ei]]
    if (label_seq_id.value(ri) === seqId) {
      elements.push(ei)
    }
  }
  return elements
}

async function focusResidue(ch, res) {
  if (!plugin || res.missing) return
  rangeStart = null
  rangeChain = null

  if (res.highlighted) {
    const total = ch.residues.reduce((c, r) => c + (r.highlighted ? 1 : 0), 0)
    if (total === 1) {
      for (const r of ch.residues) r.highlighted = false
      plugin.managers.interactivity.lociHighlights.clearHighlights()
      plugin.managers.structure.focus.clear()
      hoveredRes.value = null
      lastRange = null
      return
    }
  }

  const structures = plugin.managers.structure.hierarchy.current.structures
  if (!structures.length) return
  const structure = structures[0].cell.obj.data
  if (!structure) return

  for (const r of ch.residues) r.highlighted = false
  res.highlighted = true

  const targetUnit = res.unit
  if (!targetUnit) return

  const seqId = res.seqId
  const h = targetUnit.model.atomicHierarchy
  if (h) {
    const elements = collectResidueElements(targetUnit, seqId)
    if (elements && elements.length) {
      const loci = StructureElement.Loci(structure, [{
        unit: targetUnit,
        indices: OrderedSet.ofSortedArray(elements)
      }])
      plugin.managers.interactivity.lociHighlights.clearHighlights()
      plugin.managers.structure.focus.setFromLoci(loci)
      plugin.managers.camera.focusLoci(loci, { extraRadius: 4, durationMs: 250 })
      emit('residue-click', { compId: res.compId, seqId: res.seqId, authSeqId: res.authSeqId, chainId: ch.id })
      return
    }
  }
}

let rangeStart = null
let rangeChain = null
let lastRange = null

function startRange(ch, r) {
  rangeStart = r
  rangeChain = ch
  document.addEventListener('mouseup', endRange)
}

function lociForRange(ch, i0, i1) {
  if (!plugin) return null
  const structures = plugin.managers.structure.hierarchy.current.structures
  if (!structures.length) return null
  const structure = structures[0].cell.obj.data
  if (!structure) return null

  const elements = []
  for (let i = Math.min(i0, i1); i <= Math.max(i0, i1); i++) {
    const r = ch.residues[i]
    const elems = collectResidueElements(r.unit, r.seqId)
    if (elems && elems.length) {
      elements.push({ unit: r.unit, indices: OrderedSet.ofSortedArray(elems) })
    }
  }
  if (!elements.length) return null
  return StructureElement.Loci(structure, elements)
}

function endRange() {
  const chain = rangeChain
  const r0 = rangeStart
  rangeStart = null
  rangeChain = null
  document.removeEventListener('mouseup', endRange)

  if (!chain || !r0 || !plugin) {
    if (plugin) plugin.managers.interactivity.lociHighlights.clearHighlights()
    return
  }

  const residues = chain.residues
  const ri0 = residues.indexOf(r0)
  let ri1 = ri0
  for (let i = 0; i < residues.length; i++) {
    if (residues[i].highlighted) ri1 = i
  }
  if (ri0 < 0) {
    plugin.managers.interactivity.lociHighlights.clearHighlights()
    return
  }

  const lo = Math.min(ri0, ri1)
  const hi = Math.max(ri0, ri1)

  if (lastRange && lastRange.chain === chain && lastRange.lo === lo && lastRange.hi === hi) {
    for (const r of residues) r.highlighted = false
    plugin.managers.interactivity.lociHighlights.clearHighlights()
    plugin.managers.structure.focus.clear()
    hoveredRes.value = null
    plugin.managers.camera.reset()
    plugin.canvas3d?.requestDraw()
    lastRange = null
    return
  }

  lastRange = { chain, lo, hi }
  const loci = lociForRange(chain, lo, hi)
  if (loci) {
    plugin.managers.interactivity.lociHighlights.clearHighlights()
    hoveredRes.value = null
    plugin.managers.structure.focus.setFromLoci(loci)
    plugin.managers.camera.focusLoci(loci, { extraRadius: 4, durationMs: 300 })
  }
}

function lociForResidue(ch, res) {
  if (!plugin) return null
  const structures = plugin.managers.structure.hierarchy.current.structures
  if (!structures.length) return null
  const structure = structures[0].cell.obj.data
  if (!structure) return null

  const elements = collectResidueElements(res.unit, res.seqId)
  if (!elements || !elements.length) return null
  return StructureElement.Loci(structure, [{
    unit: res.unit,
    indices: OrderedSet.ofSortedArray(elements)
  }])
}

function clearHover() {
  if (rangeStart) return
  if (hoveredRes.value !== null) {
    hoveredRes.value = null
    if (plugin) plugin.managers.interactivity.lociHighlights.clearHighlights()
  }
}

function onSeqMove(e) {
  if (!plugin) return

  if (rangeStart) {
    const el = e.target.closest('.residue')
    if (!el) return
    const ri = +el.getAttribute('data-ri')
    const ci = +el.getAttribute('data-ci')
    if (isNaN(ri) || isNaN(ci) || ci >= chains.length || ri >= chains[ci].residues.length) return
    if (rangeChain !== chains[ci]) return

    const residues = chains[ci].residues
    const i0 = residues.indexOf(rangeStart)
    if (i0 < 0) return
    const lo = Math.min(i0, ri)
    const hi = Math.max(i0, ri)
    for (const r of residues) r.highlighted = false
    for (let i = lo; i <= hi; i++) residues[i].highlighted = true

    const loci = lociForRange(chains[ci], i0, ri)
    if (loci) plugin.managers.interactivity.lociHighlights.highlightOnly({ loci })
    return
  }

  const el = e.target.closest('.residue')
  if (!el) { clearHover(); return }

  const ri = +el.getAttribute('data-ri')
  const ci = +el.getAttribute('data-ci')
  if (isNaN(ri) || isNaN(ci) || ci >= chains.length || ri >= chains[ci].residues.length) { clearHover(); return }

  const r = chains[ci].residues[ri]
  if (r.missing) { clearHover(); return }
  if (hoveredRes.value === r) return
  hoveredRes.value = r
  const loci = lociForResidue(chains[ci], r)
  if (loci) plugin.behaviors.interaction.hover.next({ current: { loci }, buttons: 0, button: 0, modifiers: 0 })
  scrollToResidue(r)
}

function resetCamera() {
  plugin?.managers.camera.reset()
  plugin?.canvas3d?.requestDraw()
}

watch(() => props.pdbPath, () => { if (plugin) loadStructure() })
watch(() => props.sdfPath, () => { if (plugin) loadStructure() })
watch(() => props.theme, (t) => {
  if (t >= 0 && t < themes.length && t !== currentTheme.value) {
    currentTheme.value = t
    applyCanvasTheme()
  }
})
watch(() => chains.length, () => { nextTick().then(updateTooltipTop) })

let seqObserver = null

function updateTooltipTop() {
  const el = seqPanelRef.value
  if (el) tooltipTopVal.value = el.offsetTop + Math.min(el.scrollHeight, el.offsetHeight) + 6
}

function initSeqObserver() {
  seqObserver?.disconnect()
  const el = seqPanelRef.value
  if (!el) return
  seqObserver = new ResizeObserver(() => requestAnimationFrame(updateTooltipTop))
  seqObserver.observe(el)
}

watch(showSeq, (v) => { if (v) nextTick().then(initSeqObserver) })
watch(() => chains.length, () => { nextTick().then(initSeqObserver) })

function scrollToResidue(r) {
  if (!seqPanelRef.value) return
  const el = residueEls.get(r)
  if (el) {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

function onMouseMove(e) {
  if (!viewerParent.value) return
  const rect = viewerParent.value.getBoundingClientRect()
  barVisible.value = e.clientY > rect.bottom - 60
}

function onMouseLeaveRoot() {
  barVisible.value = false
}

onMounted(async () => {
  await nextTick()
  init()
})

onBeforeUnmount(() => {
  seqObserver?.disconnect()
  window.removeEventListener('resize', updateTooltipTop)
  if (plugin) {
    try { plugin.dispose() } catch (_) {}
    plugin = null
  }
})

defineExpose({ resetCamera, switchStyle, displayMode, currentStyle, currentTheme, cycleTheme })
</script>

<style scoped>
.molstar-custom {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg);
}

.canvas-fill {
  position: absolute;
  inset: 0;
}

.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--overlay-text); font-size: 14px; background: var(--bg);
  z-index: 5;
}
.overlay.err { color: var(--err-color); }

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
}

/* sequence panel */
.float-seq {
  position: absolute; top: 10px; left: 10px; right: 10px;
  max-height: 96px; overflow: auto;
  padding: 6px 10px 10px;
  border-radius: 14px;
  z-index: 9;
}
.float-seq::-webkit-scrollbar { width: 4px; }
.float-seq::-webkit-scrollbar-track { background: transparent; }
.float-seq::-webkit-scrollbar-thumb {
  background: transparent; border-radius: 2px; transition: background 0.3s;
}
.float-seq:hover::-webkit-scrollbar-thumb { background: var(--divider); }
.float-seq::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.slide-enter-active, .slide-leave-active {
  transition: transform 0.35s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(-120px);
}

.seq-scroll { display: flex; flex-direction: column; }
.chain-row { display: flex; align-items: flex-end; flex-wrap: wrap; }
.chain-gap { display: inline-block; width: 8px; flex-shrink: 0; }
.residues { display: flex; gap: 0; flex-wrap: wrap; align-items: flex-end; }

.res-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}
.seq-num {
  font-size: 8px; font-family: 'SF Mono', 'Cascadia Code', monospace;
  color: var(--accent-light); line-height: 1; margin-bottom: 1px;
  user-select: none; pointer-events: none;
  font-weight: 600;
}
.residue {
  font-size: 11px; font-family: 'SF Mono', 'Cascadia Code', monospace;
  padding: 1px 3px; border-radius: 3px; cursor: pointer;
  color: var(--text-secondary); line-height: 1.3;
  transition: background 0.1s, color 0.1s;
  min-width: 14px; text-align: center;
}
.residue.hover {
  background: var(--res-hover-bg); color: var(--btn-hover-color);
  outline: 1px solid var(--res-hover-outline);
  outline-offset: -1px;
}
.residue.active { background: var(--accent-active); color: var(--text-active); }
.residue.muted { color: var(--text-muted); font-style: italic; cursor: default; }
.residue.muted:hover { background: transparent; color: var(--text-muted); }
.residue.muted.active { background: transparent; color: var(--text-muted); }

.res-tooltip {
  position: absolute; right: 10px;
  padding: 5px 10px;
  border-radius: 14px;
  z-index: 11;
  font-size: 11px; line-height: 1.5;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  color: var(--text);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
}
.tip-sub { color: var(--tip-sub); margin-left: 8px; font-size: 10px; }
.tip-auth { color: var(--tip-auth); font-size: 10px; }

/* bottom bar — auto-width, centered */
.float-bottom {
  position: absolute; bottom: 10px; left: 50%;
  transform: translateX(-50%) translateY(50px);
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px;
  border-radius: 14px;
  z-index: 10;
  white-space: nowrap;
  opacity: 0;
  transition: transform 0.25s ease, opacity 0.25s ease;
  pointer-events: none;
}
.float-bottom.raised {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.bar-arrow {
  position: absolute; bottom: 68px; left: 50%;
  z-index: 10; cursor: pointer;
  color: var(--arrow-stroke);
  transform: translateX(-50%) translateY(50px);
  transition: transform 0.35s ease, opacity 0.25s ease;
  display: flex; align-items: center; justify-content: center;
  opacity: 0.55;
}
.bar-arrow.down {
  transform: translateX(-50%) translateY(0) rotate(180deg);
}
.bar-arrow:hover { opacity: 1; }
.bar-divider {
  width: 1px; height: 22px;
  background: var(--divider);
  margin: 0 2px;
}
.bar-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: transparent; border: 1px solid transparent;
  color: var(--btn-color); cursor: pointer;
  border-radius: 10px;
  font-family: inherit; font-size: 12px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.bar-btn:hover { background: var(--btn-hover-bg); color: var(--btn-hover-color); }
.bar-btn.style-btn.active {
  background: var(--accent-bg);
  border-color: var(--accent-border);
  color: var(--accent);
}
.seq-toggle.on {
  background: var(--accent-bg);
  border-color: var(--accent-border);
  color: var(--accent);
}
</style>
