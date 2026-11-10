<script setup lang="ts">
import { ref } from "vue";
import {
  HysBreadcrumb,
  HysSelect,
  HysNumberInput,
  type HysPopupTransition,
} from "hys-ui";
const effect = ref<HysPopupTransition>("scale"),
  duration = ref(160),
  effects = ["scale", "fade", "slide", "slide-fade", "none"].map((value) => ({
    label: value,
    value,
  })),
  items = [
    { label: "首页", href: "#home" },
    {
      label: "组件",
      children: [
        { label: "基础组件", href: "#basic" },
        { label: "表单组件", href: "#form" },
      ],
    },
    { label: "面包屑" },
  ];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>菜单动效</span
          ><HysSelect v-model="effect" :options="effects" /></label
        ><label class="demo-field"
          ><span>时长（毫秒）</span
          ><HysNumberInput v-model="duration" :min="0" :max="1000" :step="40"
        /></label>
      </div>
    </div>
    <HysBreadcrumb
      :items="items"
      :popup-transition="effect"
      :popup-transition-duration="duration"
    />
    <p class="scenario-note">
      同级菜单和折叠菜单使用统一动画配置，遵循全局动效与系统减少动态效果设置。
    </p>
  </div>
</template>
