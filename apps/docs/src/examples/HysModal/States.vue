<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysModal } from "hys-ui";
const open = ref(false),
  loading = ref(false),
  disabled = ref(false),
  penetrable = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="loading" label="内容加载中" /><HysCheckbox
      v-model="disabled"
      label="禁止确认"
    /><HysCheckbox v-model="penetrable" label="允许操作背景" /><HysButton
      @click="open = true"
      >查看边界状态</HysButton
    >
  </div>
  <HysModal
    v-model:open="open"
    title="状态展示"
    footer
    :loading="loading"
    :confirm-disabled="disabled"
    :modal="!penetrable"
    :modal-penetrable="penetrable"
    draggable
    :width="520"
    ><p>
      加载状态保留原内容并暂停确认；无模态且可穿透时，默认解除背景滚动锁定和焦点限制。
    </p>
    <HysCheckbox v-model="loading" label="切换加载状态"
  /></HysModal>
</template>
