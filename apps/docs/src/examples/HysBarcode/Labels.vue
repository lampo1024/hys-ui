<script setup lang="ts">
import { ref } from "vue";
import { HysBarcode, HysCheckbox, HysInput } from "hys-ui";
const sku = ref("WH-A17");
const canvas = ref(false);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row"><HysInput v-model="sku" aria-label="仓库物料号" /><HysCheckbox v-model="canvas">Canvas</HysCheckbox></div>
    <HysBarcode :value="sku" :type="canvas ? 'canvas' : 'svg'" :height="52" />
    <HysBarcode :value="sku" format="CODE39" :module-width="1" :height="44" />
  </div>
</template>
