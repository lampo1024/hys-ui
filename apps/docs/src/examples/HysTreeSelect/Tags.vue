<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysNumberInput, HysCheckbox } from "hys-ui";
const value = ref(["a", "b", "c", "locked"]),
  count = ref(2),
  removable = ref(true);
const nodes = [
  { value: "a", label: "平台开发组" },
  { value: "b", label: "质量保障组" },
  { value: "c", label: "体验设计组" },
  { value: "locked", label: "受保护的团队", disabled: true },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <label
        >最多展示标签<HysNumberInput
          v-model="count"
          :min="0"
          :max="8"
          :show-controls="false" /></label
      ><HysCheckbox v-model="removable" label="可移除标签" />
    </div>
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      multiple
      clearable
      :removable="removable"
      :max-tag-count="count"
      :max-tag-text-length="5"
      ><template #max-tag-placeholder="{ count }"
        >另有 {{ count }} 项</template
      ></HysTreeSelect
    ><output>已选：{{ value.join("、") || "无" }}</output>
    <p class="scenario-note">
      超出的标签折叠展示，悬停可查看其名称。移除与清空会保留禁用项。
    </p>
  </div>
</template>
