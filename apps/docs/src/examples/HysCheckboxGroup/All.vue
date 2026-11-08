<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  HysCheckboxGroup,
  HysCheckbox,
  HysButton,
  type HysCheckboxGroupInstance,
} from "hys-ui";
const values = ref(["fixed"]),
  control = ref<HysCheckboxGroupInstance>(),
  options = [
    { value: "fixed", label: "固定成员", disabled: true },
    "Alex",
    "Lisa",
    "Amy",
  ];
</script>
<template>
  <div class="demo-content">
    <HysCheckbox
      :model-value="!!control?.allChecked"
      :indeterminate="control?.indeterminate"
      label="全选可用成员"
      @change="(next) => (next ? control?.checkAll() : control?.clear())"
    /><HysCheckboxGroup
      ref="control"
      v-model="values"
      :options="options"
      aria-label="成员列表"
    />
    <div class="demo-row">
      <HysButton size="sm" @click="control?.checkAll()">全选</HysButton
      ><HysButton size="sm" @click="control?.clear()">清除可选项</HysButton>
    </div>
    <output>{{ values.join("、") }}</output>
    <p class="scenario-note">全选和清除会保留禁用项与尚未加载的选中值。</p>
  </div>
</template>
