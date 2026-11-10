<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton } from "hys-ui";
const button = ref<InstanceType<typeof HysButton>>();
const reference = () => button.value?.element;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton ref="button" variant="secondary">独立触发元素</HysButton
      ><HysPopover
        :reference="reference"
        trigger="click"
        title="独立挂载的内容"
        content="触发元素和内容无需放在同一个插槽中。"
        show-arrow
      />
    </div>
    <p class="scenario-note">
      reference 支持真实元素或包含 getBoundingClientRect
      的虚拟矩形。虚拟矩形一般搭配 manual 与受控显示使用。
    </p>
  </div>
</template>
