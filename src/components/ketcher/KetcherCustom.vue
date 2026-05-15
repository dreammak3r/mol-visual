<template>
  <div class="kc-root" :class="{ 'kc-dark': theme === 1 }" :style="themeVars" @mousemove="onRootMove" @contextmenu.prevent>
    <div class="kc-top glass">
      <button class="kc-btn" title="Clear Canvas" @click="clearCanvas"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
      <button class="kc-btn" title="Open File" @click="openFile"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      <div style="position:relative">
        <button class="kc-btn" title="Save As" @click="saveMenu=!saveMenu"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
        <div v-if="saveMenu" class="kc-dd-wrap" @mouseleave="saveMenu=false">
          <div v-for="f in sfmts" :key="f.id" class="kc-ddi" @click="saveAs(f.id)">{{ f.label }}</div>
        </div>
      </div>
      <div class="kc-sep"></div>
      <button class="kc-btn" title="Undo" :disabled="!canUndo" @click="undo"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg></button>
      <button class="kc-btn" title="Redo" :disabled="!canRedo" @click="redo"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg></button>
      <div class="kc-sep"></div>
      <button class="kc-btn" title="Aromatize" @click="aromatize"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg></button>
      <button class="kc-btn" title="Dearomatize" @click="dearomatize"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg></button>
      <button class="kc-btn" title="Clean Up" @click="cleanUp"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M7 17l-4 4"/></svg></button>
      <button class="kc-btn" title="Layout" @click="layout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>
      <div class="kc-sep"></div>
      <button class="kc-btn" title="Reset View" @click="resetView"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 12a9 9 0 11-3-6.3" stroke-linecap="round"/><polyline points="20 5.7 23 5.7 23 8.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="kc-btn" @click="zoomOut">&minus;</button><span class="kc-zl">{{zl}}%</span><button class="kc-btn" @click="zoomIn">+</button>
      <div class="kc-status">{{ statusText }}</div>
      <div class="kc-spacer"></div>
      <div class="kc-smi" :title="molSmiles"><span class="kc-smi-l">SMILES:</span><span class="kc-smi-v">{{ molSmiles || '(empty)' }}</span></div>
    </div>

    <div class="kc-mid">
      <Transition name="p-slide">
        <div v-if="showPanels" class="kc-panel-left glass">
          <div class="kc-lg">Tools</div>
          <button class="kc-tb" :class="{on:tool==='hand'}" title="Hand" @click="tool='hand'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8M6 14a2 2 0 012-2h.5l1.4.6L12 15l1.5-1.5 1.4-.5H18a2 2 0 012 2v3a4 4 0 01-4 4h-4.5a4 4 0 01-2.8-1.2l-3-3"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='select'}" title="Select/Move" @click="tool='select'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-7 2-3 7z"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='erase'}" title="Erase" @click="tool='erase'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H6L3.5 17.5a2 2 0 010-2.83l10-10a2 2 0 012.83 0l4.5 4.5a2 2 0 010 2.83L14 20"/><line x1="3" y1="20" x2="21" y2="20"/></svg></button>
          <div class="kc-sr"></div>
          <button class="kc-tb" :class="{on:tool==='chain'}" title="Chain" @click="tool='chain'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20L9 4M9 4l3 8 3-8M15 4l6 16"/></svg></button>
          <div class="kc-sr"></div>
          <button class="kc-tb" :class="{on:tool==='cp'}" title="Charge +" @click="tool='cp'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='cm'}" title="Charge &minus;" @click="tool='cm'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button>
          <div class="kc-sr"></div>
          <button class="kc-tb" :class="{on:tool==='stereo'}" title="Stereochemistry" @click="tool='stereo'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V4h8a6 6 0 010 12H4"/><polyline points="4 4 12 4 12 16"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='rotate'}" title="Rotate" @click="tool='rotate'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1010 10"/><polyline points="16 2 12 2 12 6"/><circle cx="12" cy="12" r="2"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='text'}" title="Text" @click="tool='text'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="12" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg></button>
        </div>
      </Transition>

      <div ref="canvasEl" class="kc-canvas" :class="cursorClass" @mousedown.prevent="onMD" @mousemove.prevent="onMM" @mouseup.prevent="onMU" @mouseleave="onMU" @wheel.prevent="onWheel"></div>

      <Transition name="p-slide">
        <div v-if="showPanels" class="kc-panel-right glass">
          <div class="kc-lg">Atoms</div>
          <button v-for="a in atoms" :key="a" class="kc-atm" :class="{on:tool==='atom'&&curAtom===a}" @click="curAtom=a;tool='atom'">{{ a }}</button>
          <button class="kc-atm km" :class="{on:showPT}" @click="showPT=!showPT">PT</button>
          <div class="kc-sr"></div>
          <div class="kc-lg">Bonds</div>
          <button class="kc-tb" :class="{on:tool==='b1'}" title="Single (1)" @click="tool='b1'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='bup'}" title="Up" @click="tool='bup'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><polygon points="12,8 17,12 12,16" fill="currentColor"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='bdn'}" title="Down" @click="tool='bdn'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12" stroke-dasharray="6 3"/><polygon points="12,8 17,12 12,16" fill="currentColor" opacity=".6"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='b2'}" title="Double (2)" @click="tool='b2'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='b3'}" title="Triple (3)" @click="tool='b3'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="15" x2="20" y2="15"/></svg></button>
          <button class="kc-tb" :class="{on:tool==='bar'}" title="Aromatic" @click="tool='bar'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.8"/></svg></button>
          <div class="kc-sr"></div>
          <div class="kc-lg">Templates</div>
          <button v-for="tpl in templates" :key="tpl.id" class="kc-tpl" :title="tpl.name" @click="addTemplate(tpl)"><span v-html="tpl.svg"></span></button>
        </div>
      </Transition>
    </div>

    <div class="kc-bot glass" :class="{ raised: barVisible }">
      <button class="kc-tb" :class="{on:tool==='hand'}" title="Hand" @click="tool='hand'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8M6 14a2 2 0 012-2h.5l1.4.6L12 15l1.5-1.5 1.4-.5H18a2 2 0 012 2v3a4 4 0 01-4 4h-4.5a4 4 0 01-2.8-1.2l-3-3"/></svg></button>
      <button class="kc-tb" :class="{on:tool==='select'}" title="Select" @click="tool='select'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-7 2-3 7z"/></svg></button>
      <button class="kc-tb" :class="{on:tool==='erase'}" title="Erase" @click="tool='erase'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H6L3.5 17.5a2 2 0 010-2.83l10-10a2 2 0 012.83 0l4.5 4.5a2 2 0 010 2.83L14 20"/><line x1="3" y1="20" x2="21" y2="20"/></svg></button>
      <div class="kc-bd"></div>
      <button class="kc-tb" :class="{on:tool==='atom'&&curAtom==='C'}" title="Carbon" @click="curAtom='C';tool='atom'">C</button>
      <div class="kc-bd"></div>
      <button class="kc-tb" :class="{on:tool==='b1'}" title="Single Bond" @click="tool='b1'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/></svg></button>
      <div class="kc-bd"></div>
      <button class="kc-tb" title="Reset view" @click="resetView"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 12a9 9 0 11-3-6.3" stroke-linecap="round"/><polyline points="20 5.7 23 5.7 23 8.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="kc-spacer"></div>
      <button class="kc-tb kc-wrench" :class="{on:showPanels}" title="Toggle panels" @click="showPanels=!showPanels"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></button>
    </div>
    <div class="kc-arrow" :class="{ down: barVisible }" @click="barVisible = !barVisible">
      <svg width="20" height="10" viewBox="0 0 20 10" fill="none"><path d="M4 7l6-4 6 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>

    <div v-if="showPT" class="kc-ovl" @click.self="showPT=false">
      <div class="kc-modal glass"><div class="kc-mh"><span>Periodic Table</span><button class="kc-mc" @click="showPT=false">&times;</button></div>
        <div class="kc-pts"><button v-for="el in allEls" :key="el" class="kc-ptb" @click="curAtom=el;showPT=false;tool='atom'">{{ el }}</button></div>
      </div>
    </div>
    <div v-if="saveDialog" class="kc-ovl" @click.self="saveDialog=false">
      <div class="kc-modal glass kc-modal-sm"><div class="kc-mh"><span>Save As {{ saveFmt.toUpperCase() }}</span><button class="kc-mc" @click="saveDialog=false">&times;</button></div>
        <div class="kc-mb"><textarea class="kc-ta" readonly :value="saveContent" rows="12"></textarea><button class="kc-mbtn" @click="copySave">Copy to Clipboard</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { Render, MolSerializer, Struct, Atom, Bond, Vec2, ChemicalMimeType, Text } from 'ketcher-core'
