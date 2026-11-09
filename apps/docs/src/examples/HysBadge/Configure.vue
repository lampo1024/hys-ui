<script setup lang="ts">
import { ref } from "vue";
import { HysBadge } from "hys-ui";
import { reactive as demoReactive } from "vue";
import {
  HysCheckbox as DemoCheckbox,
  HysSelect as DemoSelect,
  HysNumberInput as DemoNumber,
} from "hys-ui";
const events = ref("");
const demoConfig = demoReactive<{
  tone: "blue" | "green" | "orange" | "red" | "purple" | "gray";
  size: "md" | "sm";
  round: boolean;
  closable: boolean;
  dot: boolean;
  max: number;
  showZero: boolean;
}>({
  tone: "blue",
  size: "md",
  round: false,
  closable: false,
  dot: false,
  max: 99,
  showZero: false,
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
              ><span>颜色</span><code>tone</code></span
            ><DemoSelect
              :model-value="demoConfig.tone"
              @update:model-value="
                demoConfig.tone = $event as typeof demoConfig.tone
              "
              :options="[
                { label: 'blue', value: 'blue' },
                { label: 'green', value: 'green' },
                { label: 'orange', value: 'orange' },
                { label: 'red', value: 'red' },
                { label: 'purple', value: 'purple' },
                { label: 'gray', value: 'gray' },
              ]"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label"
              ><span>尺寸</span><code>size</code></span
            ><DemoSelect
              :model-value="demoConfig.size"
              @update:model-value="
                demoConfig.size = $event as typeof demoConfig.size
              "
              :options="[
                { label: 'md', value: 'md' },
                { label: 'sm', value: 'sm' },
              ]"
          /></label>
          <label class="demo-field"
            ><span class="demo-control-label"
              ><span>最大值</span><code>max</code></span
            ><DemoNumber v-model="demoConfig.max" :show-controls="false"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <DemoCheckbox v-model="demoConfig.round" label="round" /><small
              >圆角外观</small
            >
          </div>
          <div class="demo-control-toggle">
            <DemoCheckbox
              v-model="demoConfig.closable"
              label="closable"
            /><small>允许关闭</small>
          </div>
          <div class="demo-control-toggle">
            <DemoCheckbox v-model="demoConfig.dot" label="dot" /><small
              >圆点样式</small
            >
          </div>
          <div class="demo-control-toggle">
            <DemoCheckbox
              v-model="demoConfig.showZero"
              label="showZero"
            /><small>显示零值</small>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <div class="demo-row">
        <HysBadge v-bind="demoConfig">进行中</HysBadge
        ><HysBadge tone="green">已完成</HysBadge
        ><HysBadge tone="orange">待处理</HysBadge
        ><HysBadge tone="red">风险</HysBadge
        ><HysBadge tone="purple">评审中</HysBadge
        ><HysBadge tone="gray">已关闭</HysBadge>
      </div>
      <output v-if="events" aria-live="polite">{{ events }}</output>
    </div>
    <pre class="state-output">{{ JSON.stringify(demoConfig, null, 2) }}</pre>
  </div>
</template>
