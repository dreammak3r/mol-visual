<template>
  <div class="container">
    <div class="page-header">
      <h2>2D Structure Comparison</h2>
      <p>Compare SMILES-based 2D rendering across different frameworks</p>
    </div>

    <MoleculeSelector v-model="selectedMol" />

    <div class="grid-3col">
      <RdkitViewer :smiles="selectedMol.smiles" />
      <SmilesDrawerViewer :smiles="selectedMol.smiles" />
      <KetcherViewer :smiles="selectedMol.smiles" />
    </div>

    <div class="info-table">
      <h3>Framework Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>RDKit.js</th>
            <th>SmilesDrawer</th>
            <th>Ketcher</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Engine</td>
            <td>RDKit (C++ &rarr; WASM)</td>
            <td>Pure JavaScript</td>
            <td>Indigo (C++ &rarr; WASM)</td>
          </tr>
          <tr>
            <td>Output</td>
            <td>SVG</td>
            <td>Canvas</td>
            <td>Canvas (WASM)</td>
          </tr>
          <tr>
            <td>Size</td>
            <td>~5 MB (WASM)</td>
            <td>~50 KB</td>
            <td>~8 MB (WASM)</td>
          </tr>
          <tr>
            <td>Stereochemistry</td>
            <td>Full support</td>
            <td>Basic display</td>
            <td>Full support</td>
          </tr>
          <tr>
            <td>Editing</td>
            <td>No</td>
            <td>No</td>
            <td>Full editor</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MoleculeSelector from '../components/MoleculeSelector.vue'
import RdkitViewer from '../components/RdkitViewer.vue'
import SmilesDrawerViewer from '../components/SmilesDrawerViewer.vue'
import KetcherViewer from '../components/KetcherViewer.vue'
import { molecules } from '../data/molecules.js'

const selectedMol = ref(molecules[0])
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header { margin-bottom: 20px; }

.page-header h2 {
  font-size: 22px; font-weight: 700;
  color: #e8e8f8; margin-bottom: 4px;
}

.page-header p {
  font-size: 14px; color: #7a7a9a;
}

.grid-3col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

@media (max-width: 1100px) {
  .grid-3col { grid-template-columns: 1fr; }
}

.info-table {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  padding: 20px 24px;
}

.info-table h3 {
  font-size: 16px; font-weight: 600;
  margin-bottom: 14px; color: #4a5af0;
}

table { width: 100%; border-collapse: collapse; font-size: 13px; }

th {
  text-align: left; padding: 8px 12px;
  color: #7c8cf8; font-weight: 600;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

td {
  padding: 8px 12px; color: #555;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

tr:last-child td { border-bottom: none; }
</style>
