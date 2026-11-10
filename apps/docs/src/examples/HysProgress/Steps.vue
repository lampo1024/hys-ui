<script setup lang="ts">
import { ref } from "vue";
import { HysProgress, HysSlider, HysNumberInput, HysCheckbox } from "hys-ui";
const value = ref(45),
  steps = ref(10),
  gap = ref(3),
  palette = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >分段数量<HysNumberInput
              v-model="steps"
              :min="1"
              :max="30" /></label
          ><label class="demo-field"
            >分段间隙<HysNumberInput v-model="gap" :min="0" :max="12"
          /></label>
        </div>
        <div class="demo-control-actions">
          <HysCheckbox v-model="palette" label="使用多色分段" />
        </div>
      </section>
    </div>
    <HysSlider v-model="value" aria-label="分段示例进度" /><HysProgress
      :value="value"
      :steps="steps"
      :step-gap="gap"
      :stroke-width="12"
      :color="palette ? ['#06b6d4', '#3867f5', '#8b5cf6'] : undefined"
      aria-label="分段线形"
    />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        :steps="steps"
        :step-gap="gap"
        type="circle"
        :width="132"
        aria-label="分段环形"
      /><HysProgress
        :value="value"
        :steps="steps"
        :step-gap="gap"
        type="dashboard"
        :width="132"
        :success="{ value: 20 }"
        aria-label="分段仪表盘"
      />
    </div>
    <p class="scenario-note">
      支持部分段落的精确进度；字符串颜色数组会按分段循环使用。分段数量最多
      200，避免意外创建过多图形节点。
    </p>
  </div>
</template>
