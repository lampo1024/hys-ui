<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor } from "hys-ui";

const expression = ref("0 30 9 * * ?");
const previewFrom = new Date("2026-11-01T00:00:00+08:00");
</script>

<template>
  <div class="demo-stack">
    <HysCronEditor v-model="expression" format="quartz" time-zone="Asia/Shanghai"
      :show-format-selector="false" :preview-count="4" :preview-from="previewFrom" />
    <p class="scenario-note">打开「可视化配置」，在「分」里选步长，再到「日」选每月最后一天。在浮层底部核对表达式，保存后查看下次运行时间。再次打开并修改，点「取消」可以放弃草稿。</p>
  </div>
</template>
