<script setup lang="ts">
import { ref } from "vue";
import { HysPopover, HysButton, HysNumberInput } from "hys-ui";
const showDelay = ref(200),
  hideDelay = ref(250),
  autoClose = ref(0);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>展开延迟（毫秒）</span
          ><HysNumberInput
            v-model="showDelay"
            :min="0"
            :max="3000"
            :step="50" /></label
        ><label class="demo-field"
          ><span>收起延迟（毫秒）</span
          ><HysNumberInput
            v-model="hideDelay"
            :min="0"
            :max="3000"
            :step="50" /></label
        ><label class="demo-field"
          ><span>自动关闭（0 为关闭）</span
          ><HysNumberInput v-model="autoClose" :min="0" :max="5000" :step="250"
        /></label>
      </div>
    </div>
    <div class="demo-content">
      <HysPopover
        trigger="hover"
        :show-delay="showDelay"
        :hide-delay="hideDelay"
        :auto-close="autoClose"
        show-arrow
        title="操作详情"
        ><template #trigger
          ><HysButton variant="secondary">悬停体验延迟</HysButton></template
        >这里展示辅助说明。</HysPopover
      >
    </div>
    <p class="scenario-note">
      指针短暂经过不会打开；进入浮层可取消待执行的收起。自动关闭也会遵守宿主的受控显示策略。
    </p>
  </div>
</template>
