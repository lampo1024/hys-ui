<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
const insensitive = ref(""),
  sensitive = ref(""),
  custom = ref("");
const options = ["Vue", "vue-router", "Vite", "TypeScript"];
const startsWith = (query: string, item: unknown) =>
  typeof item === "string" &&
  item.toLowerCase().startsWith(query.toLowerCase());
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>默认忽略大小写</span
        ><HysAutocomplete
          v-model="insensitive"
          :options="options"
          placeholder="输入 VUE" /></label
      ><label class="autocomplete-demo-field"
        ><span>区分大小写</span
        ><HysAutocomplete
          v-model="sensitive"
          :options="options"
          case-sensitive
          placeholder="比较 V 与 v" /></label
      ><label class="autocomplete-demo-field"
        ><span>仅匹配开头</span
        ><HysAutocomplete
          v-model="custom"
          :options="options"
          :filter-option="startsWith"
          placeholder="自定义前缀匹配"
      /></label>
    </div>
    <p class="scenario-note">
      filterOption 接收 query 与原始 item。设置 false
      时直接展示调用方提供的结果；远程模式默认不二次过滤。
    </p>
  </div>
</template>
