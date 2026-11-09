<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysCheckbox, type HysTreeSelectNode } from "hys-ui";
const disabled = ref(false),
  readonly = ref(false),
  loading = ref(false),
  empty = ref(false),
  value = ref("");
const nodes: HysTreeSelectNode[] = [
  { value: "a", label: "正常节点" },
  { value: "b", label: "禁用节点", disabled: true },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <HysCheckbox v-model="disabled" label="禁用" /><HysCheckbox
        v-model="readonly"
        label="只读"
      /><HysCheckbox v-model="loading" label="加载中" /><HysCheckbox
        v-model="empty"
        label="空数据"
      />
    </div>
    <HysTreeSelect
      v-model="value"
      :nodes="empty ? [] : nodes"
      :disabled="disabled"
      :readonly="readonly"
      :loading="loading"
      clearable
      ><template #empty="{ query }">{{
        query ? "没有符合搜索条件的节点" : "暂时没有可选节点"
      }}</template
      ><template #loading>正在准备节点…</template></HysTreeSelect
    ><output>选中：{{ value || "无" }}</output>
  </div>
</template>
