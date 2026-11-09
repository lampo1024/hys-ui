<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysCheckbox } from "hys-ui";
const disabled = ref(false),
  readonly = ref(true),
  loading = ref(false),
  message = ref("");
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>交互状态</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="disabled">禁用</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="readonly">只读</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="loading">加载中</HysCheckbox>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysCalendar
        default-value="2026-11-09"
        :disabled="disabled"
        :readonly="readonly"
        :loading="loading"
        :events="[{ id: 'note', date: '2026-11-09', title: '查看会议安排' }]"
        @event="message = '已查看日程'"
      />
    </div>
    <output class="state-output">{{
      message || "只读允许浏览月份和查看日程；禁用与加载状态停止交互。"
    }}</output>
  </div>
</template>
