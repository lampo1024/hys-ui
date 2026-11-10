<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysBadge } from "hys-ui";
import { Tags, Trash2, Minus } from "lucide-vue-next";
const tags = ref(["设计", "研发"]);
</script>
<template>
  <div class="demo-stack">
    <HysTagInput v-model="tags" clearable aria-label="自定义标签"
      ><template #prefix><Tags :size="16" aria-hidden="true" /></template
      ><template #tag="{ value, index }"
        ><span>{{ index + 1 }} · {{ value }}</span></template
      ><template #suffix="{ values }"
        ><HysBadge>{{ values.length }} 项</HysBadge></template
      ><template #clear-icon><Trash2 :size="14" aria-hidden="true" /></template
      ><template #remove-icon><Minus :size="12" aria-hidden="true" /></template
    ></HysTagInput>
    <p class="scenario-note">
      标签插槽保留 value/index，并提供当前只读状态和 remove
      方法。前后缀不会挤压文字输入区。
    </p>
  </div>
</template>
