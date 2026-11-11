<script setup lang="ts">
import { ref } from "vue";
import { ArrowRight, FolderSearch, RotateCcw } from "lucide-vue-next";
import { HysButton, HysSearch } from "hys-ui";

const result = ref<string>();
</script>

<template>
  <div class="demo-panel search-custom-demo">
    <HysSearch
      default-value="最近打开"
      trigger="submit"
      :input-props="{ name: 'query', autocomplete: 'off' }"
      aria-label="文件搜索"
      @search="result = $event"
    >
      <template #prefix><FolderSearch :size="16" aria-hidden="true" /></template>
      <template #clear-icon><RotateCcw :size="14" aria-hidden="true" /></template>
      <template #search-button="{ search, disabled, loading }">
        <HysButton class="search-custom-button" :icon="ArrowRight" :disabled="disabled" :loading="loading" @click="search">
          查看文件
        </HysButton>
      </template>
    </HysSearch>
    <output v-if="result !== undefined" aria-live="polite">{{ result ? '查找 ' + result : '显示全部文件' }}</output>
  </div>
</template>

<style scoped>
.search-custom-demo { display: grid; gap: 8px; max-width: 520px; }
.search-custom-button { border-start-start-radius: 0; border-end-start-radius: 0; }
</style>
