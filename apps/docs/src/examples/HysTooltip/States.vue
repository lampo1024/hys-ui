<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton, HysCheckbox } from "hys-ui";
const disabled = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="disabled" label="禁止打开" />
    </div>
    <div class="demo-control-actions">
      <HysTooltip :disabled="disabled" trigger="click"
        ><HysButton variant="secondary">受限状态</HysButton
        ><template #content>这里展示辅助说明。</template></HysTooltip
      ><HysTooltip text="这个操作需要先选择资源。"
        ><span tabindex="0"
          ><HysButton disabled>禁用操作的说明</HysButton></span
        ></HysTooltip
      >
    </div>
    <p class="scenario-note">
      禁用状态会取消延迟任务并收起内容；同时继承所属表单的禁用状态。
    </p>
  </div>
</template>
