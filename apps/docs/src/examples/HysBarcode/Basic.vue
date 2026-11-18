<script setup lang="ts">
import { ref } from "vue";
import { HysBarcode, HysInput, HysSelect, type HysBarcodeFormat } from "hys-ui";
const value = ref("690123456789");
const format = ref<HysBarcodeFormat>("EAN13");
const options = [{ label: "EAN-13", value: "EAN13" }, { label: "EAN-8", value: "EAN8" }, { label: "UPC-A", value: "UPCA" }];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSelect v-model="format" :options="options" aria-label="商品条码格式" @change="value = format === 'EAN8' ? '9638507' : format === 'UPCA' ? '03600029145' : '690123456789'" />
      <HysInput v-model="value" aria-label="商品编码" />
    </div>
    <HysBarcode :value="value" :format="format" />
  </div>
</template>
