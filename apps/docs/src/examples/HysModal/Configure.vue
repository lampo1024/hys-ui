<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysModal,
  HysNumberInput,
  HysSelect,
  type HysModalSizeName,
} from "hys-ui";
const open = ref(false),
  customWidth = ref(false);
const config = reactive({
  width: 560,
  size: "md" as HysModalSizeName,
  closeOnMask: true,
  closeOnEscape: true,
  showClose: true,
  showFullscreen: true,
  draggable: true,
  resizable: false,
});
</script>
<template>
  <div class="demo-controls">
    <section class="demo-control-section">
      <h3>布局与尺寸</h3>
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>弹窗宽度</span
          ><HysNumberInput
            v-model="config.width"
            :min="320"
            :max="1000"
            :step="40"
        /></label>
        <label class="demo-field"
          ><span>内容尺寸</span
          ><HysSelect
            v-model="config.size"
            :options="[
              { label: '超小 · 360px', value: 'xs' },
              { label: '小尺寸 · 440px', value: 'sm' },
              { label: '标准', value: 'md' },
              { label: '大尺寸 · 720px', value: 'lg' },
              { label: '超大 · 960px', value: 'xl' },
              { label: '宽屏 · 1200px', value: '2xl' },
              { label: '铺满宽度', value: 'full' },
            ]"
        /></label>
      </div>
    </section>
    <section class="demo-control-section">
      <h3>交互行为</h3>
      <div class="demo-control-toggles">
        <HysCheckbox
          v-model="config.closeOnMask"
          label="点击遮罩关闭"
        /><HysCheckbox v-model="config.closeOnEscape" label="按 Esc 关闭" />
        <HysCheckbox
          v-model="config.showClose"
          label="显示关闭入口"
        /><HysCheckbox v-model="config.showFullscreen" label="允许全屏" />
        <HysCheckbox v-model="config.draggable" label="手柄拖拽" /><HysCheckbox
          v-model="config.resizable"
          label="调整尺寸"
        />
      </div>
    </section>
  </div>
  <div class="demo-content">
    <HysButton @click="open = true">预览配置弹窗</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    v-bind="config"
    :width="customWidth ? config.width : undefined"
    title="交互配置预览"
    footer
    ><p>
      可拖动标题左侧手柄移动位置，使用右上角图标切换全屏，或从右下角调整尺寸。
    </p></HysModal
  >
</template>
