<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysButton, type HysCalendarInstance } from "hys-ui";
const calendar = ref<HysCalendarInstance>(),
  value = ref("2026-11-09"),
  result = ref("");
async function choose() {
  result.value = (await calendar.value?.pickDay("2028-02-29"))
    ? "已选中闰日"
    : "未接受选择";
}
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="calendar?.selectDate('prev-year')"
        >上一年</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="calendar?.selectDate('next-year')"
        >下一年</HysButton
      ><HysButton size="sm" @click="choose">选择 2028 闰日</HysButton
      ><HysButton size="sm" variant="secondary" @click="calendar?.focus()"
        >聚焦日历</HysButton
      >
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysCalendar ref="calendar" v-model="value" />
    </div>
    <output class="state-output">{{ value }} {{ result }}</output>
    <p class="scenario-note">
      方向键移动焦点，Enter / Space 选择；Home / End 定位周首尾；PageUp /
      PageDown 切换月份，加 Shift 切换年份。仅在日期网格内生效。
    </p>
  </div>
</template>
