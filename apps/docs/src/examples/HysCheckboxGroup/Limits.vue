<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  HysCheckboxGroup,
  HysButton,
  type HysCheckboxGroupInstance,
} from "hys-ui";
const values = ref(["a"]),
  control = ref<HysCheckboxGroupInstance>(),
  message = ref("");
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup
      ref="control"
      v-model="values"
      :options="['a', 'b', 'c', 'd']"
      :min="1"
      :max="2"
      aria-label="选择一至两项"
      @reject="(info) => (message = info.reason)"
    />
    <div class="demo-row">
      <HysButton size="sm" @click="control?.checkAll()">选至上限</HysButton
      ><HysButton size="sm" @click="control?.clear()">保留最少项</HysButton>
    </div>
    <output
      >{{ values.join("、") }} · {{ message || "至少 1 项，至多 2 项" }}</output
    >
  </div>
</template>
