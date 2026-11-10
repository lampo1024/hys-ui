<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysCheckbox, HysButton } from "hys-ui";
const value = ref(["b"]),
  checked = ref(["a", "d"]),
  animated = ref(true),
  group = ref(true),
  event = ref("");
const options = [
  { value: "a", label: "设计稿评审" },
  { value: "b", label: "接口联调" },
  { value: "c", label: "受保护任务", disabled: true },
  { value: "d", label: "自动化测试" },
  { value: "e", label: "上线检查" },
];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox v-model="animated" label="移动动画" /><HysCheckbox
        v-model="group"
        label="拖动已勾选的同侧条目"
      /><HysButton
        variant="secondary"
        size="sm"
        @click="
          value = ['b'];
          checked = ['a', 'd'];
          event = '';
        "
        >重置选择</HysButton
      >
    </div>
    <HysTransfer
      v-model="value"
      v-model:checked-keys="checked"
      :options="options"
      :animated="animated"
      :drag-checked="group"
      :filterable="false"
      @drag-start="(side, keys) => (event = '开始拖动 ' + keys.length + ' 项')"
      @change="
        (_value, side, moved) =>
          (event =
            (side === 'right' ? '已添加' : '已移除') +
            ' ' +
            moved.length +
            ' 项')
      "
    />
  </div>
  <output>{{ event || "勾选多项后，拖动其中一项到另一侧的面板" }}</output>
  <p class="hint">
    可接收的目标区域会高亮，松开鼠标后条目进入新列表。按 Esc
    取消拖拽；虚拟列表和较大列表只播放少量代表项目的跨区域动画。
  </p>
</template>
