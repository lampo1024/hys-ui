<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
const value = ref(""),
  selected = ref("");
const options = [
  { id: "DESIGN-01", title: "视觉设计规范", category: "设计" },
  { id: "DEV-02", title: "前端开发指南", category: "研发" },
  { id: "ARCHIVED", title: "旧版文档（已归档）", disabled: true },
];
</script>
<template>
  <div class="demo-content">
    <label class="autocomplete-demo-field" style="max-width: 280px"
      ><span>业务字段映射</span
      ><HysAutocomplete
        v-model="value"
        :options="options"
        value-key="id"
        label-key="title"
        placeholder="输入名称或编号"
        :popup-match-width="false"
        popup-width="360px"
        @select="
          (item) =>
            (selected = typeof item === 'string' ? item : JSON.stringify(item))
        "
        ><template #option="{ option }"
          ><div class="autocomplete-demo-option">
            <strong>{{ option.label }}</strong
            ><small>{{ option.value }}</small>
          </div></template
        ></HysAutocomplete
      ></label
    ><output>{{ selected || "选择后保留完整的业务对象" }}</output>
    <p class="scenario-note">
      支持字符串、对象和分组。valueKey / labelKey 映射业务字段，select
      返回原始对象和值；建议项可单独禁用，浮层也可比输入框宽。
    </p>
  </div>
</template>
