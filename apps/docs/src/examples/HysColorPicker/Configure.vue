<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysColorPicker,
  HysSelect,
  HysCheckbox,
  type HysColorFormat,
} from "hys-ui";
const color = ref("#3867f5"),
  config = reactive({
    size: "md" as "sm" | "md" | "lg",
    format: "hex" as HysColorFormat,
    showAlpha: false,
    clearable: true,
    immediate: true,
    disabled: false,
    readonly: false,
    showInput: true,
    showPresets: true,
    showFooter: true,
  });
const flags = [
  "showAlpha",
  "clearable",
  "immediate",
  "disabled",
  "readonly",
  "showInput",
  "showPresets",
  "showFooter",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与格式</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >输出格式<HysSelect
              v-model="config.format"
              :options="
                ['hex', 'rgb', 'hsl', 'hsv'].map((value) => ({
                  label: value,
                  value,
                }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div v-for="key in flags" :key="key" class="demo-control-toggle">
            <HysCheckbox v-model="config[key]" :label="key" />
          </div>
        </div>
      </section>
    </div>
    <HysColorPicker v-model="color" v-bind="config" label="可配置颜色" /><output
      class="state-output"
      >{{ color || "空值" }}</output
    >
  </div>
</template>
