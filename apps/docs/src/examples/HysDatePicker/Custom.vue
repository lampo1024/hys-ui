<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
import { CalendarCheck, CircleX } from "lucide-vue-next";
const value = ref("2026-11-06");
const notes = new Map([
  ["2026-11-11", "里程碑"],
  ["2026-11-18", "评审"],
]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDatePicker v-model="value" clearable
        ><template #header><strong>交付计划</strong></template
        ><template #cell="cell"
          ><span class="date-demo-cell"
            >{{ cell.text
            }}<i
              v-if="notes.has(cell.iso)"
              :title="notes.get(cell.iso)" /></span></template
        ><template #suffix><CalendarCheck :size="16" /></template
        ><template #clear-icon><CircleX :size="14" /></template
      ></HysDatePicker>
    </div>
    <output class="state-output">{{ value }}</output>
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
