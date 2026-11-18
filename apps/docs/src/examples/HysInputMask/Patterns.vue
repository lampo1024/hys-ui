<script setup lang="ts">
import { ref } from "vue";
import { HysInputMask } from "hys-ui";
const date = ref("20261118");
const time = ref("0930");
const code = ref("AB092");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysInputMask v-model="date" preset="date" aria-label="日期格式" />
      <HysInputMask v-model="time" preset="time" aria-label="时间格式" />
      <HysInputMask v-model="code" mask="AA-###" aria-label="批次编号格式" />
    </div>
    <p>原始值 {{ date }} · {{ time }} · {{ code }}</p>
  </div>
</template>
