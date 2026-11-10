<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, HysCheckbox } from "hys-ui";
const disabled = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="disabled" label="禁止打开" />
    </div>
    <div class="demo-control-actions">
      <HysPopover :disabled="disabled" trigger="click" title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">受限状态</HysButton></template
        >这里展示辅助说明。</HysPopover
      >
    </div>
    <p class="scenario-note">
      禁用状态会取消延迟任务并收起内容；同时继承所属表单的禁用状态。
    </p>
  </div>
</template>
