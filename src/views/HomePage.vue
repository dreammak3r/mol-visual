<template>
  <div class="container">
    <div class="viewer-header">
      <span class="lib-name">Home</span>
    </div>
    <div class="home-content">
      <div class="hero-section">
        <h2>Molecule Visualization Framework Comparison</h2>
        <p class="subtitle">Compare popular 2D and 3D molecule visualization libraries side-by-side</p>
      </div>

      <div class="cards-row">
        <router-link to="/2d" class="nav-card">
          <div class="card-icon">⚗️</div>
          <h3>2D Comparison</h3>
          <p>RDKit.js · SmilesDrawer · Ketcher</p>
          <span class="card-tag">3 frameworks</span>
        </router-link>

        <router-link to="/3d" class="nav-card">
          <div class="card-icon">🧬</div>
          <h3>3D Comparison</h3>
          <p>3Dmol.js · Mol* · NGL Viewer</p>
          <span class="card-tag">3 frameworks</span>
        </router-link>

        <router-link to="/test/molstar" class="nav-card">
          <div class="card-icon">🔬</div>
          <h3>Mol* Standalone</h3>
          <p>PluginContext API · Vue UI</p>
          <span class="card-tag">resizable</span>
        </router-link>
      </div>

      <div class="molecules-preview">
        <h3>Demo Molecules</h3>
        <div class="mol-tags">
          <span v-for="mol in molecules" :key="mol.id" class="mol-tag">
            <strong>{{ mol.name }}</strong>
            <code>{{ mol.smiles }}</code>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { molecules } from '../data/molecules.js'
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.hero-section h2 {
  font-size: 28px;
  font-weight: 700;
  color: #e8e8f8;
  margin-bottom: 8px;
}

.subtitle {
  color: #7a7a9a;
  font-size: 15px;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 48px;
}

.nav-card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 14px;
  padding: 32px 24px;
  text-decoration: none;
  color: #e0e0e0;
  transition: all 0.25s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nav-card:hover {
  border-color: #7c8cf8;
  background: #1c1c36;
  transform: translateY(-2px);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.nav-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.nav-card p {
  font-size: 13px;
  color: #7a7a9a;
  margin-bottom: 12px;
}

.card-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(124, 140, 248, 0.15);
  color: #7c8cf8;
  font-weight: 500;
}

.molecules-preview {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 14px;
  padding: 24px;
}

.molecules-preview h3 {
  font-size: 16px;
  margin-bottom: 14px;
  color: #c0c0d0;
}

.mol-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mol-tag {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #1e1e36;
  border-radius: 8px;
  font-size: 13px;
}

.mol-tag strong {
  min-width: 100px;
  color: #b0b8f0;
}

.mol-tag code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #7a7a9a;
  background: none;
}
</style>
