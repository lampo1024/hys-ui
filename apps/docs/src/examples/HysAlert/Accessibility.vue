<script setup lang="ts">
import { ref } from "vue";
import { HysAlert, HysButton } from "hys-ui";
const visible = ref(true),
  trigger = ref<InstanceType<typeof HysButton>>();
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton ref="trigger" @click="visible = true">恢复提示</HysButton>
    </div>
    <HysAlert
      v-model:visible="visible"
      title="操作结果"
      description="关闭后焦点返回恢复按钮，可继续通过键盘操作。"
      closable
      aria-label="操作结果通知"
      @after-close="trigger?.focus()"
    /><HysAlert
      tone="danger"
      title="重要错误"
      description="danger 默认使用 alert 语义，其他状态使用 status。"
      show-icon
    /><HysAlert
      title="静态说明"
      description="可以关闭自动播报并使用普通区域语义。"
      role="region"
      aria-live="off"
      aria-label="静态操作说明"
    />
  </div>
</template>
