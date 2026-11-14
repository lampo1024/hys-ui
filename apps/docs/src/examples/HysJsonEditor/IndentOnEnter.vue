<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysJsonEditor } from "hys-ui";
const value = ref("{}"),
  indent = ref(true);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="indent" label="换行时自动缩进" />
    <HysJsonEditor v-model="value" :indent="2" :auto-indent="indent" />
    <p class="scenario-note">
      把光标放在左花括号后，按 Enter 可在新行保留缩进。
    </p>
  </div>
</template>
