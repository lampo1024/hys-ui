<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCalendarNavigation } from "hys-ui";
const month = ref(new Date(Date.UTC(2026, 11, 1)));
const shortcuts = [
  { label: "本季度起点", month: new Date(Date.UTC(2026, 9, 1)) },
  { label: "财年起点", month: new Date(Date.UTC(2026, 0, 1)) },
];
const label = computed(() => month.value.toISOString().slice(0, 7));
</script>

<template>
  <div class="demo-stack">
    <div style="width: min(100%, 340px)">
      <HysCalendarNavigation
        v-model:month="month"
        :shortcuts="shortcuts"
        min="2026-04-01"
      >
        <output class="state-output">当前结算月 {{ label }}</output>
      </HysCalendarNavigation>
    </div>
  </div>
</template>
