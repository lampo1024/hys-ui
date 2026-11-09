<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar } from "hys-ui";
const date = ref("2026-11-09");
</script>
<template>
  <div>
    <div class="calendar-demo-card">
      <HysCalendar
        v-model="date"
        :fullscreen="false"
        :show-mode-switch="false"
        :fixed-weeks="true"
        controller-type="select"
        :show-today="false"
      />
    </div>
    <output class="state-output">{{ date }}</output>
    <p class="scenario-note">
      卡片模式适合侧栏、概览和仪表盘，保留完整的选择与键盘操作。
    </p>
  </div>
</template>
<style scoped>
.calendar-demo-card {
  width: 360px;
  max-width: 100%;
}
</style>
