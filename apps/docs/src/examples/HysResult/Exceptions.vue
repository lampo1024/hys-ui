<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysResult,
  HysSelect,
  type HysResultCode,
} from "hys-ui";
const code = ref<HysResultCode>("403"),
  showCode = ref(true),
  aligned = ref(false);
const feedback = ref("");
const pages = {
  "403": ["你还没有这个工作区的访问权限。", "申请权限"],
  "404": ["这条链接可能已失效，或内容已被移动。", "返回工作台"],
  "500": ["服务暂时没有响应，你可以稍后重试。", "重新加载"],
};
const copy = computed(() => pages[code.value]);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >异常类型
          <HysSelect
            v-model="code"
            aria-label="异常类型"
            @change="feedback = ''"
            :options="[
              { label: '403 · 无权访问', value: '403' },
              { label: '404 · 页面不存在', value: '404' },
              { label: '500 · 服务异常', value: '500' },
            ]"
          />
        </label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="showCode" label="显示状态码" />
        <HysCheckbox v-model="aligned" label="左侧对齐" />
      </div>
    </div>
    <div class="result-preview">
      <HysResult
        :status="code"
        :subtitle="copy[0]"
        :show-code="showCode"
        :align="aligned ? 'start' : 'center'"
        :heading-level="3"
      >
        <template #extra
          ><HysButton @click="feedback = '已选择：' + copy[1]">{{
            copy[1]
          }}</HysButton></template
        >
      </HysResult>
    </div>
    <output v-if="feedback" class="state-output" aria-live="polite">{{
      feedback
    }}</output>
  </div>
</template>

<style scoped>
.result-preview {
  border: 1px solid var(--docs-border);
  border-radius: 10px;
}
</style>
