<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysCheckbox, HysNumberInput, HysSelect } from "hys-ui";
const value = ref(3),
  config = reactive({
    controlsPosition: "both" as "both" | "right",
    size: "md" as "sm" | "md" | "lg",
    showControls: true,
    selectOnFocus: true,
    loading: false,
  });
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>控件布局</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>按钮位置</span
            ><HysSelect
              v-model="config.controlsPosition"
              :options="[
                { label: '两侧', value: 'both' },
                { label: '右侧', value: 'right' },
              ]" /></label
          ><label class="demo-field"
            ><span>尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              "
          /></label>
        </div>
        <div class="demo-control-toggles">
          <HysCheckbox
            v-model="config.showControls"
            label="显示步进按钮"
          /><HysCheckbox
            v-model="config.selectOnFocus"
            label="聚焦时全选"
          /><HysCheckbox v-model="config.loading" label="加载状态" />
        </div>
      </section>
    </div>
    <HysNumberInput
      v-model="value"
      v-bind="config"
      :min="0"
      :max="20"
      block
      aria-label="可配置布局的数量"
      ><template #prefix>数量</template
      ><template #suffix>件</template></HysNumberInput
    ><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      支持两侧、右侧和隐藏按钮布局，加载时保留当前值并禁止操作。可用 prefix /
      suffix、prepend / append 和步进图标插槽组合内容。
    </p>
  </div>
</template>
