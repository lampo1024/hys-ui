<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysInputOtp } from "hys-ui";
const code = ref("A2X7");
const readonly = ref(false);
const disabled = ref(false);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="readonly">只读</HysCheckbox>
      <HysCheckbox v-model="disabled">禁用</HysCheckbox>
    </div>
    <div>
      <HysInputOtp
        v-model="code"
        :length="4"
        pattern="[A-Z0-9]"
        aria-label="备用口令"
        :readonly="readonly"
        :disabled="disabled"
      />
    </div>
    <p class="scenario-note">备用口令由 4 位大写字母或数字组成。</p>
  </div>
</template>
