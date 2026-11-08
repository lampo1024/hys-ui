<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
import { CircleX, Eraser } from "lucide-vue-next";
const icon = ref("使用 clearIcon 属性"),
  slot = ref("使用 clear-icon 插槽");
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>图标组件属性</span
        ><HysInput v-model="icon" clearable :clear-icon="CircleX" /></label
      ><label class="input-demo-field"
        ><span>自定义图标插槽</span
        ><HysInput v-model="slot" clearable
          ><template #clear-icon><Eraser :size="14" /></template></HysInput
      ></label>
    </div>
    <p class="scenario-note">
      插槽优先于属性；按钮保留清空语义、键盘操作和焦点恢复。
    </p>
  </div>
</template>
