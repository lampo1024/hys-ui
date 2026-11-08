<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysButton, type HysInputInstance } from "hys-ui";
const entry = ref<HysInputInstance>(),
  value = ref("可以聚焦、选择和清空"),
  event = ref("尚未触发事件");
</script>
<template>
  <div class="demo-content">
    <HysInput
      ref="entry"
      v-model="value"
      aria-label="实例方法输入"
      @focus="event = '获得焦点'"
      @blur="event = '失去焦点'"
      @press-enter="event = '按下 Enter'"
      @clear="event = '已清空'"
    />
    <div class="demo-row">
      <HysButton
        variant="secondary"
        @click="entry?.focus({ preventScroll: true })"
        >聚焦输入</HysButton
      ><HysButton variant="secondary" @click="entry?.select()"
        >选择全部</HysButton
      ><HysButton variant="ghost" @click="entry?.clear()">清空内容</HysButton>
    </div>
    <output class="state-output">{{ event }}</output>
  </div>
</template>
