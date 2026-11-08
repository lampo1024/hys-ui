<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
const value = ref("👨‍👩‍👧‍👦é"),
  weighted = ref("中文ab");
const weight = (value: string) =>
  Array.from(value).reduce(
    (total, char) => total + (char.charCodeAt(0) > 127 ? 2 : 1),
    0,
  );
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>按用户可见字符计数</span
        ><HysInput
          v-model="value"
          :maxlength="5"
          count-graphemes
          show-count
          clearable
          aria-label="可见字符计数" /></label
      ><label class="input-demo-field"
        ><span>自定义计算规则：中文计 2</span
        ><HysInput
          v-model="weighted"
          :maxlength="10"
          :count-graphemes="weight"
          show-count
          aria-label="加权字符计数"
      /></label>
    </div>
    <output class="state-output"
      >可见字符示例：{{ value }}<br />自定义规则示例：{{ weighted }}</output
    >
    <p class="scenario-note">
      countGraphemes=true 使用
      Intl.Segmenter，将家庭表情、肤色和组合重音视为完整字符。也可传入单调增长的计数函数；计数、输入裁剪和最小长度检查采用同一规则，中文输入法会在组合完成后检查长度。
    </p>
  </div>
</template>
