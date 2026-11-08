<script setup lang="ts">
import { HysSegmented } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-stack">
      <HysSegmented
        :model-value="'a'"
        :options="['a', 'b']"
        readonly
        aria-label="只读分段"
      /><HysSegmented
        :model-value="'a'"
        :options="['a', 'b']"
        disabled
        aria-label="禁用分段"
      /><HysSegmented :options="[]" aria-label="空分段" /><HysSegmented
        :options="[
          { label: 'A', value: 'a', disabled: true },
          { label: 'B', value: 'b', disabled: true },
        ]"
        aria-label="全部禁用分段"
      /><HysSegmented
        :model-value="'missing'"
        :options="['a', 'b']"
        error="请选择一个可用值"
        block
        aria-label="错误分段"
      />
    </div>
  </div>
</template>
