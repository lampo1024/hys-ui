<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
import { Search } from "lucide-vue-next";
const value = ref("");
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        class="input-demo-field"
        ><span
          >{{
            size === "sm" ? "小尺寸" : size === "md" ? "默认尺寸" : "大尺寸"
          }}
          · {{ size }}</span
        ><HysInput
          v-model="value"
          :size="size"
          :prefix-icon="Search"
          clearable
          :placeholder="size + ' 输入框'"
      /></label>
    </div>
    <p class="scenario-note">
      外部 HysForm / HysFormItem 可统一设置尺寸；组件显式指定 size
      时优先使用自身尺寸。
    </p>
  </div>
</template>
