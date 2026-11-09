<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import {
  HysTreeSelect,
  HysCheckbox,
  HysSelect,
  HysNumberInput,
  type HysTreeSelectValue,
} from "hys-ui";
const value = ref<HysTreeSelectValue>("backend");
const nodes = [
  {
    label: "研发中心",
    value: "rd",
    children: [
      { label: "后端组", value: "backend" },
      { label: "前端组", value: "frontend" },
      { label: "测试组", value: "qa", disabled: true },
    ],
  },
  { label: "产品中心", value: "product" },
];
const config = reactive({
  size: "md" as "sm" | "md" | "lg",
  multiple: false,
  checkable: false,
  checkStrictly: false,
  clearable: true,
  searchable: true,
  leafOnly: false,
  disabled: false,
  readonly: false,
  loading: false,
  virtual: false,
  maxTagCount: 2,
});
watch(
  () => [config.multiple, config.checkable],
  () => (value.value = config.multiple || config.checkable ? [] : ""),
);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>参数设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="[
                { label: '小尺寸', value: 'sm' },
                { label: '中尺寸', value: 'md' },
                { label: '大尺寸', value: 'lg' },
              ]" /></label
          ><label class="demo-field"
            >最多显示标签<HysNumberInput
              v-model="config.maxTagCount"
              :min="0"
              :max="8"
              :show-controls="false"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>选择方式</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.multiple" label="多选" /><small
              >点击节点选择多项</small
            >
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.checkable" label="复选框" /><small
              >启用父子联动</small
            >
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox
              v-model="config.checkStrictly"
              label="独立勾选"
            /><small>关闭父子联动</small>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.leafOnly" label="仅叶子节点" />
          </div>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div
            v-for="key in [
              'clearable',
              'searchable',
              'disabled',
              'readonly',
              'loading',
              'virtual',
            ] as const"
            :key="key"
            class="demo-control-toggle"
          >
            <HysCheckbox
              v-model="config[key]"
              :label="
                {
                  clearable: '允许清空',
                  searchable: '显示搜索',
                  disabled: '禁用',
                  readonly: '只读',
                  loading: '加载中',
                  virtual: '虚拟列表',
                }[key]
              "
            />
          </div>
        </div>
      </section>
    </div>
    <HysTreeSelect v-model="value" v-bind="config" :nodes="nodes" /><output>{{
      JSON.stringify(value)
    }}</output>
    <pre class="state-output">{{ JSON.stringify(config, null, 2) }}</pre>
  </div>
</template>
