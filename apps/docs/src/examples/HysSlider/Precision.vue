<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const decimal = ref(0.3),
  temperature = ref(-10);
</script>
<template>
  <div class="demo-content">
    <HysSlider
      v-model="decimal"
      label="小数步长"
      :min="0.1"
      :max="1"
      :step="0.2"
      show-stops
      show-input
      :show-input-controls="false"
    />
    <HysSlider
      v-model="temperature"
      label="温度"
      :min="-30"
      :max="50"
      :step="5"
      show-stops
      :format-tooltip="(value) => value + ' °C'"
    />
    <p class="scenario-note">
      步进从 min 开始，支持负数和小数。最大值即使未落在步进网格上，也能通过 End
      或拖动到终点选中。
    </p>
  </div>
</template>
