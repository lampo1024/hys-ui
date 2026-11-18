<script setup lang="ts">
import { ref } from "vue";
import { HysFloatButton } from "hys-ui";
const pane = ref<HTMLElement>();
const result = ref("");
const actions = [
  { key: "已阅", label: "标为已阅" },
  { key: "补证", label: "补充凭证" },
  { key: "转交", label: "转交复核" },
  { key: "归档", label: "归档记录" },
];
</script>

<template>
  <div class="demo-stack">
    <div style="position:relative; min-height:175px">
      <article ref="pane" aria-label="审阅记录" tabindex="0" style="height:175px; overflow:auto; padding:8px 12px">
        <p v-for="line in 12" :key="line">审阅记录 {{ line }} · 本次配送需要附带验收回执。</p>
      </article>
      <HysFloatButton label="审阅快捷操作" badge-dot contained :actions="actions" @action="result = String($event)" />
      <HysFloatButton label="回到审阅顶部" contained back-top :offset="12" :show-after="35" :container="pane" />
    </div>
    <p role="status">{{ result }}</p>
  </div>
</template>
