<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysAutocomplete,
  HysInput,
  HysSelect,
  HysNumberInput,
  HysCheckbox,
} from "hys-ui";
const value = ref(""),
  config = reactive({
    size: "md" as "sm" | "md" | "lg",
    placeholder: "输入关键词",
    minQueryLength: 0,
    disabled: false,
    readonly: false,
    clearable: true,
    triggerOnFocus: true,
    highlightFirst: false,
    backfill: false,
    caseSensitive: false,
    loopNavigation: true,
  });
const options = [
  "Vue",
  "Vite",
  "Vitest",
  { label: "暂不可用", value: "Disabled", disabled: true },
  "TypeScript",
];
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>输入与查询</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="[
                { label: '小 sm', value: 'sm' },
                { label: '中 md', value: 'md' },
                { label: '大 lg', value: 'lg' },
              ]" /></label
          ><label class="demo-field"
            ><span>占位文字</span
            ><HysInput v-model="config.placeholder" /></label
          ><label class="demo-field"
            ><span>最少输入字符</span
            ><HysNumberInput v-model="config.minQueryLength" :min="0" :max="10"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div
            v-for="item in [
              { key: 'disabled', label: '禁用交互' },
              { key: 'readonly', label: '只读模式' },
              { key: 'clearable', label: '允许清空' },
              { key: 'triggerOnFocus', label: '聚焦查询' },
              { key: 'highlightFirst', label: '默认高亮首项' },
              { key: 'backfill', label: '键盘预览回填' },
              { key: 'caseSensitive', label: '区分大小写' },
              { key: 'loopNavigation', label: '循环键盘导航' },
            ] as const"
            :key="item.key"
            class="demo-control-toggle"
          >
            <HysCheckbox
              v-model="config[item.key]"
              :label="item.label"
            /><small>{{ item.key }}</small>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysAutocomplete
        v-model="value"
        v-bind="config"
        :options="options"
        aria-label="配置预览"
      /><output>{{ value || "未输入" }}</output>
      <p class="scenario-note">
        debounce
        仅对远程提供函数生效；本地选项即时过滤。禁用、只读、最小长度与表单状态都能阻止查询。
      </p>
    </div>
  </div>
</template>
