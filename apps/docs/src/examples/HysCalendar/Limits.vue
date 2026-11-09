<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar } from "hys-ui";
const value = ref("2026-11-09");
const disabledDate = (day: string) =>
  [0, 6].includes(new Date(day + "T12:00:00Z").getUTCDay());
</script>
<template>
  <div>
    <HysCalendar
      v-model="value"
      :valid-range="['2026-11-05', '2026-12-20']"
      :disabled-date="disabledDate"
      controller-type="select"
    /><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      validRange 限制可选范围，disabledDate
      进一步禁用周末。方向键跳过不可选日期；月份导航不会进入完全位于有效范围外的面板。
    </p>
  </div>
</template>
