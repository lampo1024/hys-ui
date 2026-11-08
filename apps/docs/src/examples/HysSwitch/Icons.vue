<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
import { Sun, Moon, Check, X, Star } from "lucide-vue-next";
const value = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysSwitch
        v-model="value"
        :active-action-icon="Sun"
        :inactive-action-icon="Moon"
        aria-label="主题模式"
      /><HysSwitch
        v-model="value"
        inline-prompt
        :active-icon="Check"
        :inactive-icon="X"
        aria-label="图标提示"
      /><HysSwitch v-model="value" aria-label="自定义滑块"
        ><template #thumb="{ checked }"
          ><Star
            :size="11"
            :fill="checked ? 'currentColor' : 'none'" /></template
      ></HysSwitch>
    </div>
  </div>
</template>
