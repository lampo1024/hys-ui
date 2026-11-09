<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton, HysNumberInput, HysCheckbox } from "hys-ui";
const value = ref(8),
  showZero = ref(false),
  hidden = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <label
        >消息数量<HysNumberInput v-model="value" :min="0" :max="150" /></label
      ><HysCheckbox v-model="showZero" label="显示零值" /><HysCheckbox
        v-model="hidden"
        label="隐藏计数"
      />
    </div>
    <div class="counter-examples">
      <HysBadge :value="value" :max="99" :show-zero="showZero" :hidden="hidden"
        ><HysButton variant="secondary">待处理消息</HysButton></HysBadge
      ><HysBadge value="新" color="#7945d5"
        ><HysButton variant="secondary">更新</HysButton></HysBadge
      ><HysBadge :value="120" /><HysBadge dot
        ><HysButton variant="secondary">活动</HysButton></HysBadge
      >
    </div>
  </div>
  <p class="hint">
    只有数值类型受 max 限制。字符串作为完整文字显示；hidden
    隐藏角标，保留被标记的内容。
  </p>
</template>
<style scoped>
.counter-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 36px;
  padding: 16px 10px;
}
</style>
