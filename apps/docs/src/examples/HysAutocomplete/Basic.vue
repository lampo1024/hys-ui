<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
const value = ref(""),
  typed = ref(""),
  selected = ref("");
const options = ["Vue", "TypeScript", "JavaScript", "Vite", "Vitest"];
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>聚焦展示建议</span
        ><HysAutocomplete
          v-model="value"
          :options="options"
          placeholder="输入语言或工具，也可自由输入"
          clearable
          @select="(_, text) => (selected = text)" /></label
      ><label class="autocomplete-demo-field"
        ><span>输入后再查询</span
        ><HysAutocomplete
          v-model="typed"
          :options="options"
          :trigger-on-focus="false"
          placeholder="试试输入 v"
          clearable
      /></label>
    </div>
    <output
      >输入：{{ value || "未输入" }} · 已选择：{{
        selected || "未选择"
      }}</output
    >
    <p class="scenario-note">
      建议不限制输入内容。默认按标签和值匹配，忽略大小写；不选择建议时，保留输入的文字。
    </p>
  </div>
</template>
