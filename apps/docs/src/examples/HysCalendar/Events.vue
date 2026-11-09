<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysButton, type CalendarEvent } from "hys-ui";
const value = ref("2026-11-09"),
  message = ref("");
const events = ref<CalendarEvent[]>([
  {
    id: "workshop",
    date: "2026-11-09",
    end: "2026-11-11",
    title: "设计工作坊",
    color: "#8b5cf6",
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: "meeting-" + i,
    date: "2026-11-09",
    title: [
      "需求讨论",
      "接口联调",
      "测试反馈",
      "设计评审",
      "周会准备",
      "文档整理",
    ][i],
    time: `${10 + i}:00`,
    description: "点击日程可接入宿主详情",
    disabled: i === 5,
  })),
]);
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton
        variant="secondary"
        size="sm"
        @click="
          events = [
            ...events,
            {
              id: 'added-' + events.length,
              date: '2026-11-09',
              title: '临时讨论',
            },
          ]
        "
        >添加日程</HysButton
      ><span>跨日事件与更多日程</span>
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysCalendar
        v-model="value"
        :events="events"
        :max-events="2"
        @event="(_, event, day) => (message = day + ' · ' + event.title)"
      />
    </div>
    <output class="state-output">{{
      message || "点击 11 月 9 日的更多日程查看完整列表"
    }}</output>
  </div>
</template>
