<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysCheckbox, HysSelect } from "hys-ui";
const open = ref(false),
  loading = ref(false),
  disabled = ref(false),
  value = ref("a");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="loading" label="加载内容" /><HysCheckbox
        v-model="disabled"
        label="禁用确认"
      /><HysButton @click="open = true">加载与受限状态</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      title="资源详情状态"
      :loading="loading"
      :confirm-disabled="disabled"
      footer
      ><div class="demo-stack">
        <HysSelect
          v-model="value"
          :options="[
            { label: '方案 A', value: 'a' },
            { label: '方案 B', value: 'b' },
          ]"
        /><HysButton size="sm" variant="secondary" @click="loading = true"
          >切换为加载中</HysButton
        >
      </div></HysDrawer
    >
    <p class="scenario-note">
      加载时显示状态区域、隐藏正文并关闭其中的浮层，确认动作被阻止；取消和关闭入口仍可使用。每个场景的“重置”操作会恢复初始状态。
    </p>
  </div>
</template>