import { StandaloneStructServiceProvider } from 'ketcher-standalone'
import { getRDKitModule, smilesToMolblock } from '../../utils/rdkit.js'

const props = defineProps({ smiles: { type: String, default: '' }, theme: { type: Number, default: 0 } })
const emit = defineEmits(['loaded', 'error', 'change'])

const canvasEl = ref(null)
const saveMenu = ref(false)
const saveDialog = ref(false)
const saveContent = ref('')
const saveFmt = ref('mol')
const tool = ref('hand')
const curAtom = ref('C')
const showPT = ref(false)
const showPanels = ref(false)
const molSmiles = ref('')
const currentZoom = ref(1)
const barVisible = ref(false)
const undoIdx = ref(-1)
const undoStack = reactive([])
const selection = reactive({ atoms: [], bonds: [] })

const canUndo = computed(() => undoIdx.value > 0)
const canRedo = computed(() => undoIdx.value < undoStack.length - 1)

const zl = computed(() => Math.round(currentZoom.value * 100))

const statusText = computed(() => {
  const t = tool.value
  if (t === 'atom') return `Atom: ${curAtom.value} — click canvas to place`
  if (t.startsWith('b')) {
    const m = { b1: 'Single', bup: 'Single Up', bdn: 'Single Down', b2: 'Double', b3: 'Triple', bar: 'Aromatic' }
    if (bondStartId != null) return `Bond: ${m[t] || t} — click target atom`
    return `Bond: ${m[t] || t} — click source atom`
  }
  const m = { hand: 'Hand — drag to pan', select: 'Select — click atom/bond to toggle selection',
    erase: 'Erase — click atom/bond to delete', chain: 'Chain — click to place/extend',
    cp: 'Charge +', cm: 'Charge \u2212', stereo: 'Stereochemistry',
    rotate: 'Rotate — drag atom', text: 'Text' }
  const hint = !showPanels.value ? '  (click wrench \u2692 for panels)' : ''
  return (m[t] || '') + hint
})

const cursorClass = computed(() => {
  const t = tool.value
  if (t === 'hand') return 'cs-hand'
  if (t === 'select') return 'cs-select'
  if (t === 'erase') return 'cs-erase'
  if (t === 'text') return 'cs-text'
  if (t === 'atom') return 'cs-atom'
  if (t.startsWith('b') || t === 'chain') return 'cs-bond'
  return ''
})

const sfmts = [
  { id: 'mol', label: 'MDL Molfile' }, { id: 'smiles', label: 'SMILES' },
  { id: 'smarts', label: 'SMARTS' }, { id: 'inchi', label: 'InChI' },
  { id: 'sdf', label: 'SDF' },
]

