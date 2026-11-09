<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysCheckbox } from "hys-ui";
const value = ref(["a", "c"]),
  oneWay = ref(true);
const options = [
  { value: "a", label: "内容维护" },
  { value: "b", label: "评论管理" },
  { value: "c", label: "基础权限（不可移除）", disabled: true },
  { value: "d", label: "数据导出" },
];
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="oneWay" label="单向选择模式" /><HysTransfer
      v-model="value"
      :options="options"
      :one-way="oneWay"
      :titles="['可添加权限', '已授予权限']"
    />
  </div>
  <output>已授予：{{ value.join("、") }}</output>
  <p class="hint">
    单向模式保留向右添加和拖拽；右侧通过条目的移除按钮撤销，禁用权限始终受到保护。
  </p>
</template>
