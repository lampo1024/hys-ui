<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysAlert,
  HysButton,
  HysCheckbox,
  HysSelect,
  HysNumberInput,
  type HysAlertTone,
  type HysAlertEffect,
  type HysAlertTransition,
} from "hys-ui";
const visible = ref(true),
  config = reactive({
    tone: "info" as HysAlertTone,
    effect: "light" as HysAlertEffect,
    size: "md" as "sm" | "md" | "lg",
    transition: "fade" as HysAlertTransition,
    transitionDuration: 180,
    closable: true,
    showIcon: true,
    banner: false,
    center: false,
    bordered: true,
    disabled: false,
  });
const flags = [
  "closable",
  "showIcon",
  "banner",
  "center",
  "bordered",
  "disabled",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与动画</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >提示状态<HysSelect
              v-model="config.tone"
              :options="
                ['info', 'primary', 'success', 'warning', 'danger'].map(
                  (value) => ({ label: value, value }),
                )
              " /></label
          ><label class="demo-field"
            >外观<HysSelect
              v-model="config.effect"
              :options="
                ['light', 'dark', 'outline'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >过渡动画<HysSelect
              v-model="config.transition"
              :options="
                ['fade', 'slide', 'collapse', 'none'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >动画时长<HysNumberInput
              v-model="config.transitionDuration"
              :min="0"
              :max="1000"
              :step="50"
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
    <div class="demo-control-actions">
      <HysButton @click="visible = true">显示提示</HysButton>
    </div>
    <HysAlert
      v-model:visible="visible"
      v-bind="config"
      title="可配置的提示"
      description="调整外观、横幅、布局与关闭动效。"
    /><output class="state-output">当前可见：{{ visible }}</output>
  </div>
</template>