const atoms = ['H','C','N','O','S','F','Cl','Br','I','P']
const allEls = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' ')

const templates = [
  { id:'benzene', name:'Benzene', smiles:'c1ccccc1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,6 18,15 10,19 2,15 2,6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10.5" r="3" fill="none" stroke="currentColor" stroke-width="1"/></svg>' },
  { id:'cyclohexane', name:'Cyclohexane', smiles:'C1CCCCC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,6 18,15 10,19 2,15 2,6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id:'cyclopentane', name:'Cyclopentane', smiles:'C1CCCC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,3 18,8 16,17 4,17 2,8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id:'cyclopropane', name:'Cyclopropane', smiles:'C1CC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,17 2,17" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id:'cyclobutane', name:'Cyclobutane', smiles:'C1CCC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,3 18,6 18,16 10,19 2,16 2,6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id:'cycloheptane', name:'Cycloheptane', smiles:'C1CCCCCC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,1 18,5 19,13 15,19 5,19 1,13 2,5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
  { id:'cyclooctane', name:'Cyclooctane', smiles:'C1CCCCCCC1', svg:'<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 17,4 19,10 17,17 10,19 3,17 1,10 3,4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
]

const themeVars = computed(() => {
  const t = props.theme === 1 ? {
    '--glass-bg':'rgba(28,28,46,0.86)','--glass-blur':'12px','--glass-border':'1px solid rgba(255,255,255,0.10)','--glass-shadow':'0 2px 16px rgba(0,0,0,0.5)',
    '--ac':'#5dd8f0','--ac-lt':'#90e6f5','--ac-bg':'rgba(77,208,225,0.18)','--ac-bd':'rgba(77,208,225,0.4)',
    '--tx':'#f0f0f8','--tx2':'#c8c8e0','--tx3':'#56566e',
    '--btn':'rgba(220,220,240,0.72)','--btn-hv':'rgba(220,220,240,0.14)','--btn-hvc':'#ffffff',
    '--div':'rgba(220,220,240,0.12)','--arr':'rgba(220,220,240,0.55)',
    '--bg':'#12121e','--sf':'#1c1c3a','--bd':'rgba(255,255,255,0.08)','--hv':'rgba(255,255,255,0.10)',
  } : {
    '--glass-bg':'rgba(255,255,255,0.80)','--glass-blur':'10px','--glass-border':'1px solid rgba(255,255,255,0.60)','--glass-shadow':'0 2px 12px rgba(0,0,0,0.06)',
    '--ac':'#4a5af0','--ac-lt':'#7c8cf8','--ac-bg':'rgba(74,106,240,0.14)','--ac-bd':'rgba(74,106,240,0.4)',
    '--tx':'#1a1a2a','--tx2':'#444','--tx3':'#bbb',
    '--btn':'rgba(0,0,0,0.72)','--btn-hv':'rgba(0,0,0,0.10)','--btn-hvc':'#1a1a2a',
    '--div':'rgba(0,0,0,0.10)','--arr':'rgba(0,0,0,0.45)',
    '--bg':'#eeeef2','--sf':'#fff','--bd':'#c0c0d4','--hv':'#e0e0ec',
  }
  return Object.entries(t).map(([k,v])=>`${k}:${v}`).join(';')
})


// ─── persistent Render instance ──────────────────────────────────────────────
let render = null
let struct = new Struct()
let structService = null
let rdkit = null

let bondStartId = null
let dragStart = null
let dragAtoms = []
let isDragging = false
let panStart = null
let panVB = null
let rotateCenter = null

// after rescale() avg bond length = 1 model unit
const HIT_ATOM = 0.35
const HIT_BOND = 0.25

const BT = Bond.PATTERN.TYPE
const BS = Bond.PATTERN.STEREO

const renderOpts = {
  autoScale: false, autoScaleMargin: 20,
  showAtomIds: false, showBondIds: false, showHalfBondIds: false,
  showValenceWarnings: false, atomColoring: true,
  hideImplicitHydrogen: true, carbonExplicitly: false,
  showCharge: true, showHydrogenLabels: 'off', showValence: false,
  aromaticCircle: true, font: 'Arial',
  fontsz: 14, fontszUnit: 'px',
  bondLength: 40, bondLengthUnit: 'px',
  bondThickness: 2, bondThicknessUnit: 'px',
  zoom: 1,
}

// create Render once; reuse for all updates
function initRender() {
  if (!canvasEl.value) return
  if (render) {
    try { if (render.paper && render.paper.remove) render.paper.remove() } catch {}
    canvasEl.value.innerHTML = ''
    render = null
  }
  render = new Render(canvasEl.value, { ...renderOpts })
  render.observeCanvasResize()
}

// fit the full structure into the viewport (model coords → viewBox)
function fitToStructure() {
  if (!render || !struct || !struct.atoms.size) return
  const scale = 40
  const bb = struct.getCoordBoundingBox()
  if (!bb) return
  const molW = (bb.max.x - bb.min.x) * scale + 80
  const molH = (bb.max.y - bb.min.y) * scale + 80
  const sz = render.sz
  const zoom = Math.min(sz.x / Math.max(molW, 1), sz.y / Math.max(molH, 1))
  const vbW = sz.x / zoom
  const vbH = sz.y / zoom
  const cx = (bb.min.x + bb.max.x) / 2 * scale
  const cy = (bb.min.y + bb.max.y) / 2 * scale
  render.setViewBox({ minX: cx - vbW / 2, minY: cy - vbH / 2, width: vbW, height: vbH })
  currentZoom.value = zoom
  render.options.zoom = zoom
}

// update display via setMolecule — never destroy/recreate Render
function reRender() {
  if (!render) return
  render.setMolecule(struct.clone())
  if (bondStartId != null) {
    render.ctab.setSelection({ atoms: [bondStartId] })
  } else if (selection.atoms.length || selection.bonds.length) {
    render.ctab.setSelection({ atoms: selection.atoms, bonds: selection.bonds })
  }
  applyHover()
}

function clearHover() {
  if (hoveredAtomId != null && render && render.ctab) {
    const ra = render.ctab.atoms.get(hoveredAtomId)
    if (ra) ra.setHover(false, render)
  }
  if (hoveredBondId != null && render && render.ctab) {
    const rb = render.ctab.bonds.get(hoveredBondId)
    if (rb) rb.setHover(false, render)
  }
  hoveredAtomId = null
  hoveredBondId = null
}

function applyHover() {
  if (!render || !render.ctab) return
  if (hoveredAtomId != null) {
    const ra = render.ctab.atoms.get(hoveredAtomId)
    if (ra) ra.setHover(true, render)
  }
  if (hoveredBondId != null) {
    const rb = render.ctab.bonds.get(hoveredBondId)
    if (rb) rb.setHover(true, render)
  }
}

function resetView() {
  if (struct && struct.atoms.size) {
    fitToStructure()
  } else if (render) {
    render.setZoom(1)
    currentZoom.value = 1
  }
}

let hoveredAtomId = null
let hoveredBondId = null
let rectStart = null
let rectShape = null

// page (clientX/Y) → model coordinates (Angstroms)
function pageToModel(e) {
  if (!render || !canvasEl.value) return new Vec2(0, 0)
  try {
    const rect = canvasEl.value.getBoundingClientRect()
    const vx = e.clientX - rect.left
    const vy = e.clientY - rect.top
    const z = render.options.zoom || 1
    const vb = render.viewBox || { minX: 0, minY: 0 }
    const scale = 40
    return new Vec2((vx / z + vb.minX) / scale, (vy / z + vb.minY) / scale)
  } catch (err) {
    return new Vec2(0, 0)
  }
}

function findAtom(pos) {
  if (!struct || !struct.atoms.size) return null
  let best = null, bestD = HIT_ATOM
  for (const [id, atom] of struct.atoms) {
    const d = Vec2.dist(atom.pp, pos)
    if (d < bestD) { bestD = d; best = { id, atom } }
  }
  return best
}

function findBond(pos) {
  if (!struct || !struct.bonds.size) return null
  for (const [id, b] of struct.bonds) {
    const a1 = struct.atoms.get(b.begin), a2 = struct.atoms.get(b.end)
    if (!a1 || !a2) continue
    const bondLen = Vec2.dist(a1.pp, a2.pp)
    if (bondLen < 0.01) continue
    if (pos.calculateDistanceToLine([a1.pp, a2.pp]) < HIT_BOND &&
        Vec2.dist(pos, Vec2.centre(a1.pp, a2.pp)) < bondLen * 0.6) return id
  }
  return null
}

function pushUndo() {
  undoStack.splice(undoIdx.value + 1)
  undoStack.push(new MolSerializer().serialize(struct))
  if (undoStack.length > 50) undoStack.shift()
  undoIdx.value = undoStack.length - 1
}

function undo() {
  if (undoIdx.value <= 0) return
  undoIdx.value--
  try { struct = new MolSerializer().deserialize(undoStack[undoIdx.value]) } catch { return }
  reRender(); updateSmiles()
}

function redo() {
  if (undoIdx.value >= undoStack.length - 1) return
  undoIdx.value++
  try { struct = new MolSerializer().deserialize(undoStack[undoIdx.value]) } catch { return }
  reRender(); updateSmiles()
}

async function updateSmiles() {
  if (!struct || !rdkit) return
  try {
    const mb = new MolSerializer().serialize(struct)
    const mol = rdkit.get_mol(mb)
    if (!mol) return
    const s = mol.get_smiles()
    mol.delete()
    if (s && s !== molSmiles.value) { molSmiles.value = s; emit('change', s) }
  } catch {}
}

function clearCanvas() {
  pushUndo()
  struct = new Struct()
  currentZoom.value = 1
  if (render) render.setZoom(1)
  reRender()
  molSmiles.value = ''
}

function applyZoom() {
  if (!render) return
  render.setZoom(currentZoom.value)
}
function onWheel(e) {
  const old = currentZoom.value
  currentZoom.value = Math.max(0.1, Math.min(5, currentZoom.value * (e.deltaY > 0 ? 0.9 : 1.1)))
  if (render && currentZoom.value !== old) render.setZoom(currentZoom.value, e)
}
function zoomIn()  { currentZoom.value = Math.min(5, currentZoom.value * 1.2); applyZoom() }
function zoomOut() { currentZoom.value = Math.max(0.1, currentZoom.value / 1.2); applyZoom() }

function handleClick(pos) {
  if (!pos) return
  const hit = findAtom(pos)
  const aid = hit ? hit.id : null
  const bid = (aid == null) ? findBond(pos) : null
  const t = tool.value

  if (t === 'select') {
    if (aid != null) {
      const idx = selection.atoms.indexOf(aid)
      if (idx >= 0) selection.atoms.splice(idx, 1)
      else selection.atoms.push(aid)
    } else if (bid != null) {
      const idx = selection.bonds.indexOf(bid)
      if (idx >= 0) selection.bonds.splice(idx, 1)
      else selection.bonds.push(bid)
    } else {
      selection.atoms = []; selection.bonds = []
    }
    reRender(); return
  }

  if (t === 'atom') {
    const wasEmpty = !struct.atoms.size
    pushUndo()
    const label = curAtom.value
    struct.atoms.add(new Atom({ label, pp: pos.clone() }))
    reRender()
    if (wasEmpty) fitToStructure()
    updateSmiles(); return
  }
  if (t === 'erase') {
    if (aid != null) {
      pushUndo()
      for (const [bid2, b] of struct.bonds) {
        if (b.begin === aid || b.end === aid) struct.bonds.delete(bid2)
      }
      struct.atoms.delete(aid)
      reRender(); updateSmiles()
    } else if (bid != null) {
      pushUndo(); struct.bonds.delete(bid); reRender(); updateSmiles()
    }
    return
  }
  if (t === 'b1' || t === 'bup' || t === 'bdn' || t === 'b2' || t === 'b3' || t === 'bar') {
    if (aid == null) return
    if (bondStartId == null) { bondStartId = aid; return }
    if (bondStartId === aid) { bondStartId = null; return }
    pushUndo()
    let type = BT.SINGLE, stereo = BS.NONE
    if (t === 'bup') stereo = BS.UP
    else if (t === 'bdn') stereo = BS.DOWN
    else if (t === 'b2') type = BT.DOUBLE
    else if (t === 'b3') type = BT.TRIPLE
    else if (t === 'bar') type = BT.AROMATIC
    if (!struct.checkBondExists(bondStartId, aid))
      struct.bonds.add(new Bond({ begin: bondStartId, end: aid, type, stereo }))
    bondStartId = null; reRender(); updateSmiles(); return
  }
  if (t === 'chain') {
    pushUndo()
    if (aid != null) {
      const src = struct.atoms.get(aid)
      const dir = Vec2.diff(pos, src.pp)
      const step = dir.length() > 0.01 ? dir.normalized() : new Vec2(1, 0)
      const nid = struct.atoms.add(new Atom({ label: 'C', pp: src.pp.add(step) }))
      struct.bonds.add(new Bond({ begin: aid, end: nid, type: BT.SINGLE }))
    } else {
      struct.atoms.add(new Atom({ label: 'C', pp: pos.clone() }))
    }
    reRender(); updateSmiles(); return
  }
  if (t === 'cp' || t === 'cm') {
    if (aid == null) return
    pushUndo()
    const a = struct.atoms.get(aid)
    a.charge = (a.charge || 0) + (t === 'cp' ? 1 : -1)
    if (a.charge === 0) a.charge = null
    reRender(); updateSmiles(); return
  }
  if (t === 'stereo') {
    if (aid == null) return
    pushUndo()
    const a = struct.atoms.get(aid)
    const labels = [null, 'abs', 'or', '&']
    a.stereoLabel = labels[(labels.indexOf(a.stereoLabel || null) + 1) % labels.length]
    reRender(); updateSmiles(); return
  }
  if (t === 'text') {
    pushUndo()
    const c = prompt('Text:', '')
    if (c) { const tp = pos.clone(); struct.texts.add(new Text({ content: c, position: tp, pos: [tp] })) }
    reRender(); updateSmiles(); return
  }
}

function onMD(e) {
  if (!canvasEl.value || !render) return
  if (e.button === 2) { bondStartId = null; return }
  const pos = pageToModel(e)
  const t = tool.value
  if (t === 'hand') {
    isDragging = true
    panStart = { x: e.clientX, y: e.clientY }
    const vb = render.viewBox
    panVB = { minX: vb.minX, minY: vb.minY, w: vb.width, h: vb.height }
    return
  }
  if (t === 'select') {
    clearHover()
    const hit = findAtom(pos)
    if (hit) { dragStart = pos; dragAtoms = [hit.id]; isDragging = false; rectStart = null }
    else { dragStart = pos; dragAtoms = []; isDragging = false; rectStart = pos }
    return
  }
  if (t === 'rotate') {
    const hit = findAtom(pos)
    if (hit) { dragStart = pos; dragAtoms = [hit.id]; rotateCenter = hit.atom.pp.clone(); isDragging = false }
    return
  }
  handleClick(pos)
}

function onMM(e) {
  if (!canvasEl.value || !render) return
  const t = tool.value
  const pos = pageToModel(e)

  // hover detection for select / erase
  if ((t === 'select' || t === 'erase') && !isDragging && !rectStart) {
    const hit = findAtom(pos)
    const bid = !hit ? findBond(pos) : null
    if (hit && hit.id !== hoveredAtomId) {
      clearHover()
      hoveredAtomId = hit.id
      if (render.ctab) { const ra = render.ctab.atoms.get(hit.id); if (ra) ra.setHover(true, render) }
    } else if (bid != null && bid !== hoveredBondId) {
      clearHover()
      hoveredBondId = bid
      if (render.ctab) { const rb = render.ctab.bonds.get(bid); if (rb) rb.setHover(true, render) }
    } else if (!hit && !bid) {
      clearHover()
    }
  }

  if (t === 'hand' && isDragging && panStart && panVB) {
    const rect = canvasEl.value.getBoundingClientRect()
    const z = render.options.zoom || 1
    const sx = panVB.w / rect.width
    const sy = panVB.h / rect.height
    render.setViewBox({
      minX: panVB.minX - (e.clientX - panStart.x) * sx,
      minY: panVB.minY - (e.clientY - panStart.y) * sy,
      width: panVB.w, height: panVB.h,
    })
    return
  }
  // rectangle select
  if (t === 'select' && !dragAtoms.length && rectStart) {
    const dx = pos.x - rectStart.x, dy = pos.y - rectStart.y
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      isDragging = true
      if (rectShape) { rectShape.remove(); rectShape = null }
      const scale = 40
      const cStart = new Vec2(rectStart.x * scale, rectStart.y * scale)
      const cEnd = new Vec2(pos.x * scale, pos.y * scale)
      rectShape = render.selectionRectangle(cStart, cEnd)
    }
    return
  }
  if (t === 'rotate' && dragAtoms.length && dragStart && rotateCenter) {
    const pos = pageToModel(e)
    const dx = pos.x - dragStart.x, dy = pos.y - dragStart.y
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      isDragging = true
      const a1 = Math.atan2(pos.y - rotateCenter.y, pos.x - rotateCenter.x)
      const a0 = Math.atan2(dragStart.y - rotateCenter.y, dragStart.x - rotateCenter.x)
      const ang = a1 - a0
      for (const aid of dragAtoms) {
        const atom = struct.atoms.get(aid)
        if (atom) {
          const rx = atom.pp.x - rotateCenter.x, ry = atom.pp.y - rotateCenter.y
          atom.pp = new Vec2(
            rotateCenter.x + rx * Math.cos(ang) - ry * Math.sin(ang),
            rotateCenter.y + rx * Math.sin(ang) + ry * Math.cos(ang)
          )
        }
      }
      dragStart = pos; reRender()
    }
    return
  }
  if (t === 'select' && dragAtoms.length && dragStart) {
    const pos = pageToModel(e)
    const dx = pos.x - dragStart.x, dy = pos.y - dragStart.y
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      if (!isDragging) pushUndo()
      isDragging = true
      for (const aid of dragAtoms) {
        const a = struct.atoms.get(aid)
        if (a) { a.pp.x += dx; a.pp.y += dy }
      }
      dragStart = pos; reRender()
    }
    return
  }
}

