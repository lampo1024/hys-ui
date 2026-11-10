<script setup lang="ts">
import { HysTimeline, type HysTimelineItem } from "hys-ui";
import { CheckCircle2, Flag } from "lucide-vue-next";
const items: HysTimelineItem[] = [
  { id: 0, title: "检查通过", tone: "success", icon: CheckCircle2, size: 22 },
  { id: 1, title: "当前阶段", tone: "primary", hollow: true, size: "lg" },
  {
    id: 2,
    title: "需要注意",
    tone: "warning",
    description: "可使用空心节点强调待确认状态。",
    hollow: true,
  },
  { id: 3, title: "自定义颜色", color: "#8b5cf6", icon: Flag, size: 22 },
  {
    id: 4,
    title: "正在同步",
    loading: true,
    description: "加载节点遵循全局和系统动效设置。",
  },
];
</script>
<template>
  <HysTimeline :items="items" aria-label="自定义节点时间线" />
</template>
