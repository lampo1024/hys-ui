<script setup lang="ts">
import { ref } from "vue";
import { HysActionBar, HysCheckbox, HysScrollbar } from "hys-ui";
const selected = ref(3);
const floating = ref(true);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="floating">随列表吸顶</HysCheckbox>
    <HysScrollbar :height="186" :tabindex="0" aria-label="可批量操作的批次">
      <HysActionBar :placement="floating ? 'top' : 'inline'" :selected-count="selected" visible-when-empty
        show-select-all :total-count="8" @clear-selection="selected = 0" @select-all="selected = 8" />
      <p v-for="row in 8" :key="row">批次 {{ row }} · 等待归档</p>
    </HysScrollbar>
  </div>
</template>
