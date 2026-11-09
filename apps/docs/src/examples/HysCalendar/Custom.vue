<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysBadge, HysButton } from "hys-ui";
const value = ref("2026-11-09"),
  booked = ref(false);
</script>
<template>
  <div>
    <HysCalendar v-model="value"
      ><template #date="{ day }"
        >{{ day
        }}<span v-if="day === 9" aria-label="特别日期"> ·</span></template
      ><template #date-cell="{ data }"
        ><div v-if="data.day === '2026-11-09'" class="calendar-demo-cell">
          <HysBadge tone="purple">可预约</HysBadge
          ><HysButton
            size="sm"
            variant="ghost"
            @click.stop="booked = !booked"
            >{{ booked ? "已预约" : "预约" }}</HysButton
          >
        </div>
        <small
          v-if="data.type === 'current-month' && data.day.endsWith('15')"
          class="calendar-demo-note"
          >月度结算</small
        ></template
      ><template #footer="{ visibleRange }"
        >展示区间 {{ visibleRange.join(" 至 ") }}</template
      ></HysCalendar
    ><output class="state-output"
      >选中：{{ value }} · {{ booked ? "已预约" : "未预约" }}</output
    >
  </div>
</template>
<style scoped>
.calendar-demo-cell {
  display: grid;
  gap: 6px;
  justify-items: start;
}
.calendar-demo-note {
  font-size: 11px;
  color: var(--docs-muted);
}
</style>
