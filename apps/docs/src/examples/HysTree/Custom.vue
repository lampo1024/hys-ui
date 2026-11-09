<script setup lang="ts">
import { ref } from "vue";
import { Folder, FileText, ChevronRight, ChevronDown } from "lucide-vue-next";
import { HysTree, HysBadge, HysButton } from "hys-ui";
const selected = ref("spec"),
  message = ref("");
const nodes = [
  {
    id: "docs",
    label: "项目资料",
    count: 2,
    children: [
      { id: "spec", label: "需求说明", count: 0 },
      { id: "design", label: "技术方案", count: 0 },
    ],
  },
  { id: "archive", label: "归档资料", count: 0 },
];
</script>
<template>
  <div class="demo-stack">
    <HysTree
      v-model="selected"
      :nodes="nodes"
      default-expand-all
      show-line
      :indent="24"
      ><template #icon="{ leaf }"
        ><component :is="leaf ? FileText : Folder" :size="16" /></template
      ><template #switcher="{ expanded, leaf }"
        ><component
          v-if="!leaf"
          :is="expanded ? ChevronDown : ChevronRight"
          :size="14" /></template
      ><template #node="{ node, label }"
        ><span class="custom-label"
          >{{ label
          }}<HysBadge v-if="node.count" tone="gray"
            >{{ node.count }} 项</HysBadge
          ></span
        ></template
      ><template #actions="{ label }"
        ><HysButton
          variant="ghost"
          size="sm"
          @click="message = '查看：' + label"
          >查看</HysButton
        ></template
      ></HysTree
    ><output>{{
      message || "图标、节点内容、展开图标和行尾操作可以分别定制。"
    }}</output>
  </div>
</template>
<style scoped>
.custom-label {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