function onMU(e) {
  if (tool.value === 'select') {
    if (rectStart && isDragging) {
      if (rectShape) { rectShape.remove(); rectShape = null }
      const end = pageToModel(e || { clientX: 0, clientY: 0 })
      const minX = Math.min(rectStart.x, end.x), maxX = Math.max(rectStart.x, end.x)
      const minY = Math.min(rectStart.y, end.y), maxY = Math.max(rectStart.y, end.y)
      selection.atoms = []; selection.bonds = []
      for (const [id, atom] of struct.atoms) {
        if (atom.pp.x >= minX && atom.pp.x <= maxX && atom.pp.y >= minY && atom.pp.y <= maxY) {
          selection.atoms.push(id)
        }
      }
      for (const [id, b] of struct.bonds) {
        const a1 = struct.atoms.get(b.begin), a2 = struct.atoms.get(b.end)
        if (a1 && a2 && a1.pp.x >= minX && a1.pp.x <= maxX && a1.pp.y >= minY && a1.pp.y <= maxY &&
            a2.pp.x >= minX && a2.pp.x <= maxX && a2.pp.y >= minY && a2.pp.y <= maxY) {
          selection.bonds.push(id)
        }
      }
      reRender()
    } else if (isDragging) {
      updateSmiles()
    } else if (dragAtoms.length && dragStart) {
      const aid = dragAtoms[0]
      const idx = selection.atoms.indexOf(aid)
      if (idx >= 0) selection.atoms.splice(idx, 1)
      else selection.atoms.push(aid)
      reRender()
    } else if (dragStart) {
      const bid = findBond(dragStart)
      if (bid != null) {
        const idx = selection.bonds.indexOf(bid)
        if (idx >= 0) selection.bonds.splice(idx, 1)
        else selection.bonds.push(bid)
      } else {
        selection.atoms = []; selection.bonds = []
      }
      reRender()
    }
  } else if (isDragging) {
    updateSmiles()
  }
  isDragging = false; dragStart = null; dragAtoms = []
  panStart = null; panVB = null; rotateCenter = null
  rectStart = null
  if (rectShape) { rectShape.remove(); rectShape = null }
  clearHover()
}

