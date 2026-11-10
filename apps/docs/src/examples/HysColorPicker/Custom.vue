<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker, HysButton, HysBadge } from "hys-ui";
import { Palette } from "lucide-vue-next";
const color = ref("#3867f5");
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker v-model="color" :immediate="false" label="自定义颜色面板"
      ><template #trigger="{ show, disabled }"
        ><HysButton :disabled="disabled" @click="show"
          ><Palette :size="16" aria-hidden="true" />选择主题颜色</HysButton
        ></template
      ><template #header="{ dirty }"
        ><strong>主题配色</strong
        ><HysBadge>{{ dirty ? "尚未应用" : "当前配色" }}</HysBadge></template
      ><template #footer="{ confirm, cancel, valid, disabled }"
        ><HysButton variant="ghost" size="sm" @click="cancel"
          >暂不修改</HysButton
        ><HysButton size="sm" :disabled="disabled || !valid" @click="confirm"
          >应用配色</HysButton
        ></template
      ></HysColorPicker
    ><output class="state-output">{{ color }}</output>
  </div>
</template>
