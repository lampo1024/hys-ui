<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, type HysAutocompleteDataOption } from "hys-ui";
const value = ref("");
const options: HysAutocompleteDataOption[] = [
  {
    label: "设计资源",
    options: [
      { label: "设计规范", value: "设计规范" },
      { label: "图标素材", value: "图标素材" },
    ],
  },
  {
    label: "开发文档",
    options: [
      { label: "Vue 组件指南", value: "Vue 组件指南" },
      { label: "接口规范", value: "接口规范" },
    ],
  },
  {
    label: "历史内容",
    disabled: true,
    options: [{ label: "旧版接口", value: "旧版接口" }],
  },
];
</script>
<template>
  <div class="demo-content">
    <label class="autocomplete-demo-field"
      ><span>确定类目查询</span
      ><HysAutocomplete
        v-model="value"
        :options="options"
        placeholder="按资源名称搜索"
        clearable
        ><template #group="{ label }"
          ><span>{{ label }}</span></template
        ></HysAutocomplete
      ></label
    ><output>{{ value || "未选择资源" }}</output>
    <p class="scenario-note">
      分组使用 label 与 options（也支持
      children）。过滤后没有子项的分组自动隐藏；禁用组内的全部建议都不可选中。
    </p>
  </div>
</template>
