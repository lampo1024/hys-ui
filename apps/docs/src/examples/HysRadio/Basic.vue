<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio } from "hys-ui";
const value = ref("design");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysRadio
        v-model="value"
        value="design"
        label="设计"
        name="single-role"
      /><HysRadio
        v-model="value"
        value="dev"
        label="研发"
        name="single-role"
      /><HysRadio
        v-model="value"
        value="qa"
        label="测试"
        name="single-role"
        disabled
      />
    </div>
    <output>{{ value }}</output>
  </div>
</template>
