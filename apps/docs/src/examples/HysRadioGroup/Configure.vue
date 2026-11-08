<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup, HysCheckbox, HysSelect } from "hys-ui";
const value = ref("a"),
  config = reactive({
    size: "md" as "sm" | "md" | "lg",
    disabled: false,
    readonly: false,
    vertical: false,
  }),
  options = [
    { label: "选项 A", value: "a" },
    { label: "选项 B", value: "b" },
    { label: "选项 C", value: "c", disabled: true },
  ];
const flags = [
  { key: "disabled", label: "禁用交互" },
  { key: "readonly", label: "只读模式" },
  { key: "vertical", label: "纵向排列" },
] as const;
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>控件尺寸</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div
            v-for="item in flags"
            :key="item.key"
            class="demo-control-toggle"
          >
            <HysCheckbox
              v-model="config[item.key]"
              :label="item.label"
            /><small>{{ item.key }}</small>
          </div>
        </div>
      </section>
    </div>
    <HysRadioGroup
      v-model="value"
      v-bind="config"
      :options="options"
    /><output>{{ JSON.stringify(value) }}</output>
  </div>
</template>
