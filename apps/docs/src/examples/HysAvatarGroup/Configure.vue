<script setup lang="ts">
import { reactive } from "vue";
import {
  HysAvatarGroup,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  type HysAvatarOption,
} from "hys-ui";
const members: HysAvatarOption[] = [
  { name: "Alex" },
  { name: "Lisa", color: "#e9e4ff", textColor: "#7951c7" },
  { name: "Amy", color: "#d8f2e5", textColor: "#258963" },
  { name: "David", color: "#fff0df", textColor: "#c7650c" },
  { name: "王工" },
];
const config = reactive({
  size: 44,
  gap: -10,
  maxCount: 3,
  shape: "circle" as "circle" | "square",
  trigger: "hover" as "hover" | "focus" | "click",
  vertical: false,
  expandOnHover: false,
  bordered: true,
});
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>尺寸与排列</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>尺寸</span
            ><HysNumberInput
              v-model="config.size"
              :min="16"
              :max="100" /></label
          ><label class="demo-field"
            ><span>间距</span
            ><HysNumberInput v-model="config.gap" :min="-20" :max="30" /></label
          ><label class="demo-field"
            ><span>可见数量</span
            ><HysNumberInput
              v-model="config.maxCount"
              :min="0"
              :max="5" /></label
          ><label class="demo-field"
            ><span>形状</span
            ><HysSelect
              v-model="config.shape"
              :options="[
                { label: '圆形', value: 'circle' },
                { label: '方形', value: 'square' },
              ]" /></label
          ><label class="demo-field"
            ><span>折叠浮层触发</span
            ><HysSelect
              v-model="config.trigger"
              :options="
                ['hover', 'focus', 'click'].map((value) => ({
                  label: value,
                  value,
                }))
              "
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>交互</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.vertical" label="vertical" /><small
              >竖向排列</small
            >
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox
              v-model="config.expandOnHover"
              label="expandOnHover"
            /><small>悬停或聚焦时展开间距</small>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.bordered" label="bordered" /><small
              >统一头像描边</small
            >
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysAvatarGroup
        v-bind="config"
        :options="members"
        aria-label="交互头像组"
      />
    </div>
    <output class="state-output">{{ config }}</output>
  </div>
</template>
