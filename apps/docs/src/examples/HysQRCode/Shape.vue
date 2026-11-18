<script setup lang="ts">
import { ref } from "vue";
import { HysQRCode, HysSegmented } from "hys-ui";
const shape = ref<"square" | "rounded" | "dot">("square");
const options = [{value:"square",label:"方形"}, {value:"rounded",label:"圆角"}, {value:"dot",label:"圆点"}] as const;
</script>

<template>
  <div class="demo-stack">
    <HysSegmented v-model="shape" :options="options" aria-label="二维码模块外观" />
    <HysQRCode value="https://example.com/events/check-in" :module-shape="shape" error-level="H" copyable :size="200" />
  </div>
</template>
