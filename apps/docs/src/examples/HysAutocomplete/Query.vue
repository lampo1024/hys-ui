<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, type HysAutocompleteFetch } from "hys-ui";
import { Search, FileText, Folder } from "lucide-vue-next";
const value = ref(""),
  result = ref("");
const suggest: HysAutocompleteFetch = (query) =>
  query
    ? [
        { value: query, label: query, scope: "全部内容", icon: Search },
        {
          value: query + " 文档",
          label: query + " 相关文档",
          scope: "文档",
          icon: FileText,
        },
        {
          value: query + " 项目",
          label: query + " 相关项目",
          scope: "项目",
          icon: Folder,
        },
      ]
    : [];
</script>
<template>
  <div class="demo-content">
    <HysAutocomplete
      v-model="value"
      :fetch-suggestions="suggest"
      :debounce="0"
      :trigger-on-focus="false"
      :min-query-length="1"
      select-when-unmatched
      placeholder="输入任意词，例如：设计"
      @select="(_, text) => (result = text)"
      ><template #option="{ item }"
        ><div v-if="typeof item !== 'string'" class="autocomplete-demo-query">
          <component :is="item.icon" :size="16" /><strong>{{
            item.label
          }}</strong
          ><small>{{ item.scope }}</small>
        </div></template
      ></HysAutocomplete
    ><output>搜索内容：{{ result || "尚未搜索" }}</output>
    <p class="scenario-note">
      不确定类目查询可根据当前输入即时生成不同搜索意图。选择建议或直接按 Enter
      都会触发 select，由业务决定后续行为。
    </p>
  </div>
</template>
