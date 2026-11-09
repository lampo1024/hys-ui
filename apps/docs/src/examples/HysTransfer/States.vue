<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysCheckbox } from "hys-ui";
const value = ref<string[]>([]),
  loading = ref(false),
  empty = ref(true),
  disabled = ref(false);
const options = [
  { value: "a", label: "项目资料" },
  { value: "b", label: "设计资源" },
];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox v-model="loading" label="加载中" /><HysCheckbox
        v-model="empty"
        label="空数据"
      /><HysCheckbox v-model="disabled" label="禁用交互" />
    </div>
    <HysTransfer
      v-model="value"
      :options="empty ? [] : options"
      :loading="loading"
      :disabled="disabled"
      :status="value.length ? undefined : 'warning'"
      :list-height="180"
    />
  </div>
  <p class="hint">
    数据加载和禁用状态会暂停选择与拖拽。空数据、无匹配结果以及两侧加载内容均可用插槽定制。
  </p>
</template>
