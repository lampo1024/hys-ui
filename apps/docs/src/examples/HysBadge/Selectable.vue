<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysCheckbox } from "hys-ui";
const checked = ref(true),
  disabled = ref(false);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="disabled" label="禁用交互" />
    <div class="demo-row">
      <HysBadge v-model:checked="checked" checkable :disabled="disabled"
        >只看关注</HysBadge
      ><HysBadge checkable default-checked :disabled="disabled" tone="green"
        >独立状态</HysBadge
      ><HysBadge checkable disabled>无权限</HysBadge>
    </div>
  </div>
  <output>只看关注：{{ checked ? "开启" : "关闭" }}</output>
  <p class="hint">
    可选标签通过按钮提供 aria-pressed 语义，支持 Enter 和空格。checked
    也可由调用方完全控制。
  </p>
</template>
