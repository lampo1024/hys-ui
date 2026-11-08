<script setup lang="ts">
import { ref } from "vue";
import { HysRadioGroup } from "hys-ui";
const value = ref("a");
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup
      v-model="value"
      dir="rtl"
      :options="[
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
        { label: '选项 C', value: 'c' },
      ]"
      type="button"
      aria-label="从右向左单选组"
    /><output>{{ value }}</output>
    <p class="scenario-note">
      在从右向左的方向中，水平箭头跟随视觉顺序；上、下方向键与 Home / End
      保持分组逻辑。
    </p>
  </div>
</template>
