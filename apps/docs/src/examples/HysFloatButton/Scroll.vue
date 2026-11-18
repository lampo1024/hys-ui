<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysFloatButton, HysScrollbar } from "hys-ui";
const panel = ref<InstanceType<typeof HysScrollbar>>();
</script>

<template>
  <div class="demo-stack">
    <section style="position: relative">
      <HysScrollbar ref="panel" :tabindex="0" :height="185" aria-label="交付记录" :view-style="{ padding: '8px 14px' }">
        <HysButton variant="text" @click="panel?.scrollTo({ top: 400 })">查看后面的记录</HysButton>
        <p v-for="i in 25" :key="i">交付记录 {{ i }}</p>
      </HysScrollbar>
      <HysFloatButton contained back-top :container="panel?.viewport ?? undefined" />
    </section>
  </div>
</template>
