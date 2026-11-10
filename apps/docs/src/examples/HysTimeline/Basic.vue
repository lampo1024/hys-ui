<script setup lang="ts">
import { HysTimeline, type HysTimelineItem } from "hys-ui";
const items: HysTimelineItem[] = [
  { id: 0, title: "记录已创建", time: "10:00", status: "done" },
  {
    id: 1,
    title: "正在检查",
    time: "10:30",
    status: "current",
    description: "核对内容并确认操作。",
  },
  { id: 2, title: "等待下一步", time: "11:00", status: "pending" },
];
</script>
<template><HysTimeline :items="items" aria-label="操作时间线" /></template>
