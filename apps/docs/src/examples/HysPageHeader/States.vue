<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton, HysCheckbox, HysPageHeader } from "hys-ui";
const showOrder = ref(true);
const compact = ref(true);
const saved = ref(false);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="compact">紧凑版</HysCheckbox>
    <HysPageHeader
      :title="showOrder ? '拣货单' : '待处理订单'"
      :subtitle="showOrder ? '仓库 A · 北京配送中心' : '选择订单以查看拣货明细'"
      :show-back="showOrder"
      :compact="compact"
      @back="showOrder = false"
    >
      <template #extra>
        <HysBadge v-if="showOrder && saved" variant="success">已保存</HysBadge>
        <HysButton
          v-if="showOrder"
          variant="secondary"
          size="sm"
          @click="saved = !saved"
          >切换保存状态</HysButton
        >
        <HysButton v-else size="sm" @click="showOrder = true"
          >查看拣货单</HysButton
        >
      </template>
    </HysPageHeader>
  </div>
</template>
