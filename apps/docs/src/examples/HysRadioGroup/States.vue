<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup
      :options="['a', 'b', 'c']"
      type="button"
      block
      error="请重新确认选择"
      aria-label="按钮组错误"
    />
    <HysRadioGroup
      default-value="a"
      :options="['a', 'b']"
      disabled
      aria-label="禁用单选组"
    /><HysRadioGroup
      default-value="a"
      :options="['a', 'b']"
      readonly
      aria-label="只读单选组"
    /><HysRadioGroup :options="[]" aria-label="空单选组"
      ><template #empty>没有可用的选项</template></HysRadioGroup
    >
  </div>
</template>