function onRootMove(e) {
}

async function runService(method) {
  if (!structService) return
  const s = new MolSerializer()
  try {
    const r = await structService[method]({ struct: s.serialize(struct), output_format: ChemicalMimeType.Mol })
    if (r && r.struct) {
      const ns = s.deserialize(r.struct)
      if (ns) { pushUndo(); struct = ns; reRender(); updateSmiles() }
    }
  } catch (e) { console.warn(method, e) }
}
const aromatize   = () => runService('aromatize')
const dearomatize = () => runService('dearomatize')
const cleanUp     = () => runService('clean')
const layout      = () => runService('layout')

async function addTemplate(tpl) {
  if (!rdkit) return
  try {
    const ts = new MolSerializer().deserialize(smilesToMolblock(rdkit, tpl.smiles))
    if (!ts) return
    pushUndo()
    let offsetX = 0
    if (struct.atoms.size) { const bb = struct.getCoordBoundingBox(); offsetX = bb.max.x + 2 }
    const aidMap = new Map()
    for (const [tid, ta] of ts.atoms) {
      ta.pp = new Vec2(ta.pp.x + offsetX, ta.pp.y)
      aidMap.set(tid, struct.atoms.add(ta.clone()))
    }
    for (const [, tb] of ts.bonds) {
      const nb = aidMap.get(tb.begin), ne = aidMap.get(tb.end)
      if (nb != null && ne != null && !struct.checkBondExists(nb, ne))
        struct.bonds.add(new Bond({ begin: nb, end: ne, type: tb.type, stereo: tb.stereo }))
    }
    reRender(); fitToStructure(); updateSmiles()
  } catch (e) { console.warn(e) }
}

