<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysSelect, HysButton } from "hys-ui";
const value = ref(["c", "a"]),
  order = ref<"original" | "push" | "unshift">("original");
const options = [
  { value: "a", label: "需求分析" },
  { value: "b", label: "界面设计" },
  { value: "c", label: "接口开发" },
  { value: "d", label: "测试验收" },
];
</script>
<template>
  <div class="demo-stack">
    <label class="order-field"
      >目标列表顺序<HysSelect
        v-model="order"
        :options="[
          { label: '按源数据顺序', value: 'original' },
          { label: '新条目放到末尾', value: 'push' },
          { label: '新条目放到开头', value: 'unshift' },
        ]" /></label
    ><HysTransfer
      v-model="value"
      :options="options"
      :target-order="order"
      :filterable="false"
    />
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="value = ['c', 'a']"
        >恢复初始选择</HysButton
      >
    </div>
  </div>
  <output>绑定值：{{ value.join(" → ") }}</output>
  <p class="hint">
    original 按 options 顺序展示，不重排绑定值；push 与 unshift
    按绑定值顺序展示，并分别把新增项放到末尾和开头。
  </p>
</template>
<style scoped>
.order-field {
  display: grid;
  gap: 8px;
  max-width: 280px;
  font-size: 12px;
  color: var(--docs-muted);
}
</style>
