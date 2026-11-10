<script setup lang="ts">
import { ref } from "vue";
import { HysEmpty, HysButton } from "hys-ui";
const result = ref("等待创建");
</script>
<template>
  <div class="demo-stack">
    <HysEmpty /><HysEmpty
      title="暂无附件"
      description="添加一个文件后，它会显示在这里。"
      ><HysButton @click="result = '已开始添加附件'"
        >添加附件</HysButton
      ></HysEmpty
    ><output class="state-output">{{ result }}</output>
  </div>
</template>
