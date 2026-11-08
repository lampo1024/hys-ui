<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
const value = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysSwitch
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        v-model="value"
        :size="size"
        :active-text="size"
      />
    </div>
    <div class="demo-row">
      <HysSwitch v-model="value" :round="false" active-text="方形" /><HysSwitch
        v-model="value"
        active-color="#16a46e"
        inactive-color="#d96876"
        active-text="自定义颜色"
      />
    </div>
  </div>
</template>
