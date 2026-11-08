<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup } from "hys-ui";
const value = ref("design");
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup
      v-model="value"
      :options="[
        { label: '设计', value: 'design' },
        { label: '研发', value: 'dev' },
        { label: '测试', value: 'qa', disabled: true },
      ]"
      aria-label="所属团队"
    /><output>{{ value }}</output>
  </div>
</template>
