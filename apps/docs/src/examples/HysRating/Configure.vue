<script setup lang="ts">
import { ref, reactive } from "vue";
import { HysRating, HysSelect, HysNumberInput, HysCheckbox } from "hys-ui";
const score = ref(3),
  config = reactive({
    max: 5,
    size: "md" as "sm" | "md" | "lg",
    allowHalf: false,
    allowClear: true,
    showScore: true,
    showText: false,
    disabled: false,
    readonly: false,
  });
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>尺寸与数量</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>评分上限</span
            ><HysNumberInput
              v-model="config.max"
              :min="0"
              :max="10"
              :show-controls="false" /></label
          ><label class="demo-field"
            ><span>尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>交互与展示</h3>
        <div class="demo-control-toggles">
          <div
            v-for="item in [
              { key: 'allowHalf', label: '允许半分' },
              { key: 'allowClear', label: '允许清空' },
              { key: 'showScore', label: '显示分数' },
              { key: 'showText', label: '显示说明' },
              { key: 'disabled', label: '禁用' },
              { key: 'readonly', label: '只读' },
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
    <HysRating
      v-model="score"
      v-bind="config"
      :texts="['较差', '一般', '良好', '满意', '非常满意']"
      aria-label="配置评分"
    /><output>{{ JSON.stringify({ score, ...config }, null, 2) }}</output>
  </div>
</template>
