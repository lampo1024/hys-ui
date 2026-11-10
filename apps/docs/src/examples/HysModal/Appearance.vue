<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInput, HysModal, HysSlider } from "hys-ui";
const open = ref(false),
  opacity = ref(0.9),
  maskOpacity = ref(0.45);
</script>
<template>
  <div class="demo-controls">
    <section class="demo-control-section">
      <h3>透明度</h3>
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>弹窗背景 {{ Math.round(opacity * 100) }}%</span
          ><HysSlider v-model="opacity" :min="0" :max="1" :step="0.05"
        /></label>
        <label class="demo-field"
          ><span>遮罩 {{ Math.round(maskOpacity * 100) }}%</span
          ><HysSlider v-model="maskOpacity" :min="0" :max="1" :step="0.05"
        /></label>
      </div>
    </section>
  </div>
  <div class="demo-content">
    <HysButton @click="open = true">预览透明弹窗</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="透明度预览"
    footer
    draggable
    show-fullscreen
    :opacity="opacity"
    :mask-opacity="maskOpacity"
  >
    <p>opacity 只改变弹窗背景，不影响文字和按钮；maskOpacity 单独控制遮罩。</p>
    <div style="display: grid; gap: 18px">
      <label
        >弹窗背景 {{ Math.round(opacity * 100) }}%<HysSlider
          v-model="opacity"
          :min="0"
          :max="1"
          :step="0.05" /></label
      ><label
        >遮罩 {{ Math.round(maskOpacity * 100) }}%<HysSlider
          v-model="maskOpacity"
          :min="0"
          :max="1"
          :step="0.05" /></label
      ><HysInput placeholder="文字与控件保持清晰" />
    </div>
  </HysModal>
</template>
