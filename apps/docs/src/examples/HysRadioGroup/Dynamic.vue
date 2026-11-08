<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup, HysButton } from "hys-ui";
const value = ref<number | null>(null),
  options = ref([
    { id: 0, title: "选项零" },
    { id: 1, title: "选项一" },
  ]),
  index = ref(2);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton
        size="sm"
        @click="options.push({ id: index, title: '选项 ' + index++ })"
        >添加选项</HysButton
      ><HysButton size="sm" :disabled="!options.length" @click="options.pop()"
        >删除末项</HysButton
      >
    </div>
    <HysRadioGroup
      v-model="value"
      :options="options"
      :field-names="{ value: 'id', label: 'title' }"
      aria-label="动态单选组"
    /><output>{{ JSON.stringify(value) }}</output>
  </div>
</template>
