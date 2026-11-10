<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysTagInput, HysSelect, HysNumberInput, HysCheckbox } from "hys-ui";
const tags = ref(["Vue", "TypeScript"]),
  config = reactive({
    size: "md" as "sm" | "md" | "lg",
    trigger: "Enter" as "Enter" | "Space" | "Tab",
    max: 10,
    clearable: true,
    addOnBlur: true,
    disabled: false,
    readonly: false,
    collapseTags: false,
    draggable: false,
  });
const flags = [
  "clearable",
  "addOnBlur",
  "disabled",
  "readonly",
  "collapseTags",
  "draggable",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>尺寸与输入</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >添加按键<HysSelect
              v-model="config.trigger"
              :options="
                ['Enter', 'Space', 'Tab'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >标签上限<HysNumberInput
              v-model="config.max"
              :min="0"
              :max="100"
              :show-controls="false"
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
    <HysTagInput
      v-model="tags"
      v-bind="config"
      aria-label="可配置标签"
    /><output class="state-output">{{ tags }}</output>
  </div>
</template>
