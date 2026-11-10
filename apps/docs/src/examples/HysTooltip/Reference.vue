<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton } from "hys-ui";
const button = ref<InstanceType<typeof HysButton>>();
const reference = () => button.value?.element;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton ref="button" variant="secondary">独立触发元素</HysButton
      ><HysTooltip
        :reference="reference"
        trigger="click"
        text="提示与触发元素可以分开声明。"
        show-arrow
      />
    </div>
    <p class="scenario-note">
      reference 支持真实元素或包含 getBoundingClientRect
      的虚拟矩形。虚拟矩形一般搭配 manual 与受控显示使用。
    </p>
  </div>
</template>
