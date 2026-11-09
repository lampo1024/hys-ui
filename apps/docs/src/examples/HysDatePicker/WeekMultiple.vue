<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const value = ref(["2026-11-02", "2026-11-16"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysDatePicker
        v-model="value"
        type="weeks"
        :max-dates="3"
        format="GGGG-[W]WW"
        clearable
      />
    </div>
    <output class="state-output"
      >已确认的周：{{ value.join("、") || "未选择" }}</output
    >
    <p class="scenario-note">
      选择多个不连续的周，最多三周。再次点击同一周取消选择；点确定统一提交，取消或关闭面板保留原值。
    </p>
  </div>
</template>
