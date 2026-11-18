<script setup lang="ts">
import { ref } from "vue";
import { HysAnchor, HysScrollbar } from "hys-ui";
const active = ref("");
const manual = ref<InstanceType<typeof HysScrollbar>>();
const links = [{ id: "anchor-check", label: "检查" , children: [{id: "anchor-check-orders", label: "订单核对"}] }, { id: "anchor-deliver", label: "交付" }];
</script>

<template>
  <div class="demo-stack">
    <HysAnchor v-model="active" :items="links" :container="manual?.viewport ?? undefined" :offset="8" />
    <HysScrollbar ref="manual" :height="170" :tabindex="0" :view-style="{ paddingInline: '12px' }" aria-label="交付手册">
        <section id="anchor-check" style="min-height: 210px"><h3>检查</h3><p>确认批次号和配送时间。</p></section>
        <section id="anchor-check-orders" style="min-height: 210px"><h3>订单核对</h3><p>使用订单清单比对实际件数。</p></section>
        <section id="anchor-deliver" style="min-height: 210px"><h3>交付</h3><p>上传签收信息后记录经办人。</p></section>
    </HysScrollbar>
  </div>
</template>
