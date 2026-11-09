<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysButton } from "hys-ui";
import type { HysTransferInstance } from "hys-ui";
const value = ref(["b"]),
  checked = ref(["a"]),
  api = ref<HysTransferInstance>(),
  event = ref("");
const options = [
  { value: "a", label: "设计规范" },
  { value: "b", label: "交互说明" },
  { value: "c", label: "安全规范（锁定）", disabled: true },
  { value: "d", label: "开发指南" },
  { value: "e", label: "发布检查表" },
];
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      ref="api"
      v-model="value"
      v-model:checked-keys="checked"
      :options="options"
      show-invert
      :filterable="false"
      @check-change="(side, keys) => (event = side + '：' + keys.join(', '))"
    />
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="api?.checkAll('left')"
        >勾选待选项</HysButton
      ><HysButton variant="secondary" size="sm" @click="api?.clearChecked()"
        >清除勾选</HysButton
      >
    </div>
  </div>
  <output
    >已勾选：{{ checked.join("、") || "无" }} · 已移入：{{
      value.join("、") || "无"
    }}<br />{{ event }}</output
  >
  <p class="hint">
    表头复选框会呈现半选状态，操作范围为当前筛选结果中的当前页。禁用项不会参与全选、反选、移动或拖拽。
  </p>
</template>
