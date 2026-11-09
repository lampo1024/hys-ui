<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysCalendar, HysCheckbox, HysSelect } from "hys-ui";
const value = ref("2026-11-09");
const config = reactive({
  fullscreen: true,
  controllerType: "select" as "button" | "select",
  fixedWeeks: true,
  showWeekNumbers: false,
  showAdjacentDays: true,
  showModeSwitch: true,
  readonly: false,
});
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与导航</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >年月控制器<HysSelect
              v-model="config.controllerType"
              :options="[
                { label: '下拉定位', value: 'select' },
                { label: '按钮切换', value: 'button' },
              ]"
          /></label>
        </div>
        <div class="demo-control-toggles">
          <div
            v-for="key in [
              'fullscreen',
              'fixedWeeks',
              'showWeekNumbers',
              'showAdjacentDays',
              'showModeSwitch',
              'readonly',
            ] as const"
            :key="key"
            class="demo-control-toggle"
          >
            <HysCheckbox v-model="config[key]">{{ key }}</HysCheckbox>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysCalendar v-model="value" v-bind="config" />
    </div>
    <output class="state-output">选中日期：{{ value }}</output>
  </div>
</template>
