<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="logo" @click="$router.push('/')">🧪 MoleculeViz</h1>        
        <nav class="nav">
          <router-link to="/" class="nav-link" exact-active-class="active">Home</router-link>
          <router-link to="/2d" class="nav-link" active-class="active">2D Comparison</router-link>
          <router-link to="/3d" class="nav-link" active-class="active">3D Comparison</router-link>
          <router-link to="/test/molstar" class="nav-link" active-class="active">Mol* Test</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { preloadRDKit } from './utils/rdkit-preload.js'

onMounted(() => {
  preloadRDKit()
})
</script>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f0f1a;
  color: #e0e0e0;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #16162a;
  border-bottom: 1px solid #2a2a4a;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #7c8cf8;
  cursor: pointer;
  user-select: none;
  letter-spacing: -0.5px;
}

.nav {
  display: flex;
  gap: 4px;
}
.nav-link {
  color: #8888aa;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #c0c0e0;
  background: rgba(124, 140, 248, 0.08);
}

.nav-link.active {
  color: #a0b0ff;
  background: rgba(124, 140, 248, 0.15);
}

.main {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}
</style>