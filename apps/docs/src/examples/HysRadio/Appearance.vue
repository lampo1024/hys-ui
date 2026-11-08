<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio } from "hys-ui";
const value = ref("a");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysRadio v-model="value" value="a" label="边框样式" border /><HysRadio
        v-model="value"
        value="b"
        label="按钮样式"
        button
      /><HysRadio
        v-model="value"
        value="c"
        label="填充样式"
        button
        button-style="solid"
      />
    </div>
    <div class="demo-row">
      <HysRadio
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        v-model="value"
        :value="size"
        :label="size"
        :size="size"
      />
    </div>
  </div>
</template>
