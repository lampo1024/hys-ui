<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysButton, type HysTagInputInstance } from "hys-ui";
const api = ref<HysTagInputInstance>(),
  result = ref("等待操作");
async function add() {
  result.value = String(await api.value?.add(["API 标签", "批量标签"]));
}
</script>
<template>
  <div class="demo-stack">
    <HysTagInput
      ref="api"
      :default-value="['初始标签']"
      clearable
      aria-label="标签实例"
    />
    <div class="demo-control-actions">
      <HysButton @click="api?.focus()">聚焦标签输入</HysButton
      ><HysButton @click="add">批量添加标签</HysButton
      ><HysButton @click="api?.clear()">清空所有标签</HysButton>
    </div>
    <output class="state-output">方法结果：{{ result }}</output>
  </div>
</template>
