<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysDatePicker,
  HysInput,
  HysModal,
  HysSelect,
} from "hys-ui";
const open = ref(false),
  nested = ref(false),
  date = ref("2026-11-10"),
  category = ref("draft");
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">嵌套弹窗与浮层控件</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="编辑发布计划"
    footer
    :destroy-on-close="false"
    :z-index="1800"
  >
    <div style="display: grid; gap: 18px">
      <HysSelect
        v-model="category"
        :options="[
          { label: '草稿', value: 'draft' },
          { label: '已就绪', value: 'ready' },
        ]"
      /><HysDatePicker v-model="date" /><HysButton
        variant="secondary"
        @click="nested = true"
        >打开成员弹窗</HysButton
      >
    </div>
    <HysModal v-model:open="nested" title="补充成员" footer :width="440"
      ><HysInput placeholder="输入成员名称" />
      <p>Esc 优先关闭最上层；内部的下拉与日期面板保持正确层级。</p></HysModal
    >
  </HysModal>
</template>
