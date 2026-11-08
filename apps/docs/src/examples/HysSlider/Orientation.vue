<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const reverse = ref(30),
  vertical = ref(35),
  interval = ref<[number, number]>([20, 75]);
</script>
<template>
  <div class="demo-content">
    <HysSlider
      v-model="reverse"
      label="横向反向"
      reverse
      :marks="{ 0: '0', 50: '50', 100: '100' }"
    />
    <div class="vertical-examples">
      <HysSlider
        v-model="vertical"
        label="竖向"
        vertical
        :height="220"
        :step="5"
        :marks="{ 0: '0', 50: '50', 100: '100' }"
        tooltip-placement="right"
      />
      <HysSlider
        v-model="interval"
        label="竖向反向范围"
        vertical
        reverse
        :height="220"
        :step="5"
        :marks="{ 0: '0', 50: '50', 100: '100' }"
        tooltip-placement="right"
      />
    </div>
  </div>
</template>
<style scoped>
.vertical-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 40px 70px;
  padding: 12px 0;
}
</style>
