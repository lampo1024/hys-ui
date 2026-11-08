<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
const string = ref("no"),
  number = ref(0);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox
        v-model="string"
        true-value="yes"
        false-value="no"
        label="字符串值"
      /><HysCheckbox
        v-model="number"
        :true-value="1"
        :false-value="0"
        label="数字值"
      />
    </div>
    <output>字符串：{{ string }} · 数字：{{ number }}</output>
  </div>
</template>
