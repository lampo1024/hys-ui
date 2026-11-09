<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, type HysTreeSelectLabelValue } from "hys-ui";
const value = ref<HysTreeSelectLabelValue | null>({
  value: "remote",
  label: "尚未加载的远程团队",
});
const nodes = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      { value: "platform", label: "平台研发组" },
      { value: "qa", label: "质量保障组" },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      label-in-value
      clearable
      :clear-value="null"
    /><output>{{ JSON.stringify(value, null, 2) }}</output>
    <p class="scenario-note">
      labelInValue
      将编号与标签一起回填；尚未出现在节点数据中的值也可展示给定标签。普通编号模式可用
      cacheData 提供未加载节点的名称。
    </p>
  </div>
</template>