function openFile() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = '.mol,.sdf,.smi,.txt,.rxn'
  input.onchange = async (ev) => {
    const file = ev.target.files[0]; if (!file) return
    const text = await file.text()
    const ser = new MolSerializer()
    try {
      const s = ser.deserialize(text)
      if (s && s.atoms.size) { pushUndo(); struct = s; reRender(); updateSmiles(); return }
    } catch {}
    if (rdkit) {
      try {
        const s = ser.deserialize(smilesToMolblock(rdkit, text.trim()))
        if (s && s.atoms.size) { pushUndo(); struct = s; reRender(); updateSmiles() }
      } catch {}
    }
  }
  input.click()
}

async function saveAs(format) {
  saveMenu.value = false; saveFmt.value = format
  if (!struct) return
  const ser = new MolSerializer(); let c = ''
  try {
    const mb = ser.serialize(struct)
    if (format === 'mol')         c = mb
    else if (format === 'smiles') c = molSmiles.value
    else if (format === 'smarts') { const mol = rdkit && rdkit.get_mol(mb); if (mol) { c = mol.get_smarts(); mol.delete() } }
    else if (format === 'inchi')  { const mol = rdkit && rdkit.get_mol(mb); if (mol) { c = mol.get_inchi();  mol.delete() } }
    else if (format === 'sdf')    c = mb + '\n$$$$\n'
  } catch {}
  saveContent.value = c; saveDialog.value = true
}
function copySave() { navigator.clipboard.writeText(saveContent.value).then(() => { saveDialog.value = false }).catch(() => {}) }

