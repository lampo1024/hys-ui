<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysMention,
  type HysMentionEntity,
  type HysMentionInstance,
} from "hys-ui";

const editor = ref<HysMentionInstance>();
const text = ref("");
const entities = ref<HysMentionEntity[]>([]);
const rich = ref(true);
const available = ref(true);
const serialized = ref("");
const member = {
  id: "zhang",
  value: "张三",
  label: "张三",
  type: "member",
  payload: { team: "研发" },
};
const options = [
  member,
  { id: "li", value: "李娜", label: "李娜", type: "member" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="rich">富文本节点</HysCheckbox>
      <HysCheckbox v-model="available">张三仍可选</HysCheckbox>
      <HysButton
        size="sm"
        variant="secondary"
        @click="editor?.insertMention(member)"
        >插入张三</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        @click="editor?.removeMention('zhang')"
        >删除张三</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="editor?.undo()"
        >撤销</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        @click="serialized = editor?.serialize() ?? ''"
        >序列化</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="!serialized"
        @click="editor?.setDocument(serialized)"
        >恢复文档</HysButton
      >
    </div>
    <HysMention
      ref="editor"
      v-model="text"
      v-model:entities="entities"
      :type="rich ? 'rich' : 'textarea'"
      :options="options"
      :validate-entity="(entity) => available || entity.id !== 'zhang'"
      :can-select="(option) => available || option.id !== 'zhang'"
      :autosize="{ minRows: 2, maxRows: 5 }"
      highlight-mentions
      clearable
      show-count
      whole
      :maxlength="160"
      placeholder="输入普通文本，或用 @ 插入成员"
    />
    <pre class="state-output">{{
      JSON.stringify({ text, entities }, null, 2)
    }}</pre>
    <p class="scenario-note">
      富文本模式可双击提及重新选择。关闭成员权限后，现有提及会标为失效，候选不可再选。
    </p>
  </div>
</template>
