<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
const number = ref(0),
  string = ref("off");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysSwitch
        v-model="number"
        :active-value="1"
        :inactive-value="0"
        active-text="数值开关"
      /><HysSwitch
        v-model="string"
        active-value="on"
        inactive-value="off"
        active-text="字符串开关"
      />
    </div>
    <output>数字：{{ number }} · 字符串：{{ string }}</output>
  </div>
</template>
