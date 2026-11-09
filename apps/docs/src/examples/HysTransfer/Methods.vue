<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysButton } from "hys-ui";
import type { HysTransferInstance, HysTransferOption } from "hys-ui";
const value = ref<number[]>([]),
  api = ref<HysTransferInstance<HysTransferOption<number>, number>>(),
  event = ref("");
const options = Array.from({ length: 25 }, (_, i) => ({
  value: i,
  label: "工作项 " + i,
  disabled: i === 0,
}));
async function move() {
  const accepted = await api.value?.move("right", [2, 4, 6]);
  event.value = accepted
    ? "已移入指定工作项"
    : "没有可移动的条目或调用方拒绝了更新";
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="move"
        >移入 2、4、6</HysButton
      ><HysButton
        variant="secondary"
        size="sm"
        @click="api?.setCheckedKeys([1, 3, 5])"
        >勾选 1、3、5</HysButton
      ><HysButton variant="secondary" size="sm" @click="api?.clearChecked()"
        >清除勾选</HysButton
      ><HysButton variant="secondary" size="sm" @click="api?.focus('right')"
        >聚焦右侧搜索</HysButton
      >
    </div>
    <HysTransfer
      ref="api"
      v-model="value"
      :options="options"
      :pagination="{ pageSize: 6 }"
      :list-height="215"
    />
  </div>
  <output
    >{{ event || "实例方法会遵守禁用、加载与受控状态" }}<br />已移入：{{
      value.join("、") || "无"
    }}</output
  >
</template>
