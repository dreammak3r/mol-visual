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
  background: #1a1a30;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #aaaacc;
  font-family: inherit;
}

.mol-btn:hover {
  border-color: #4a4a7a;
  background: #222240;
}

.mol-btn.selected {
  border-color: #7c8cf8;
  background: rgba(124,140,248,0.12);
  color: #c8d0ff;
}

.mol-name { font-size: 14px; font-weight: 600; }
.mol-formula { font-size: 12px; color: #6a6a8a; }

.mol-btn.selected .mol-formula { color: #7c8cf8; }
</style>
