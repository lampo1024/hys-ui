<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysCheckbox } from "hys-ui";
const tags = ref(["需求评审", "技术设计", "开发实现", "测试验收"]),
  enabled = ref(true),
  message = ref("拖动标签改变顺序");
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="enabled" label="允许标签排序" /><HysTagInput
      v-model="tags"
      :draggable="enabled"
      :max="20"
      aria-label="可排序标签"
      @reorder="
        (from, to) => (message = '请求从 ' + (from + 1) + ' 移到 ' + (to + 1))
      "
    /><output class="state-output"
      >{{ message }} · {{ tags.join(" → ") }}</output
    >
    <p class="scenario-note">
      拖到标签前半部或后半部选择插入位置。输入为空时按左方向键聚焦末项，Alt +
      左/右方向键也可排序；Esc 取消拖拽。
    </p>
  </div>
</template>
