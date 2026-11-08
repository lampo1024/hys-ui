<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
import { Volume2 } from "lucide-vue-next";
const volume = ref(40),
  progress = ref(60);
</script>
<template>
  <div class="demo-content custom-examples">
    <HysSlider
      v-model="volume"
      label="自定义提示"
      tooltip-visible
      :format-tooltip="(value) => value + '%'"
      :format-value-text="(value) => '音量百分之' + value"
      :marks="{ 0: '静音', 50: '适中', 100: '最大' }"
    >
      <template #tooltip="{ value }"
        ><Volume2 :size="12" /> 音量 {{ value }}%</template
      >
      <template #mark="{ label, active }"
        ><span :class="{ 'mark-active': active }">{{ label }}</span></template
      >
    </HysSlider>
    <HysSlider
      v-model="progress"
      label="自定义滑块"
      size="lg"
      :show-tooltip="false"
    >
      <template #thumb><span class="thumb-dot" /></template>
    </HysSlider>
    <p class="scenario-note">
      默认在悬停、聚焦和拖动时显示提示。可固定显示、关闭提示或自定义内容；屏幕阅读器描述可独立设置。
    </p>
  </div>
</template>
<style scoped>
.custom-examples {
  gap: 28px;
  padding-top: 12px;
}
.mark-active {
  color: var(--docs-primary, #315df5);
  font-weight: 600;
}
.thumb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
</style>
