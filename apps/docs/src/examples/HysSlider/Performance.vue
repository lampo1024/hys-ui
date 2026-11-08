<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSlider } from "hys-ui";
const value = ref(35),
  tooltips = ref(true),
  submitted = ref(35),
  commits = ref(0);
function save(value: number) {
  submitted.value = value;
  commits.value++;
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="tooltips" label="显示实时提示" />
    <HysSlider
      v-model="value"
      label="细步长连续调节"
      :step="0.1"
      :show-tooltip="tooltips"
      :format-tooltip="(value) => value.toFixed(1) + '%'"
      @change="save"
    />
    <output class="state-output"
      >已确认：{{ submitted.toFixed(1) }}% · 确认次数：{{ commits }}</output
    >
    <p class="scenario-note">
      步长决定停靠间隔，较大的步长会产生明显的分段移动。连续调节可使用较小步长；请求、图表重算等耗时操作建议放在
      change 中，拖动期间使用 input 获取实时值。
    </p>
  </div>
</template>
