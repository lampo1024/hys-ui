<script setup lang="ts">
import { ref } from "vue";
import { FileCheck, ArrowRight } from "lucide-vue-next";
import { HysBadge, HysButton, HysInput, HysModal } from "hys-ui";
const open = ref(false),
  note = ref("");
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">自定义内容与操作</HysButton>
  </div>
  <HysModal v-model:open="open" aria-label="审核文档" footer :width="640">
    <template #header="{ titleId }"
      ><div class="demo-content" style="gap: 10px">
        <FileCheck :size="20" />
        <h3 :id="titleId" style="margin: 0">审核文档</h3>
        <HysBadge tone="orange">待处理</HysBadge>
      </div></template
    >
    <HysInput
      v-model="note"
      type="textarea"
      :rows="4"
      label="审核意见"
      placeholder="补充审核说明"
    />
    <template #footer="{ cancel, confirm, busy }"
      ><span style="margin-right: auto; color: var(--docs-muted)"
        >意见可以稍后补充</span
      ><HysButton variant="secondary" :disabled="busy" @click="cancel"
        >暂不处理</HysButton
      ><HysButton :loading="busy" @click="confirm"
        >通过审核<ArrowRight :size="15" /></HysButton
    ></template>
  </HysModal>
</template>
