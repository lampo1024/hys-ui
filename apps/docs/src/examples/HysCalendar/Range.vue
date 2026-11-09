<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar } from "hys-ui";
const value = ref("2026-11-28");
</script>
<template>
  <div>
    <HysCalendar
      v-model="value"
      :range="['2026-11-25', '2026-12-10']"
      :events="[
        {
          id: 'release',
          date: '2026-11-30',
          end: '2026-12-02',
          title: '发布窗口',
        },
      ]"
    /><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      range
      固定展示一个或相邻两个月内的日期区间，自动补齐整周；补齐的范围外日期不可选，隐藏月份切换工具栏。
    </p>
  </div>
</template>
