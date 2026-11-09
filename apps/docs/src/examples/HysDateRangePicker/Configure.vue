<script setup lang="ts">
import { ref, reactive } from "vue";
import { HysDateRangePicker, HysCheckbox } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-20"]),
  config = reactive({
    singlePanel: true,
    unlinkPanels: false,
    showConfirm: false,
    editable: false,
    clearable: true,
    disabled: false,
  });
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-controls">
        <section class="demo-control-section">
          <h3>布局与行为</h3>
          <div class="demo-control-toggles">
            <div
              v-for="key in [
                'singlePanel',
                'unlinkPanels',
                'showConfirm',
                'editable',
                'clearable',
                'disabled',
              ] as const"
              :key="key"
              class="demo-control-toggle"
            >
              <HysCheckbox v-model="config[key]">{{ key }}</HysCheckbox>
            </div>
          </div>
        </section>
      </div>
      <HysDateRangePicker v-model="value" v-bind="config" />
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
