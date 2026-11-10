<script setup lang="ts">
import { ref, h } from "vue";
import { HysProgress, HysSlider, HysCheckbox } from "hys-ui";
import { Check } from "lucide-vue-next";
const value = ref(35),
  show = ref(true);
</script>
<template>
  <div class="demo-stack">
    <HysSlider v-model="value" aria-label="文字示例进度" /><HysCheckbox
      v-model="show"
      label="显示进度文字"
    /><HysProgress
      :value="value"
      :show-label="show"
      text-inside
      aria-label="内置文字"
    /><HysProgress
      :value="value"
      :show-label="show"
      :format="
        (value) => h('strong', value === 100 ? '全部完成' : value + ' / 100 项')
      "
      aria-label="自定义格式"
    /><HysProgress
      :value="value / 3"
      :show-label="show"
      :precision="2"
      aria-label="小数精度"
    /><HysProgress
      :value="value"
      :show-label="show"
      show-status-icon
      aria-label="自定义图标"
      ><template #icon><Check :size="14" aria-hidden="true" /></template
    ></HysProgress>
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        type="circle"
        :width="132"
        :show-label="show"
        aria-label="插槽内容"
        ><template #default="{ value }"
          ><span class="progress-demo-label"
            ><strong>{{ value }}%</strong><small>处理完成</small></span
          ></template
        ></HysProgress
      >
    </div>
  </div>
</template>
<style scoped>
.progress-demo-label {
  display: grid;
  gap: 2px;
}
.progress-demo-label small {
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
</style>
