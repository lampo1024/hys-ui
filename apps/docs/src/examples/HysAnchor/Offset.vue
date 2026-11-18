<script setup lang="ts">
import { ref } from "vue";
import { HysAnchor, HysInput, HysScrollbar } from "hys-ui";
const offset = ref("36");
const training = ref<InstanceType<typeof HysScrollbar>>();
const sections = [{ id:"training-plan", label:"培训安排" }, { id:"training-qa", label:"问答记录" }];
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="offset" aria-label="目录滚动偏移量" />
    <HysAnchor :items="sections" :container="training?.viewport ?? undefined" :offset="Number(offset) || 0" :smooth="false" />
    <HysScrollbar ref="training" :height="160" :tabindex="0" aria-label="培训资料" :view-style="{ paddingInline: '12px' }">
      <strong style="position: sticky; top: 0; display: block; padding-block: 7px; background: var(--hys-ui-theme-surface)">培训资料</strong>
      <section id="training-plan" style="min-height: 190px"><h3>培训安排</h3><p>本周确认新人设备并完成权限开通。</p></section>
      <section id="training-qa" style="min-height: 190px"><h3>问答记录</h3><p>集中维护各小组遇到的接入问题。</p></section>
    </HysScrollbar>
  </div>
</template>
