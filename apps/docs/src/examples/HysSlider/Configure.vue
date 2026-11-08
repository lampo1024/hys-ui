<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
import { reactive as demoReactive } from "vue";
import {
  HysCheckbox as DemoCheckbox,
  HysInput as DemoInput,
  HysNumberInput as DemoNumber,
} from "hys-ui";
const slider = ref(60);
const demoConfig = demoReactive<{
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  label: string;
  showValue: boolean;
}>({
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  label: "自定义label",
  showValue: true,
});
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>参数设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span class="demo-control-label"
              ><span>最小值</span><code>min</code></span
            ><DemoNumber v-model="demoConfig.min" :show-controls="false"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label"
              ><span>最大值</span><code>max</code></span
            ><DemoNumber v-model="demoConfig.max" :show-controls="false"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label"
              ><span>步长</span><code>step</code></span
            ><DemoNumber v-model="demoConfig.step" :show-controls="false"
          /></label>
          <label class="demo-field"
            >label<DemoInput v-model="demoConfig.label"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <DemoCheckbox
              v-model="demoConfig.disabled"
              label="disabled"
            /><small>禁用交互</small>
          </div>
          <div class="demo-control-toggle">
            <DemoCheckbox
              v-model="demoConfig.showValue"
              label="showValue"
            /><small>显示当前值</small>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysSlider v-bind="demoConfig" v-model="slider" />
    </div>
    <pre class="state-output">{{ JSON.stringify(demoConfig, null, 2) }}</pre>
  </div>
</template>
