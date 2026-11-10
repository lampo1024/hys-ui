<script setup lang="ts">
import { ref } from "vue";
import { HysTimeline, HysCheckbox, type HysTimelineItem } from "hys-ui";
const show = ref(true);
const items: HysTimelineItem[] = [
  {
    id: 0,
    title: "提交申请",
    label: "申请阶段",
    time: "2026-11-11 09:00",
    dateTime: "2026-11-11T09:00:00+08:00",
    timePlacement: "top",
    status: "done",
  },
  {
    id: 1,
    title: "人工复核",
    label: "复核阶段",
    time: "2026-11-11 10:30",
    dateTime: "2026-11-11T10:30:00+08:00",
    status: "current",
  },
  { id: 2, title: "等待通知", label: "通知阶段", time: "稍后", hideTime: true },
];
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="show" label="显示时间戳" /><HysTimeline
      :items="items"
      :show-time="show"
      aria-label="时间标签时间线"
      ><template #time="{ time }"
        ><span>{{ time }}</span></template
      ></HysTimeline
    >
    <p class="scenario-note">
      label 位于内容对侧，timePlacement 控制时间戳位于标题上方或下方；hideTime
      只隐藏当前条目的时间。dateTime 为辅助技术提供标准日期。
    </p>
  </div>
</template>
