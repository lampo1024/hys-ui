<script setup lang="ts">
import { ref } from "vue";
import { HysSearch } from "hys-ui";

const keyword = ref("");
const submitted = ref<string>();
</script>

<template>
  <div class="demo-panel search-submit-demo">
    <HysSearch
      v-model="keyword"
      trigger="submit"
      enter-button="搜索项目"
      search-label="搜索项目"
      aria-label="项目关键词"
      placeholder="输入项目名称"
      search-on-clear
      @search="submitted = $event"
    />
    <output v-if="submitted !== undefined" aria-live="polite">
      {{ submitted ? '搜索关键词 ' + submitted : '已清空搜索' }}
    </output>
  </div>
</template>

<style scoped>
.search-submit-demo { display: grid; gap: 8px; max-width: 520px; }
</style>
