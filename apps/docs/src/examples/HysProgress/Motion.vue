<script setup lang="ts">
import { ref } from "vue";
import {
  HysProgress,
  HysSlider,
  HysCheckbox,
  HysSelect,
  provideHysConfig,
  type HysMotion,
} from "hys-ui";
const value = ref(65),
  animated = ref(true),
  motion = ref<HysMotion>("subtle");
provideHysConfig({ motion });
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="animated" label="启用动画" /><label
        class="demo-field"
        >全局动效<HysSelect
          v-model="motion"
          :options="
            ['full', 'subtle', 'off'].map((value) => ({ label: value, value }))
          "
      /></label>
    </div>
    <HysSlider v-model="value" aria-label="动画示例进度" /><HysProgress
      :value="value"
      status="active"
      :animated="animated"
      aria-label="进行中高光"
    /><HysProgress
      :value="value"
      striped
      striped-flow
      :animated="animated"
      :stroke-width="14"
      aria-label="流动条纹"
    /><HysProgress
      :value="value"
      :animated="animated"
      :duration="800"
      aria-label="柔和数值过渡"
    />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        status="active"
        type="circle"
        :animated="animated"
        aria-label="环形进行中"
      />
    </div>
    <p class="scenario-note">
      duration 控制数值过渡，flowDuration 控制循环时长。所有效果使用
      CSS；animated=false、全局 off 与系统减少动态效果会停止动画。
    </p>
  </div>
</template>
