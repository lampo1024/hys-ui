<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysActionBar,
  HysBadge,
  HysButton,
  type HysActionBarItem,
} from "hys-ui";
const count = ref(2);
const loading = ref(false);
const done = ref(false);
const actions = computed<HysActionBarItem[]>(() => [
  {
    key: "check",
    label: "下载核对单",
    loading: loading.value,
    variant: "primary",
  },
]);
async function process() {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const file = new Blob(["编号,核对状态\nINV-026,待核对\nINV-027,待核对\n"], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "发票核对单.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    done.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="demo-stack">
    <HysActionBar
      :selected-count="count"
      :actions="actions"
      :loading="loading"
      visible-when-empty
      @action="process"
      @clear-selection="count = 0"
    >
      <template #left><HysBadge>财务核对</HysBadge></template>
      <template #right
        ><HysButton
          size="sm"
          variant="ghost"
          :disabled="loading"
          @click="
            count = 2;
            done = false;
          "
          >重新选中</HysButton
        ></template
      >
    </HysActionBar>
    <span role="status">{{
      loading
        ? "正在生成核对单"
        : done
          ? "核对单已生成"
          : "核对单包含两份待处理发票"
    }}</span>
  </div>
</template>
