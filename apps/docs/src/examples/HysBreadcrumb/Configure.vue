<script setup lang="ts">
import { reactive } from "vue";
import { ChevronRight } from "lucide-vue-next";
import { HysBreadcrumb, HysInput, HysCheckbox } from "hys-ui";
const config = reactive({ separator: "/", icon: false });
const items = [
  { label: "组件文档", href: "#docs" },
  { label: "导航组件", href: "#navigation" },
  { label: "面包屑" },
];
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>分隔符</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span class="demo-control-label"
              >分隔文本 <code>separator</code></span
            ><HysInput v-model="config.separator"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>外观</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.icon" label="使用线性图标" /><small
              >separatorIcon</small
            >
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysBreadcrumb
        :items="items"
        :separator="config.separator"
        :separator-icon="config.icon ? ChevronRight : undefined"
      />
    </div>
  </div>
</template>
