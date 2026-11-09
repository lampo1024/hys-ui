<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const text = ref("2026/11/06"),
  date = ref<Date | null>(new Date(2026, 10, 6)),
  timestamp = ref<number | null>(0);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label
          >字符串格式<HysDatePicker
            v-model="text"
            value-format="YYYY/MM/DD"
            format="DD.MM.YYYY"
            clearable /></label
        ><label
          >Date 对象<HysDatePicker
            v-model="date"
            value-type="date"
            clearable /></label
        ><label
          >时间戳（毫秒）<HysDatePicker
            v-model="timestamp"
            value-type="timestamp"
            clearable
        /></label>
      </div>
    </div>
    <output class="state-output"
      >{{ text }} · {{ date?.toLocaleDateString() }} · {{ timestamp }}</output
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
