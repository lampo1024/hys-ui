<script setup lang="ts">
import { computed, ref } from "vue";
import { HysAnchor, HysCheckbox, type HysAnchorItem } from "hys-ui";
const container = ref<HTMLElement>();
const includeReview = ref(false);
const items = computed<HysAnchorItem[]>(() => {
  const children = [{ id: "guide-stock", label: "库存核对" }];
  if (includeReview.value) children.push({ id: "guide-review", label: "复核备注" });
  return [{ id: "guide-check", label: "交付检查", children }, { id: "guide-close", label: "结束归档" }];
});
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="includeReview">显示复核备注</HysCheckbox>
    <div class="demo-row" style="align-items: start">
      <HysAnchor :items="items" :container="container" collapsible sync-hash />
      <article ref="container" style="max-height: 155px; overflow: auto; flex: 1; min-width: 12rem">
        <section id="guide-check" style="min-height: 110px"><h3>交付检查</h3><p>核对交付清单及对应附件。</p></section>
        <section id="guide-stock" style="min-height: 110px"><h3>库存核对</h3><p>在入账前核对实际数量。</p></section>
        <section v-if="includeReview" id="guide-review" style="min-height: 110px"><h3>复核备注</h3><p>补充记录已复核的异常及处理结果。</p></section>
        <section id="guide-close"><h3>结束归档</h3><p>把签收凭证和检查记录归档。</p></section>
      </article>
    </div>
  </div>
</template>
