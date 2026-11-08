<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysButton } from "hys-ui";
import type { HysSegmentedInstance } from "hys-ui";
const value = ref("概览"),
  control = ref<HysSegmentedInstance>(),
  result = ref("");
</script>
<template>
  <div class="demo-content">
    <HysSegmented
      ref="control"
      v-model="value"
      :options="['概览', '详情', '日志']"
      aria-label="实例分段"
    />
    <div class="demo-row">
      <HysButton variant="secondary" @click="control?.focus('日志')"
        >聚焦日志</HysButton
      ><HysButton
        variant="secondary"
        @click="
          control?.select('详情').then((value) => (result = String(value)))
        "
        >选中详情</HysButton
      ><HysButton variant="secondary" @click="control?.blur()"
        >移开焦点</HysButton
      >
    </div>
    <output>值：{{ value }} · 是否接受：{{ result || "尚未操作" }}</output>
  </div>
</template>
