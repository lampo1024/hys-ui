<script setup lang="ts">
import { ref } from "vue";
import { HysAvatar, HysButton, HysInput, HysNumberInput } from "hys-ui";
const value = ref("USER"),
  gap = ref(4),
  index = ref(0),
  samples = ["U", "USER", "HYS UI", "较长的用户名"];
function change() {
  index.value = (index.value + 1) % samples.length;
  value.value = samples[index.value];
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>文字设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>头像文字</span
            ><HysInput v-model="value" aria-label="头像缩放文字" /></label
          ><label class="demo-field"
            ><span>两侧间距 gap</span
            ><HysNumberInput
              v-model="gap"
              :min="0"
              :max="20"
              aria-label="头像文字间距"
          /></label>
        </div>
      </section>
    </div>
    <div class="demo-row">
      <HysAvatar name="自动缩放文字" :size="56" :gap="gap">{{
        value
      }}</HysAvatar
      ><HysAvatar name="方形自动缩放" :size="56" :gap="gap" shape="square">{{
        value
      }}</HysAvatar
      ><HysButton size="sm" variant="secondary" @click="change"
        >切换文字</HysButton
      >
    </div>
    <p class="scenario-note">
      文字超出可用宽度时自动缩小；修改文字、gap
      或容器尺寸后会重新测量。autoFit=false 可关闭自动缩放。
    </p>
  </div>
</template>
