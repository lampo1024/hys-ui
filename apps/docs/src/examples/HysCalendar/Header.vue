<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysButton } from "hys-ui";
const value = ref("2026-11-09");
</script>
<template>
  <HysCalendar v-model="value"
    ><template #header="{ date, selectDate }"
      ><div class="calendar-demo-heading">
        <div>
          <strong>团队日程</strong><small>{{ date }}</small>
        </div>
        <div class="demo-control-actions">
          <HysButton
            size="sm"
            variant="secondary"
            @click="selectDate('prev-month')"
            >上月</HysButton
          ><HysButton size="sm" variant="secondary" @click="selectDate('today')"
            >回到今天</HysButton
          ><HysButton
            size="sm"
            variant="secondary"
            @click="selectDate('next-month')"
            >下月</HysButton
          >
        </div>
      </div></template
    ></HysCalendar
  >
</template>
<style scoped>
.calendar-demo-heading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.calendar-demo-heading small {
  display: block;
  color: var(--docs-muted);
  margin-top: 5px;
}
</style>