async function initCore() {
  try {
    structService = new StandaloneStructServiceProvider().createStructService({})
    rdkit = await getRDKitModule()
  } catch (e) { emit('error', e.message) }
}

async function loadSmiles(smi) {
  if (!smi || !rdkit) return
  try {
    const s = new MolSerializer().deserialize(smilesToMolblock(rdkit, smi))
    if (s && s.atoms.size) {
      pushUndo(); struct = s
      fitToStructure()
      reRender()
      updateSmiles(); emit('loaded')
    }
  } catch (e) { emit('error', e.message) }
}

onMounted(async () => {
  await initCore()
  await nextTick()
  initRender()
  undoStack.push(new MolSerializer().serialize(struct))
  undoIdx.value = 0
  reRender()
  if (props.smiles) await loadSmiles(props.smiles)
})

onBeforeUnmount(() => {
  try { if (render && render.paper && render.paper.remove) render.paper.remove() } catch {}
  render = null
  if (structService && structService.destroy) structService.destroy()
})

watch(() => props.smiles, async (v) => {
  if (!rdkit || !v) return
  await loadSmiles(v)
})

</script>

<style scoped>
.kc-root {
  --glass-bg: rgba(255,255,255,0.80); --glass-blur: 10px; --glass-border: 1px solid rgba(255,255,255,0.60); --glass-shadow: 0 2px 12px rgba(0,0,0,0.06);
  --ac: #4a5af0; --ac-lt: #7c8cf8; --ac-bg: rgba(74,106,240,0.14); --ac-bd: rgba(74,106,240,0.4);
  --tx: #1a1a2a; --tx2: #444; --tx3: #bbb;
  --btn: rgba(0,0,0,0.72); --btn-hv: rgba(0,0,0,0.10); --btn-hvc: #1a1a2a;
  --div: rgba(0,0,0,0.10); --arr: rgba(0,0,0,0.45);
  --bg: #eeeef2; --sf: #fff; --bd: #c0c0d4; --hv: #e0e0ec;
  font-family: Inter,FreeSans,Arimo,sans-serif; font-size: 13px; color: var(--tx);
  border-radius: 20px; overflow: hidden;
  display: flex; flex-direction: column; height: 520px; position: relative;
  background: var(--bg);
}
.kc-top { display:flex; align-items:center; gap:1px; padding:4px 8px; flex-shrink:0; position:relative; background:var(--glass-bg); border-radius:20px 20px 0 0 }
.glass { background:var(--glass-bg); backdrop-filter:blur(var(--glass-blur)); -webkit-backdrop-filter:blur(var(--glass-blur)); border:var(--glass-border); box-shadow:var(--glass-shadow) }
.kc-btn { display:flex; align-items:center; justify-content:center; width:28px; height:26px; border:none; background:transparent; border-radius:8px; cursor:pointer; color:var(--btn); transition:all .15s; font-size:12px; font-family:inherit }
.kc-btn:hover { background:var(--btn-hv); color:var(--btn-hvc) }
.kc-btn:disabled { opacity:.3; cursor:default }
.kc-sep { width:1px; height:18px; background:var(--div); margin:0 3px; flex-shrink:0 }
.kc-spacer { flex:1 }
.kc-zl { font-size:11px; color:var(--tx2); min-width:32px; text-align:center; user-select:none }
.kc-status { font-size:11px; color:var(--ac); font-weight:600; margin-left:8px; user-select:none; white-space:nowrap }
.kc-smi { display:flex; align-items:center; gap:4px; max-width:260px; overflow:hidden; font-size:11px }
.kc-smi-l { color:var(--tx2); flex-shrink:0 }
.kc-smi-v { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:'SF Mono','Fira Code',monospace; color:var(--tx) }
.kc-mid { flex:1; min-height:0; position:relative }
.kc-panel-left { position:absolute; left:0; top:0; height:100%; z-index:5; display:flex; flex-direction:column; align-items:center; gap:1px; padding:6px 4px; width:36px; overflow-y:auto; overflow-x:hidden; border-right:1px solid var(--bd) }
.kc-panel-right { position:absolute; right:0; top:0; height:100%; z-index:5; display:flex; flex-direction:column; align-items:center; gap:1px; padding:6px 4px; width:36px; overflow-y:auto; overflow-x:hidden; border-left:1px solid var(--bd) }
.kc-lg { font-size:7px; text-transform:uppercase; color:var(--tx2); letter-spacing:.5px; margin:4px 0 2px; text-align:center; width:100% }
.kc-tb { display:flex; align-items:center; justify-content:center; width:28px; height:26px; border:1px solid transparent; background:transparent; border-radius:8px; cursor:pointer; color:var(--btn); transition:all .15s }
.kc-tb:hover { background:var(--btn-hv); color:var(--btn-hvc) }
.kc-tb.on { background:var(--ac-bg); border-color:var(--ac-bd); color:var(--ac) }
.kc-sr { width:22px; height:1px; background:var(--div); margin:4px 0 }
.kc-canvas { position:absolute; inset:0; background:var(--sf); overflow:hidden }
.kc-canvas.cs-hand { cursor:grab }
.kc-canvas.cs-hand:active { cursor:grabbing }
.kc-canvas.cs-select { cursor:default }
.kc-canvas.cs-erase { cursor:not-allowed }
.kc-canvas.cs-atom { cursor:crosshair }
.kc-canvas.cs-bond { cursor:crosshair }
.kc-canvas.cs-chain { cursor:crosshair }
.kc-canvas.cs-text { cursor:text }
.kc-canvas :deep(svg) { display:block; width:100%; height:100% }
.kc-atm { display:flex; align-items:center; justify-content:center; width:28px; height:26px; border:1px solid transparent; background:transparent; border-radius:8px; cursor:pointer; color:var(--btn); font-size:11px; font-weight:600; font-family:inherit; transition:all .15s }
.kc-atm:hover { background:var(--btn-hv); color:var(--btn-hvc) }
.kc-atm.on { background:var(--ac-bg); border-color:var(--ac-bd); color:var(--ac) }
.kc-atm.km { font-size:9px; font-weight:500 }
.kc-bot { position:absolute; bottom:10px; left:50%; transform:translateX(-50%) translateY(50px); display:flex; align-items:center; gap:3px; padding:5px 10px; border-radius:16px; white-space:nowrap; opacity:0; pointer-events:none; transition:transform .25s ease, opacity .2s ease; z-index:10 }
.kc-bot.raised { transform:translateX(-50%) translateY(0); opacity:1; pointer-events:auto }
.kc-bd { width:1px; height:18px; background:var(--div); margin:0 2px; flex-shrink:0 }
.kc-arrow { position:absolute; bottom:52px; left:50%; z-index:9; cursor:pointer; color:var(--arr); transform:translateX(-50%) translateY(50px); display:flex; align-items:center; justify-content:center; opacity:1; transition:transform .3s ease, opacity .2s ease }
.kc-arrow.down { transform:translateX(-50%) translateY(0) rotate(180deg); opacity:.7 }
.kc-arrow:hover { opacity:1 }
.kc-tpl { display:flex; align-items:center; justify-content:center; width:28px; height:26px; border:1px solid transparent; background:transparent; border-radius:8px; cursor:pointer; color:var(--btn); transition:all .15s; font-size:11px; font-weight:600; font-family:inherit }
.kc-tpl:hover { background:var(--btn-hv); color:var(--btn-hvc) }
.kc-tpl.on { background:var(--ac-bg); border-color:var(--ac-bd); color:var(--ac) }
.kc-wrench.on { background:var(--ac-bg); border-color:var(--ac-bd); color:var(--ac) }
.p-slide-enter-active, .p-slide-leave-active { transition: opacity .2s ease; overflow:hidden }
.p-slide-enter-from, .p-slide-leave-to { opacity:0 }
.kc-panel-left::-webkit-scrollbar, .kc-panel-right::-webkit-scrollbar { width:3px }
.kc-panel-left::-webkit-scrollbar-thumb, .kc-panel-right::-webkit-scrollbar-thumb { background:var(--div); border-radius:2px }
.kc-panel-left::-webkit-scrollbar-track, .kc-panel-right::-webkit-scrollbar-track { background:transparent }
.kc-dd-wrap { position:absolute; top:100%; left:0; z-index:100; background:var(--sf); border:var(--glass-border); border-radius:8px; box-shadow:var(--glass-shadow); padding:4px; min-width:140px; backdrop-filter:blur(var(--glass-blur)) }
.kc-ddi { padding:5px 10px; cursor:pointer; border-radius:4px; font-size:12px; color:var(--tx); white-space:nowrap }
.kc-ddi:hover { background:var(--hv) }
.kc-ovl { position:absolute; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:200 }
.kc-modal { border-radius:12px; width:460px; max-width:90%; max-height:80%; overflow:hidden; display:flex; flex-direction:column; background:var(--sf) }
.kc-modal-sm { width:380px }
.kc-mh { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--bd); font-weight:600; font-size:14px }
.kc-mc { background:none; border:none; font-size:20px; cursor:pointer; color:var(--tx2); padding:0 4px }
.kc-mb { padding:14px }
.kc-ta { width:100%; resize:vertical; border:1px solid var(--bd); border-radius:6px; padding:8px; font-family:'SF Mono','Fira Code',monospace; font-size:11px; background:var(--bg); color:var(--tx); margin-bottom:10px; box-sizing:border-box }
.kc-mbtn { width:100%; padding:8px; border:none; border-radius:6px; background:var(--ac); color:#fff; font-size:13px; cursor:pointer; font-family:inherit }
.kc-mbtn:hover { opacity:.85 }
.kc-pts { display:grid; grid-template-columns:repeat(6,1fr); gap:3px; padding:14px }
.kc-ptb { display:flex; align-items:center; justify-content:center; padding:5px 2px; border:1px solid var(--bd); border-radius:4px; background:var(--bg); color:var(--tx); cursor:pointer; font-size:11px; font-family:inherit; transition:all .15s }
.kc-ptb:hover { background:var(--hv); border-color:var(--ac) }
</style>
