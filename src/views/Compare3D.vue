<template>
  <div class="container">
    <div class="page-header">
      <h2>3D Structure Comparison</h2>
      <p>Free combination of small molecules and protein structures</p>
    </div>

    <div class="section-label">Small Molecule (optional)</div>
    <div class="selector">
      <button
        class="mol-btn"
        :class="{ selected: selectedMol === null }"
        @click="selectedMol = null"
      >
        <span class="mol-name">None</span>
        <span class="mol-formula">No molecule</span>
      </button>
      <button
        v-for="mol in molecules"
        :key="mol.id"
        class="mol-btn"
        :class="{ selected: selectedMol?.id === mol.id }"
        @click="selectedMol = mol"
      >
        <span class="mol-name">{{ mol.name }}</span>
        <span class="mol-formula">{{ mol.formula }}</span>
      </button>
    </div>

    <div class="section-label">Protein Target (optional)</div>
    <div class="selector">
      <button
        class="mol-btn"
        :class="{ selected: selectedProtein === null }"
        @click="selectedProtein = null"
      >
        <span class="mol-name">None</span>
        <span class="mol-formula">No protein</span>
      </button>
      <button
        v-for="p in proteins"
        :key="p.id"
        class="mol-btn"
        :class="{ selected: selectedProtein?.id === p.id }"
        @click="selectedProtein = p"
      >
        <span class="mol-name">{{ p.name }}</span>
        <span class="mol-formula">{{ p.description }}</span>
      </button>
    </div>

    <div v-if="selectedMol && !selectedProtein" class="style-bar">
      <span class="style-label">Style:</span>
      <button
        v-for="s in styles"
        :key="s.id"
        class="style-btn"
        :class="{ active: selectedStyle === s.id }"
        @click="selectedStyle = s.id"
      >{{ s.label }}</button>
    </div>

    <div class="grid-2col">
      <ThreeDmolViewer
        :sdf-path="selectedMol?.sdfPath || ''"
        :pdb-path="selectedProtein?.pdbPath || ''"
        :style="selectedMol && !selectedProtein ? selectedStyle : 'ribbon'"
      />
      <MolStarViewer
        :sdf-path="selectedMol?.sdfPath || ''"
        :pdb-path="selectedProtein?.pdbPath || ''"
      />
    </div>

    <div class="info-table">
      <h3>Framework Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>3Dmol.js</th>
            <th>Mol*</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rendering</td>
            <td>WebGL (Three.js)</td>
            <td>Custom WebGL + React UI</td>
          </tr>
          <tr>
            <td>Data Format</td>
            <td>MOL/SDF/PDB via RDKit</td>
            <td>SDF/PDB</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>~800 KB</td>
            <td>~3 MB (CDN)</td>
          </tr>
          <tr>
            <td>Style Switching</td>
            <td>Real-time setStyle</td>
            <td>Preset-based</td>
          </tr>
          <tr>
            <td>Interactivity</td>
            <td>Rotate / Zoom / Click</td>
            <td>Rotate / Zoom / Select</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ThreeDmolViewer from '../components/ThreeDmolViewer.vue'
import MolStarViewer from '../components/MolStarViewer.vue'
import { molecules, proteins } from '../data/molecules.js'

const selectedMol = ref(molecules[0])
const selectedProtein = ref(null)
const selectedStyle = ref('ball-stick')

const styles = [
  { id: 'ball-stick', label: 'Ball & Stick' },
  { id: 'stick', label: 'Stick' },
  { id: 'spacefill', label: 'Spacefill' },
  { id: 'line', label: 'Line' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'surface', label: 'Surface' },
]
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #e8e8f8;
  margin-bottom: 4px;
}

.page-header p {
  font-size: 14px;
  color: #7a7a9a;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #8888aa;
  margin-bottom: 8px;
  margin-top: 4px;
  padding-left: 2px;
}

.style-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.style-label {
  font-size: 13px;
  color: #7a7a9a;
  margin-right: 4px;
}

.style-btn {
  background: #1a1a30;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 12px;
  color: #8888aa;
  font-family: inherit;
  transition: all 0.2s;
}

.style-btn:hover {
  border-color: #4a4a7a;
  color: #b0b0cc;
}

.style-btn.active {
  border-color: #7c8cf8;
  background: rgba(124, 140, 248, 0.12);
  color: #c8d0ff;
}

.selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.mol-btn {
  background: #1a1a30;
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #aaaacc;
}

.mol-btn:hover {
  border-color: #4a4a7a;
  background: #222240;
}

.mol-btn.selected {
  border-color: #7c8cf8;
  background: rgba(124, 140, 248, 0.12);
  color: #c8d0ff;
}

.mol-name {
  font-size: 14px;
  font-weight: 600;
}

.mol-formula {
  font-size: 12px;
  color: #6a6a8a;
}

.mol-btn.selected .mol-formula {
  color: #7c8cf8;
}

.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

@media (max-width: 900px) {
  .grid-2col {
    grid-template-columns: 1fr;
  }
}

.info-table {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px 24px;
}

.info-table h3 {
  margin-bottom: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  padding: 8px 12px;
  color: #7c8cf8;
  font-weight: 600;
  border-bottom: 1px solid #2a2a4a;
}

td {
  padding: 8px 12px;
  color: #aaaacc;
  border-bottom: 1px solid #1e1e36;
}

tr:last-child td {
  border-bottom: none;
}
</style>