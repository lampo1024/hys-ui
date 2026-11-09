<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar } from "hys-ui";
const date = ref(new Date(2026, 10, 9));
const message = ref("");
</script>
<template>
  <div>
    <HysCalendar
      v-model="date"
      value-type="date"
      controller-type="select"
      @select="(_, info) => (message = info.source)"
    /><output class="state-output"
      >Date 类型：{{ date.toLocaleDateString("zh-CN") }} · 来源：{{
        message || "未操作"
      }}</output
    >
    <p class="scenario-note">
      默认绑定 YYYY-MM-DD 字符串，也可绑定
      Date（本地日期，不修改传入对象）。空值的 Date 模型请显式指定
      valueType="date"。字符串可通过 valueFormat 设置 YYYY、MM、DD
      组成的格式，事件数据与插槽的 day 始终使用 ISO 日期。
    </p>
  </div>
</template>
