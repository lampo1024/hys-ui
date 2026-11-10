<script setup lang="ts">
import { ref } from "vue";
import {
  HysProgress,
  HysSlider,
  HysSelect,
  HysNumberInput,
  type HysProgressGapPosition,
  type HysProgressLinecap,
} from "hys-ui";
const value = ref(65),
  gap = ref(75),
  position = ref<HysProgressGapPosition>("bottom"),
  cap = ref<HysProgressLinecap>("round");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >缺口角度<HysNumberInput
              v-model="gap"
              :min="0"
              :max="295"
              :step="15" /></label
          ><label class="demo-field"
            >缺口位置<HysSelect
              v-model="position"
              :options="
                ['top', 'right', 'bottom', 'left'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >端点样式<HysSelect
              v-model="cap"
              :options="
                ['round', 'butt', 'square'].map((value) => ({
                  label: value,
                  value,
                }))
              "
          /></label>
        </div>
      </section>
    </div>
    <HysSlider v-model="value" aria-label="形状示例进度" />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        type="circle"
        :stroke-linecap="cap"
        aria-label="完整环形"
      /><HysProgress
        :value="value"
        type="dashboard"
        :gap-degree="gap"
        :gap-position="position"
        :stroke-linecap="cap"
        aria-label="仪表盘"
      />
    </div>
    <p class="scenario-note">
      circle 默认完整一圈；dashboard 默认在底部保留 75° 缺口。gapDegree 为 0
      时显示完整环形。
    </p>
  </div>
</template>
