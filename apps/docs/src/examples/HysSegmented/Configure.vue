<script setup lang="ts">
import { ref, reactive } from "vue";
import { HysSegmented, HysSelect, HysCheckbox } from "hys-ui";
const view = ref("week"),
  config = reactive({
    size: "md" as "sm" | "md" | "lg",
    block: false,
    vertical: false,
    round: false,
    readonly: false,
    disabled: false,
    keyboard: true,
    loopNavigation: true,
  }),
  options = [
    { label: "日", value: "day" },
    { label: "周", value: "week" },
    { label: "月", value: "month" },
  ];
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>尺寸</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>控件尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>布局与交互</h3>
        <div class="demo-control-toggles">
          <div
            v-for="item in [
              { key: 'block', label: '铺满容器' },
              { key: 'vertical', label: '纵向排列' },
              { key: 'round', label: '圆角外观' },
              { key: 'readonly', label: '只读' },
              { key: 'disabled', label: '禁用' },
              { key: 'keyboard', label: '键盘操作' },
              { key: 'loopNavigation', label: '循环导航' },
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
    <HysSegmented
      v-model="view"
      v-bind="config"
      :options="options"
      aria-label="配置分段"
    /><output>{{ JSON.stringify({ view, ...config }, null, 2) }}</output>
  </div>
</template>
