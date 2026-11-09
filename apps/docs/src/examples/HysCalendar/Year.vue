<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, type HysCalendarMode } from "hys-ui";
const value = ref("2026-11-09"),
  mode = ref<HysCalendarMode>("year"),
  source = ref("");
const events = [
  { id: "a", date: "2026-03-12", title: "春季活动" },
  { id: "b", date: "2026-11-09", end: "2026-11-12", title: "设计工作坊" },
];
</script>
<template>
  <div>
    <HysCalendar
      v-model="value"
      v-model:mode="mode"
      :events="events"
      controller-type="select"
      @select="(_, info) => (source = info.source)"
      ><template #month-cell="{ data }"
        ><span class="calendar-demo-month-info">{{
          data.events.length
            ? data.events.map((e) => e.title).join("、")
            : "暂无日程"
        }}</span></template
      ></HysCalendar
    ><output class="state-output"
      >日期：{{ value }} · 视图：{{ mode }} · 来源：{{
        source || "未操作"
      }}</output
    >
    <p class="scenario-note">
      年视图选择月份时保留原日期的日号，并按该月有效天数与禁用规则调整；切换月视图可继续查看日程。
    </p>
  </div>
</template>
<style scoped>
.calendar-demo-month-info {
  font-size: 12px;
  color: var(--docs-muted);
  line-height: 1.6;
}
</style>
