<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput } from "hys-ui";
const disabled = ref(["禁用"]),
  readonly = ref(["只读"]),
  error = ref(["需要检查"]),
  long = ref(["这是一段较长的标签内容，用于验证窄容器排版"]);
</script>
<template>
  <div class="demo-stack">
    <HysTagInput
      v-model="disabled"
      disabled
      clearable
      aria-label="禁用标签"
    /><HysTagInput
      v-model="readonly"
      readonly
      aria-label="只读标签"
    /><HysTagInput
      v-model="error"
      error="请检查标签内容"
      aria-label="错误标签"
    />
    <div style="width: 260px; max-width: 100%">
      <HysTagInput
        v-model="long"
        :max-tag-text-length="10"
        clearable
        aria-label="窄容器标签"
      />
    </div>
    <HysTagInput
      :default-value="[]"
      :max="0"
      aria-label="不允许添加的标签"
      placeholder="上限为零时不添加新标签"
    />
  </div>
</template>
