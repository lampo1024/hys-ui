<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysBadge, HysButton } from "hys-ui";
import { ArrowRight, CircleX } from "lucide-vue-next";
interface Category {
  value: string;
  label: string;
  count: number;
  children?: Category[];
}
const options: Category[] = [
    {
      value: "knowledge",
      label: "团队知识",
      count: 24,
      children: [
        { value: "guide", label: "操作指南", count: 8 },
        { value: "api", label: "接口文档", count: 16 },
      ],
    },
    { value: "project", label: "项目资料", count: 12 },
  ],
  value = ref<string[]>([]);
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader v-model="value" :options="options" clearable filterable
        ><template #header><strong>选择知识分类</strong></template
        ><template #option="{ node }"
          ><span class="category-content"
            ><span>{{ node.label }}</span
            ><HysBadge tone="gray">{{ node.count }}</HysBadge></span
          ></template
        ><template #suggestion="{ labels, node }"
          >{{ labels.join(" / ") }} · {{ node.count }} 份资料</template
        ><template #expand-icon><ArrowRight :size="15" /></template
        ><template #clear-icon><CircleX :size="15" /></template
        ><template #footer="{ items, clear, close }"
          ><span class="category-footer">已选 {{ items.length }} 项</span
          ><HysButton size="sm" variant="ghost" @click="clear">清空</HysButton
          ><HysButton size="sm" @click="close">完成</HysButton></template
        ></HysCascader
      >
    </div>
    <output class="state-output">{{ value }}</output>
  </div>
</template>
<style scoped>
.category-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
}
.category-content > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.category-footer {
  margin-inline-end: auto;
  color: var(--docs-muted);
  font-size: 12px;
}
</style>
