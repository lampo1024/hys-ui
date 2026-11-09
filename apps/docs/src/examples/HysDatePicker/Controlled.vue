<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, HysCheckbox, type HysDatePickerValue } from "hys-ui";
const value = ref("2026-11-06"),
  open = ref(false),
  accept = ref(false),
  allowOpen = ref(true),
  requested = ref("");
function request(next: HysDatePickerValue) {
  requested.value = String(next);
  if (accept.value) value.value = String(next);
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-controls">
        <HysCheckbox v-model="accept">接受选择请求</HysCheckbox
        ><HysCheckbox v-model="allowOpen">允许打开</HysCheckbox>
      </div>
      <HysDatePicker
        :model-value="value"
        :open="open"
        @update:model-value="request"
        @update:open="(next) => (open = allowOpen && next)"
      />
    </div>
    <output class="state-output"
      >已接受：{{ value }} · 最近请求：{{ requested || "无" }}</output
    >
  </div>
</template>
<style scoped>
.date-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 22px;
}
.date-demo-grid > label {
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13px;
  color: var(--docs-muted);
}
.date-demo-inline {
  max-width: 350px;
}
.date-demo-cell {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 20px;
}
.date-demo-cell i {
  position: absolute;
  bottom: -5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
.date-demo-summary {
  margin-inline-end: auto;
  color: var(--docs-muted);
  font-size: 12px;
}
</style>
