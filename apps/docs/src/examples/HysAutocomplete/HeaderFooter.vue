<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, HysButton } from "hys-ui";
import { Search } from "lucide-vue-next";
const value = ref(""),
  message = ref(""),
  options = ["交互设计", "接口联调", "发布流程", "测试规范"];
</script>
<template>
  <div class="demo-content">
    <HysAutocomplete
      v-model="value"
      :options="options"
      placeholder="搜索文档"
      clearable
      ><template #prefix><Search :size="15" /></template
      ><template #header="{ query, options: matches }"
        ><div class="autocomplete-demo-between">
          <strong>{{ query ? "匹配结果" : "常用文档" }}</strong
          ><span>{{ matches.length }} 条</span>
        </div></template
      ><template #footer="{ query, close }"
        ><div class="autocomplete-demo-between">
          <span>找不到需要的内容？</span
          ><HysButton
            size="sm"
            variant="ghost"
            @click="
              message = '搜索全部：' + (query || '全部文档');
              close();
            "
            >搜索全部</HysButton
          >
        </div></template
      ></HysAutocomplete
    ><output>{{ message || "可用 Tab 移至浮层底部的操作按钮" }}</output>
    <p class="scenario-note">
      头部、底部共享当前 query、loading 和过滤后的
      options。鼠标或键盘进入底部操作时保持浮层打开。
    </p>
  </div>
</template>
