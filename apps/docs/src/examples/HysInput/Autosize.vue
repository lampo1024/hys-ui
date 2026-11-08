<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysButton } from "hys-ui";
const free = ref("输入文字或换行，让高度随内容增长。"),
  bounded = ref("限制在 2 到 5 行之间。");
function expand() {
  bounded.value = Array.from(
    { length: 10 },
    (_, i) => `第 ${i + 1} 行：内容超出时在输入框内部滚动。`,
  ).join("\n");
}
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>内容自适应</span
        ><HysInput
          v-model="free"
          type="textarea"
          autosize
          placeholder="输入多行内容"
          aria-label="自由高度文本" /></label
      ><label class="input-demo-field"
        ><span>限制最少与最多行数</span
        ><HysInput
          v-model="bounded"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          clearable
          aria-label="限高文本"
      /></label>
    </div>
    <div class="demo-row">
      <HysButton variant="secondary" @click="expand">填充多行内容</HysButton
      ><HysButton variant="ghost" @click="bounded = ''">清空限高文本</HysButton>
    </div>
    <p class="scenario-note">
      内容变短时同步收起；容器宽度或控件尺寸改变后重新测量。高度达到最大行数时显示内部滚动条。
    </p>
  </div>
</template>
