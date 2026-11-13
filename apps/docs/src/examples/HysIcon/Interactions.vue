<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysIcon, type HysIconLayer } from "hys-ui";
const selected = ref(false),
  disabled = ref(false),
  readonly = ref(false),
  rtl = ref(false),
  count = ref(12),
  event = ref("等待操作");
const layers: HysIconLayer[] = [
  { icon: "check", color: "#118a64", size: "62%", x: "28%", y: "27%" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="disabled" label="禁用按钮" />
      <HysCheckbox v-model="readonly" label="只读" />
      <HysCheckbox v-model="rtl" label="RTL 排版" />
    </div>
    <div class="demo-panel icon-interactions" :dir="rtl ? 'rtl' : 'ltr'">
      <HysIcon
        name="star"
        size="lg"
        :padding="8"
        :variant="selected ? 'filled' : 'outline'"
        v-model:selected="selected"
        clickable
        :disabled="disabled"
        :readonly="readonly"
        label="收藏项目"
        tooltip="收藏项目"
        animation="bounce"
        animate-on="click"
        @click="event = selected ? '已收藏项目' : '已取消收藏'"
        @dblclick="event = '收到双击事件'"
      />
      <HysIcon
        name="arrow-right"
        size="lg"
        :padding="8"
        label="定位当前示例"
        href="#scene-interactions"
        tooltip="定位当前示例"
      />
      <HysIcon
        name="folder"
        size="xl"
        :layers="layers"
        label="已同步的文件夹"
      />
      <HysIcon
        name="user"
        size="lg"
        :padding="7"
        :badge="count"
        :badge-max="99"
        badge-position="top-end"
        :label="'成员通知 ' + count + ' 条'"
        clickable
        @click="count++"
      />
      <HysIcon
        name="info"
        size="md"
        :badge="true"
        badge-position="bottom-start"
        label="有新的信息"
      />
    </div>
    <output class="state-output">{{ event }}</output>
  </div>
</template>

<style scoped>
.icon-interactions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}
</style>
