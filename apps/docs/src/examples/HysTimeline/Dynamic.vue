<script setup lang="ts">
import { ref } from "vue";
import {
  HysTimeline,
  HysInput,
  HysButton,
  HysCheckbox,
  type HysTimelineItem,
} from "hys-ui";
const items = ref<(HysTimelineItem & { note: string })[]>([
    { id: 0, title: "第一条记录", note: "" },
    { id: 1, title: "第二条记录", note: "" },
  ]),
  reverse = ref(false);
let sequence = 2;
function add() {
  items.value.push({ id: sequence, title: "新增记录 " + ++sequence, note: "" });
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="reverse" label="反转顺序" /><HysButton @click="add"
        >追加记录</HysButton
      ><HysButton :disabled="!items.length" @click="items.pop()"
        >移除最后一条</HysButton
      ><HysButton
        variant="ghost"
        @click="items = items.map((item) => ({ ...item }))"
        >替换为数据副本</HysButton
      >
    </div>
    <HysTimeline :items="items" :reverse="reverse" aria-label="动态时间线"
      ><template #item="{ item, index, sourceIndex }"
        ><div class="demo-stack">
          <strong>{{ item.title }}</strong
          ><HysInput
            v-model="item.note"
            :aria-label="item.title + ' 备注'"
            placeholder="为当前记录填写备注"
          /><small class="scenario-note"
            >展示位置 {{ index + 1 }} · 原始位置 {{ sourceIndex + 1 }}</small
          >
        </div></template
      ></HysTimeline
    >
    <p class="scenario-note">
      使用唯一稳定的 id / key，或设置
      itemKey。反转或替换同标识的数据时，已有子组件不会因展示位置变化而串位。
    </p>
  </div>
</template>
