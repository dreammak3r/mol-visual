<template>
  <div class="container">
    <div class="page-header">
      <h2>2D Structure Comparison</h2>
      <p>Compare SMILES-based 2D rendering across different frameworks</p>
    </div>

    <MoleculeSelector v-model="selectedMol" />

    <div class="grid-2col">
      <RdkitViewer :smiles="selectedMol.smiles" />
      <SmilesDrawerViewer :smiles="selectedMol.smiles" />
      <KetcherViewer :smiles="selectedMol.smiles" />
      <KetcherCustom :smiles="selectedMol.smiles" />
    </div>

    <div class="info-table">
      <h3>Framework Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>RDKit.js</th>
            <th>SmilesDrawer</th>
            <th>Ketcher (Custom)</th>
            <th>Ketcher (Orig)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Engine</td>
            <td>RDKit (C++ &rarr; WASM)</td>
            <td>Pure JavaScript</td>
            <td>ketcher-core + Raphael</td>
            <td>Indigo (C++ &rarr; WASM)</td>
          </tr>
          <tr>
            <td>Output</td>
            <td>SVG</td>
            <td>Canvas</td>
            <td>SVG (Raphael)</td>
            <td>Iframe / SVG</td>
          </tr>
          <tr>
            <td>Bundle</td>
            <td>~5 MB WASM</td>
            <td>~50 KB</td>
            <td>~6 MB (ketcher-core)</td>
            <td>~8 MB WASM (iframe)</td>
          </tr>
          <tr>
            <td>Editing</td>
            <td>No</td>
            <td>No</td>
            <td>View-only</td>
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
import KetcherViewer from '../components/ketcher/KetcherViewer.vue'
import KetcherCustom from '../components/ketcher/KetcherCustom.vue'
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

.grid-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.info-table {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 20px 24px;
}

.info-table h3 {
  font-size: 16px; font-weight: 600;
  margin-bottom: 14px; color: #c0c0d0;
}

table { width: 100%; border-collapse: collapse; font-size: 13px; }

th {
  text-align: left; padding: 8px 12px;
  color: #7c8cf8; font-weight: 600;
  border-bottom: 1px solid #2a2a4a;
}

td {
  padding: 8px 12px; color: #aaaacc;
  border-bottom: 1px solid #1e1e36;
}

tr:last-child td { border-bottom: none; }
</style>
