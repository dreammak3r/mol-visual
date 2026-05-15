<template>
  <div class="selector">
    <button
      v-for="mol in molecules"
      :key="mol.id"
      class="mol-btn"
      :class="{ selected: modelValue?.id === mol.id }"
      @click="$emit('update:modelValue', mol)"
    >
      <span class="mol-name">{{ mol.name }}</span>
      <span class="mol-formula">{{ mol.formula }}</span>
    </button>
  </div>
</template>

<script setup>
import { molecules } from '../data/molecules.js'

defineProps({
  modelValue: { type: Object, default: () => molecules[0] },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.selector {
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-bottom: 24px;
}

.mol-btn {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #555;
  font-family: inherit;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.mol-btn:hover {
  background: rgba(255,255,255,0.85);
  border-color: #7c8cf8;
}

.mol-btn.selected {
  background: rgba(74,106,240,0.12);
  border-color: rgba(74,106,240,0.3);
  color: #4a5af0;
}

.mol-name { font-size: 14px; font-weight: 600; }
.mol-formula { font-size: 12px; color: #888; }

.mol-btn.selected .mol-formula { color: #7c8cf8; }
</style>
