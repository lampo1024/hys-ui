<script setup lang="ts">
import { ref } from "vue";
import { HysProgress, HysSlider, HysNumberInput } from "hys-ui";
const value = ref(70),
  success = ref(45);
</script>
<template>
  <div class="demo-stack">
    <HysSlider v-model="value" aria-label="已提交进度" /><label
      class="demo-field"
      >其中已确认的进度<HysNumberInput
        v-model="success"
        :min="0"
        :max="100" /></label
    ><HysProgress
      :value="value"
      :success="{ value: success }"
      aria-label="提交与确认进度"
    />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        :success="{ value: success }"
        type="circle"
        aria-label="环形确认进度"
      /><HysProgress
        :value="value"
        :success="{ value: success, color: { from: '#10b981', to: '#84cc16' } }"
        type="dashboard"
        aria-label="仪表盘确认进度"
      />
    </div>
    <output class="state-output"
      >已提交 {{ value }}% · 已确认 {{ Math.min(value, success) }}%</output
    >
    <p class="scenario-note">
      绿色表示已确认的部分，主色表示已提交的整体；已确认进度不会超过整体进度，也不会被重复相加。
    </p>
  </div>
</template>
