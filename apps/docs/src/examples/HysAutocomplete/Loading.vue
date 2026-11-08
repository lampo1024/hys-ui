<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, HysCheckbox, HysSkeleton } from "hys-ui";
const value = ref(""),
  loading = ref(true);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="loading" label="加载中" /><label
      class="autocomplete-demo-field"
      ><span>自定义加载内容</span
      ><HysAutocomplete
        v-model="value"
        :options="['设计规范', '交互指南', '组件文档']"
        :loading="loading"
        placeholder="聚焦查看加载占位"
        ><template #loading
          ><div class="autocomplete-demo-loading">
              <HysSkeleton :lines="2" /><span>正在检索文档…</span>
          </div></template
        ></HysAutocomplete
      ></label
    >
    <p class="scenario-note">
      loading 可由调用方控制，远程查询等待期间也会自动进入加载状态。hideLoading
      可隐藏加载内容；等待中的建议不能通过 Enter 选中。
    </p>
  </div>
</template>
