<script setup lang="ts">
import { reactive } from "vue";
import {
  HysAvatar,
  HysInput,
  HysNumberInput,
  HysSelect,
  HysCheckbox,
} from "hys-ui";
const config = reactive({
  size: 56,
  shape: "circle" as "circle" | "square",
  gap: 4,
  autoFit: true,
  bordered: false,
  color: "#eaf1ff",
  textColor: "#3168f5",
});
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与文字</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>尺寸</span
            ><HysNumberInput
              v-model="config.size"
              :min="16"
              :max="160" /></label
          ><label class="demo-field"
            ><span>形状</span
            ><HysSelect
              v-model="config.shape"
              :options="[
                { label: '圆形', value: 'circle' },
                { label: '方形', value: 'square' },
              ]" /></label
          ><label class="demo-field"
            ><span>两侧间距</span
            ><HysNumberInput v-model="config.gap" :min="0" :max="24" /></label
          ><label class="demo-field"
            ><span>背景颜色</span><HysInput v-model="config.color" /></label
          ><label class="demo-field"
            ><span>文字颜色</span><HysInput v-model="config.textColor"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.autoFit" label="autoFit" /><small
              >自动缩放长文字</small
            >
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.bordered" label="bordered" /><small
              >显示分隔描边</small
            >
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <div class="demo-row">
        <HysAvatar v-bind="config" name="交互文字头像">HYS UI</HysAvatar
        ><HysAvatar v-bind="config" alt="交互图标头像" />
      </div>
    </div>
    <output class="state-output">{{ config }}</output>
  </div>
</template>
