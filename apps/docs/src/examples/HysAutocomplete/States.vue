<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete } from "hys-ui";
const empty = ref(""),
  long = ref("");
const options = [
  "这是一条较长的建议内容，用于检查窄屏下浮层的宽度与省略效果",
  "普通建议",
];
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>空数据与自定义提示</span
        ><HysAutocomplete
          v-model="empty"
          :options="[]"
          placeholder="聚焦查看空状态"
          ><template #empty
            >没有匹配内容，仍可继续输入</template
          ></HysAutocomplete
        ></label
      ><label class="autocomplete-demo-field"
        ><span>禁用</span
        ><HysAutocomplete
          default-value="不可编辑"
          :options="options"
          disabled /></label
      ><label class="autocomplete-demo-field"
        ><span>只读</span
        ><HysAutocomplete
          default-value="可聚焦和复制"
          :options="options"
          readonly /></label
      ><label class="autocomplete-demo-field"
        ><span>较长选项</span
        ><HysAutocomplete
          v-model="long"
          :options="options"
          :popup-match-width="false"
          popup-width="420px"
          placeholder="选项不会撑破视口"
      /></label>
    </div>
    <p class="scenario-note">
      选项单行省略，悬停可查看完整标签。浮层随视口避让；页面离开时关闭浮层、取消请求并清理定位监听。
    </p>
  </div>
</template>
