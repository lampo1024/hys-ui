<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import {
  HysCascader,
  HysCheckbox,
  HysInput,
  HysSelect,
  type HysCascaderValue,
} from "hys-ui";
const options = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      { value: "backend", label: "后端研发" },
      { value: "frontend", label: "前端研发" },
      { value: "qa", label: "测试归档", disabled: true },
    ],
  },
  {
    value: "product",
    label: "产品中心",
    children: [
      { value: "design", label: "交互设计" },
      { value: "research", label: "用户研究" },
    ],
  },
  { value: "business", label: "商务协作" },
];
const value = ref<HysCascaderValue>([]),
  config = reactive({
    multiple: false,
    emitPath: true,
    disabled: false,
    readonly: false,
    clearable: true,
    filterable: true,
    showAllLevels: true,
    checkStrictly: false,
    showPrefix: true,
    placeholder: "选择交付分类",
    separator: " / ",
    size: "md" as "sm" | "md" | "lg",
    expandTrigger: "click" as "click" | "hover",
  });
watch(
  () => [config.multiple, config.emitPath],
  () => (value.value = config.emitPath || config.multiple ? [] : null),
);
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>显示与尺寸</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >占位文字<HysInput v-model="config.placeholder" /></label
          ><label class="demo-field"
            >路径分隔符<HysInput v-model="config.separator" /></label
          ><label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="[
                { label: '小', value: 'sm' },
                { label: '中', value: 'md' },
                { label: '大', value: 'lg' },
              ]" /></label
          ><label class="demo-field"
            >展开方式<HysSelect
              v-model="config.expandTrigger"
              :options="[
                { label: '点击', value: 'click' },
                { label: '悬停', value: 'hover' },
              ]"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>选择与行为</h3>
        <div class="demo-control-toggles">
          <div
            v-for="key in [
              'multiple',
              'emitPath',
              'checkStrictly',
              'filterable',
              'clearable',
              'showAllLevels',
              'showPrefix',
              'disabled',
              'readonly',
            ] as const"
            :key="key"
            class="demo-control-toggle"
          >
            <HysCheckbox v-model="config[key]" :label="key" />
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysCascader v-model="value" :options="options" v-bind="config" />
    </div>
    <output class="state-output">{{ value }}</output>
  </div>
</template>
