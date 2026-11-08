<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
const value = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox v-model="value" label="普通" /><HysCheckbox
        v-model="value"
        border
        label="边框"
      /><HysCheckbox v-model="value" button label="按钮" /><HysCheckbox
        v-model="value"
        button
        button-style="solid"
        label="填充按钮"
      />
    </div>
    <div class="demo-row">
      <HysCheckbox
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        v-model="value"
        :size="size"
        :label="size"
      />
    </div>
  </div>
</template>
