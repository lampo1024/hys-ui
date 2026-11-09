<script setup lang="ts">
import { ref } from "vue";
import { Folder, Users } from "lucide-vue-next";
import { HysTreeSelect, HysButton, HysBadge } from "hys-ui";
const value = ref<string[]>(["backend"]);
const nodes = [
  {
    value: "rd",
    label: "研发中心",
    count: 2,
    children: [
      { value: "backend", label: "后端研发", count: 8 },
      { value: "frontend", label: "前端研发", count: 6 },
    ],
  },
  { value: "product", label: "产品中心", count: 5 },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect v-model="value" :nodes="nodes" multiple clearable
      ><template #header><strong>选择协作团队</strong></template
      ><template #icon="{ leaf }"
        ><component :is="leaf ? Users : Folder" :size="15" /></template
      ><template #option="{ node, label }"
        ><span class="custom-option"
          >{{ label }}<HysBadge tone="gray">{{ node.count }} 人</HysBadge></span
        ></template
      ><template #footer="{ items, clear, close }"
        ><div class="custom-footer">
          <span>已选 {{ items.length }} 项</span
          ><HysButton size="sm" variant="ghost" @click="clear">清空</HysButton
          ><HysButton size="sm" variant="secondary" @click="close"
            >完成</HysButton
          >
        </div></template
      ></HysTreeSelect
    ><output>{{ value.join("、") }}</output>
  </div>
</template>
<style scoped>
.custom-option {
  display: flex;
  align-items: center;
  gap: 10px;
}
.custom-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--docs-muted);
}
.custom-footer > span {
  flex: 1;
}
</style>
