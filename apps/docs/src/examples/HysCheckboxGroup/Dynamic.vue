<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckboxGroup, HysButton } from "hys-ui";
const values = ref<string[]>([]),
  options = ref(["Alpha", "Beta"]),
  index = ref(1);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" @click="options.push('新增 ' + index++)"
        >添加选项</HysButton
      ><HysButton size="sm" :disabled="!options.length" @click="options.pop()"
        >删除末项</HysButton
      >
    </div>
    <HysCheckboxGroup
      v-model="values"
      :options="options"
      aria-label="动态复选框组"
    /><output>{{ JSON.stringify(values) }}</output>
    <p class="scenario-note">
      移除选项不会擅自删除模型中的值，调用方可以在业务确认后同步调整模型。
    </p>
  </div>
</template>
