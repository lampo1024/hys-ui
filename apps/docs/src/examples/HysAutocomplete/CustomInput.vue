<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, HysTextarea } from "hys-ui";
const value = ref("");
const options = [
  "建议先完成设计评审，再进入开发。",
  "请补充验收条件和测试数据。",
  "本次修改已验证，可以合并。",
];
</script>
<template>
  <div class="demo-content">
    <label class="autocomplete-demo-field"
      ><span>评论快捷回复</span
      ><HysAutocomplete
        v-model="value"
        :options="options"
        :filter-option="false"
        :trigger-on-focus="false"
        aria-label="评论快捷回复"
        ><template #input="{ value: inputValue, setValue, inputProps }"
          ><HysTextarea
            v-bind="inputProps"
            :model-value="inputValue"
            :rows="3"
            placeholder="输入后按方向键选择快捷回复，Shift + Enter 换行"
            @update:model-value="
              setValue
            " /></template></HysAutocomplete></label
    ><output>{{ value || "等待输入" }}</output>
    <p class="scenario-note">
      自定义输入使用 input 插槽。将 inputProps 传给输入组件，并用 setValue
      更新值，即可保留禁用、尺寸、组合框语义和键盘操作。
    </p>
  </div>
</template>
