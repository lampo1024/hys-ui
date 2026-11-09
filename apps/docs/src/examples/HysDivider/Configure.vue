<script setup lang="ts">
import { HysDivider } from "hys-ui";
import { reactive as demoReactive } from "vue";
import {
  HysCheckbox as DemoCheckbox,
  HysSelect as DemoSelect,
  HysInput as DemoInput,
} from "hys-ui";
const demoConfig = demoReactive<{
  label: string;
  direction: "horizontal" | "vertical";
  dashed: boolean;
  orientation: "center" | "left" | "right";
}>({
  label: "自定义label",
  direction: "horizontal",
  dashed: false,
  orientation: "center",
});
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>参数设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >label<DemoInput v-model="demoConfig.label"
          /></label>
          <label class="demo-field"
            >direction<DemoSelect
              :model-value="demoConfig.direction"
              @update:model-value="
                demoConfig.direction = $event as typeof demoConfig.direction
              "
              :options="[
                { label: 'horizontal', value: 'horizontal' },
                { label: 'vertical', value: 'vertical' },
              ]"
          /></label>
          <label class="demo-field"
            >orientation<DemoSelect
              :model-value="demoConfig.orientation"
              @update:model-value="
                demoConfig.orientation = $event as typeof demoConfig.orientation
              "
              :options="[
                { label: 'center', value: 'center' },
                { label: 'left', value: 'left' },
                { label: 'right', value: 'right' },
              ]"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <DemoCheckbox v-model="demoConfig.dashed" label="dashed" /><small
              >虚线边框</small
            >
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysDivider v-bind="demoConfig" />
      <p class="hint">项目基础信息</p>
      <HysDivider label="高级配置" />
    </div>
    <pre class="state-output">{{ JSON.stringify(demoConfig, null, 2) }}</pre>
  </div>
</template>
