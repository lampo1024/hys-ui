<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const rgba = ref("rgba(56, 103, 245, 0.65)"),
  hex = ref("#8955eaaa");
</script>
<template>
  <div class="demo-stack">
    <label class="demo-field"
      >RGBA 输出<HysColorPicker
        v-model="rgba"
        show-alpha
        format="rgb"
        label="透明背景色" /></label
    ><label class="demo-field"
      >八位 HEX 输出<HysColorPicker
        v-model="hex"
        show-alpha
        format="hex"
        label="八位颜色" /></label
    ><output class="state-output">{{ rgba }} · {{ hex }}</output>
    <p class="scenario-note">
      透明度轨道可使用 Home / End 和方向键，支持触摸与鼠标拖动。
    </p>
  </div>
</template>
