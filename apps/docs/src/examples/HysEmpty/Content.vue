<script setup lang="ts">
import { ref } from "vue";
import { HysEmpty, HysInput, HysButton, HysBadge } from "hys-ui";
import { SearchX } from "lucide-vue-next";
const query = ref("示例关键词");
</script>
<template>
  <div class="demo-stack">
    <label class="demo-field">搜索条件<HysInput v-model="query" /></label
    ><HysEmpty
      ><template #image><SearchX :size="48" aria-hidden="true" /></template
      ><template #title>没有找到相关结果</template
      ><template #description
        ><span
          >当前条件：<HysBadge>{{ query || "不限" }}</HysBadge></span
        ></template
      ><template #action
        ><HysButton @click="query = ''">清空条件</HysButton
        ><HysButton variant="ghost" @click="query = '新的关键词'"
          >换个关键词</HysButton
        ></template
      ></HysEmpty
    >
  </div>
</template>
