<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysSelect, HysCheckbox } from "hys-ui";
const tags = ref<string[]>([]),
  trigger = ref<"Enter" | "Space" | "Tab">("Space"),
  blur = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >添加按键<HysSelect
          v-model="trigger"
          :options="
            ['Enter', 'Space', 'Tab'].map((value) => ({ label: value, value }))
          " /></label
      ><HysCheckbox v-model="blur" label="失焦保存" />
    </div>
    <HysTagInput
      v-model="tags"
      :trigger="trigger"
      :add-on-blur="blur"
      aria-label="按键添加标签"
      placeholder="输入后使用所选按键添加"
    /><output class="state-output">{{ tags }}</output>
    <p class="scenario-note">
      Tab 添加后仍允许焦点继续前进。中文输入法选词时不会触发添加。
    </p>
  </div>
</template>
