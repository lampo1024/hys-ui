<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysProgress,
  HysCheckbox,
  HysSelect,
  HysNumberInput,
  HysSlider,
  type HysProgressType,
  type HysProgressStatus,
} from "hys-ui";
const value = ref(64),
  config = reactive({
    type: "line" as HysProgressType,
    status: "normal" as HysProgressStatus,
    size: "md" as "sm" | "md" | "lg",
    showLabel: true,
    textInside: false,
    showStatusIcon: false,
    indeterminate: false,
    striped: false,
    stripedFlow: false,
    animated: true,
    strokeWidth: 22,
    width: 132,
    duration: 250,
    flowDuration: 1300,
  });
const toggles = [
  "showLabel",
  "textInside",
  "showStatusIcon",
  "indeterminate",
  "striped",
  "stripedFlow",
  "animated",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与数值</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >类型<HysSelect
              v-model="config.type"
              :options="
                ['line', 'circle', 'dashboard'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >状态<HysSelect
              v-model="config.status"
              :options="
                ['normal', 'active', 'success', 'warning', 'error'].map(
                  (value) => ({ label: value, value }),
                )
              " /></label
          ><label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >轨道粗细<HysNumberInput
              v-model="config.strokeWidth"
              :min="1"
              :max="40" /></label
          ><label class="demo-field"
            >环形宽度<HysNumberInput
              v-model="config.width"
              :min="40"
              :max="240" /></label
          ><label class="demo-field"
            >数值过渡时长<HysNumberInput
              v-model="config.duration"
              :min="0"
              :max="1500"
              :step="50" /></label
          ><label class="demo-field"
            >循环动效时长<HysNumberInput
              v-model="config.flowDuration"
              :min="0"
              :max="5000"
              :step="100"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div v-for="key in toggles" :key="key" class="demo-control-toggle">
            <HysCheckbox v-model="config[key]" :label="key" />
          </div>
        </div>
      </section>
    </div>
    <HysSlider v-model="value" aria-label="配置示例进度" />
    <div class="demo-content progress-examples">
      <HysProgress :value="value" v-bind="config" aria-label="可配置进度" />
    </div>
    <output class="state-output"
      >{{ value }}% · {{ config.type }} · {{ config.status }}</output
    >
  </div>
</template>
