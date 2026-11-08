<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSelect, HysSlider } from "hys-ui";
const right = ref(100),
  left = ref(0),
  visible = ref(true);
const placement = ref<"top" | "bottom" | "left" | "right">("top");
</script>
<template>
  <div class="demo-content tooltip-boundary-examples">
    <div class="demo-row">
      <HysCheckbox v-model="visible" label="常驻显示提示" /><HysSelect
        v-model="placement"
        aria-label="滑块提示方向"
        :options="[
          { label: '上方', value: 'top' },
          { label: '下方', value: 'bottom' },
          { label: '左侧', value: 'left' },
          { label: '右侧', value: 'right' },
        ]"
      />
    </div>
    <div class="tooltip-clipping-container">
      <HysSlider
        v-model="right"
        label="右端与裁切容器"
        :show-value="false"
        :tooltip-visible="visible"
        :tooltip-placement="placement"
        :format-tooltip="
          (value) => '当前音量 ' + value + '%：靠近边缘时自动调整提示位置'
        "
      />
    </div>
    <HysSlider
      v-model="left"
      label="左端与长提示"
      :show-value="false"
      :tooltip-visible="visible"
      :tooltip-placement="placement"
      :format-tooltip="
        (value) =>
          '当前进度 ' +
          value +
          '%。这是一段较长的说明文字，提示会在窄屏中自动换行，保留完整内容。'
      "
    />
    <p class="scenario-note">
      拖动到两端查看提示。浮层不受外层 overflow
      裁切，在视口边缘自动避让，首选方向空间不足时切换到另一侧。
    </p>
  </div>
</template>
<style scoped>
.tooltip-boundary-examples {
  gap: 30px;
}
.demo-row > .hys-ui-select-wrap {
  width: 150px;
}
.tooltip-clipping-container {
  overflow: hidden;
  border: 1px dashed var(--docs-border);
  border-radius: 8px;
  padding: 20px 14px;
}
</style>
