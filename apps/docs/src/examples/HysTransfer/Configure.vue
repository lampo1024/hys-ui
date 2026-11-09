<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysTransfer, HysCheckbox, HysSelect, HysNumberInput } from "hys-ui";
const value = ref(["member-2"]);
const config = reactive<{
  disabled: boolean;
  loading: boolean;
  filterable: boolean;
  oneWay: boolean;
  showSelectAll: boolean;
  showInvert: boolean;
  draggable: boolean;
  animated: boolean;
  virtual: boolean;
  pagination: boolean;
  listHeight: number;
  size: "sm" | "md" | "lg";
  targetOrder: "original" | "push" | "unshift";
}>({
  disabled: false,
  loading: false,
  filterable: true,
  oneWay: false,
  showSelectAll: true,
  showInvert: false,
  draggable: true,
  animated: true,
  virtual: false,
  pagination: false,
  listHeight: 240,
  size: "md",
  targetOrder: "original",
});
const options = Array.from({ length: 18 }, (_, i) => ({
  value: "member-" + i,
  label: "团队成员 " + (i + 1),
  disabled: i === 5,
}));
</script>
<template>
  <div class="demo-controls">
    <section class="demo-control-section">
      <h3>尺寸与排列</h3>
      <div class="demo-control-fields">
        <label class="demo-field"
          >控件尺寸<HysSelect
            v-model="config.size"
            :options="[
              { label: '小', value: 'sm' },
              { label: '中', value: 'md' },
              { label: '大', value: 'lg' },
            ]" /></label
        ><label class="demo-field"
          >列表高度<HysNumberInput
            v-model="config.listHeight"
            :min="120"
            :max="480"
            :step="20" /></label
        ><label class="demo-field"
          >目标顺序<HysSelect
            v-model="config.targetOrder"
            :options="[
              { label: '按源数据顺序', value: 'original' },
              { label: '新条目放到末尾', value: 'push' },
              { label: '新条目放到开头', value: 'unshift' },
            ]"
        /></label>
      </div>
    </section>
    <section class="demo-control-section">
      <h3>交互行为</h3>
      <div class="demo-control-toggles">
        <HysCheckbox v-model="config.filterable" label="两侧搜索" /><HysCheckbox
          v-model="config.showSelectAll"
          label="显示全选"
        /><HysCheckbox
          v-model="config.showInvert"
          label="显示反选"
        /><HysCheckbox v-model="config.oneWay" label="单向模式" /><HysCheckbox
          v-model="config.draggable"
          label="允许拖拽"
        /><HysCheckbox v-model="config.animated" label="移动动画" /><HysCheckbox
          v-model="config.pagination"
          label="面板分页"
        /><HysCheckbox v-model="config.virtual" label="虚拟滚动" />
      </div>
    </section>
    <section class="demo-control-section">
      <h3>状态</h3>
      <div class="demo-control-toggles">
        <HysCheckbox v-model="config.disabled" label="禁用交互" /><HysCheckbox
          v-model="config.loading"
          label="加载中"
        />
      </div>
    </section>
  </div>
  <div class="demo-content">
    <HysTransfer v-model="value" v-bind="config" :options="options" />
  </div>
  <pre class="state-output">{{ JSON.stringify(config, null, 2) }}</pre>
</template>
