<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysContextMenu,
  HysSelect,
  HysCheckbox,
  HysButton,
  type HysContextMenuTrigger,
} from "hys-ui";
const config = reactive<{
  trigger: HysContextMenuTrigger;
  size: "sm" | "md" | "lg";
  disabled: boolean;
  hideOnClick: boolean;
  arrow: boolean;
}>({
  trigger: "click",
  size: "md",
  disabled: false,
  hideOnClick: true,
  arrow: false,
});
const selected = ref("尚未操作"),
  triggers = ["click", "hover", "focus", "contextmenu"].map((value) => ({
    label: value,
    value,
  })),
  sizes = ["sm", "md", "lg"].map((value) => ({ label: value, value }));
const items = [
  { label: "查看详情", value: "open" },
  { label: "复制名称", value: "copy" },
  { label: "归档", value: "archive", disabled: true },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>触发与外观</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>触发方式</span
            ><HysSelect v-model="config.trigger" :options="triggers" /></label
          ><label class="demo-field"
            ><span>尺寸</span><HysSelect v-model="config.size" :options="sizes"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <HysCheckbox v-model="config.disabled" label="禁用菜单" /><HysCheckbox
            v-model="config.hideOnClick"
            label="操作后关闭"
          /><HysCheckbox v-model="config.arrow" label="显示浮层箭头" />
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysContextMenu
        v-bind="config"
        :items="items"
        @select="selected = String($event)"
        ><HysButton>打开操作菜单</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">{{ selected }}</output>
    <p class="scenario-note">
      默认仍以右键触发。可同时传入多个触发方式；触摸设备不响应悬停。禁用会关闭浮层并取消待执行的延迟操作。
    </p>
  </div>
</template>
