<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
import { Star, Minus } from "lucide-vue-next";
const value = ref(true);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="value" label="收藏"
      ><template #icon="{ checked, indeterminate }"
        ><Minus v-if="indeterminate" :size="12" /><Star
          v-else-if="checked"
          :size="12" /></template></HysCheckbox
    ><HysCheckbox
      :model-value="false"
      indeterminate
      label="部分选中"
    /><output>{{ value ? "已收藏" : "未收藏" }}</output>
  </div>
</template>
