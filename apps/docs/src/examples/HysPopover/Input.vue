<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysInput, HysSelect, HysButton } from "hys-ui";
const query = ref(""),
  value = ref("alpha"),
  options = [
    { label: "方案 Alpha", value: "alpha" },
    { label: "方案 Beta", value: "beta" },
  ];
</script>
<template>
  <div class="demo-stack">
    <HysPopover trigger="focus" title="查询提示" :width="300"
      ><template #trigger
        ><HysInput v-model="query" placeholder="输入查询关键词" /></template
      ><template #default="{ close }"
        ><div class="demo-stack">
          <p>输入后继续编辑，或按 Tab 进入操作区。</p>
          <HysButton @click="close">完成查询</HysButton>
        </div></template
      ></HysPopover
    ><output class="state-output">{{ query || "尚未输入" }}</output>
    <p class="scenario-note">
      使用输入或选择控件作为触发内容时，保留原生编辑按键与控件自身的浮层；包装层不会增加额外的
      Tab 焦点。
    </p>
  </div>
</template>
