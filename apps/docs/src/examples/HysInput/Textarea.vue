<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysTextarea } from "hys-ui";
const content = ref("支持换行的文本内容\n保留同一个值模型");
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>Input 的多行模式</span
        ><HysInput
          v-model="content"
          type="textarea"
          :rows="3"
          clearable
          :maxlength="200"
          show-count
          aria-label="多行输入"
      /></label>
      <div class="input-demo-field">
        <span>独立 Textarea</span
        ><HysTextarea
          v-model="content"
          :rows="3"
          :maxlength="200"
          aria-label="独立多行输入"
        />
      </div>
    </div>
    <p class="scenario-note">
      两种写法共用输入、计数、格式解析和无障碍行为。rows 设置初始行数，resize
      设置手动拉伸方向。
    </p>
  </div>
</template>
