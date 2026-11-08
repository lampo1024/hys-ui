<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysSelect } from "hys-ui";
const open = ref(false),
  value = ref("review"),
  query = ref(""),
  enabled = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>浮层与搜索状态</h3>
        <div class="demo-control-toggles">
          <HysCheckbox v-model="enabled" label="允许展开" />
        </div>
        <div class="demo-row">
          <HysButton size="sm" :disabled="!enabled" @click="open = true"
            >外部打开</HysButton
          ><HysButton size="sm" variant="secondary" @click="open = false"
            >外部关闭</HysButton
          ><HysButton size="sm" variant="ghost" @click="query = '发布'"
            >设置搜索词</HysButton
          >
        </div>
      </section>
    </div>
    <HysSelect
      v-model="value"
      :open="open && enabled"
      v-model:search-value="query"
      filterable
      :options="[
        { label: '需求评审', value: 'review' },
        { label: '技术实现', value: 'develop' },
        { label: '发布上线', value: 'release' },
      ]"
      placement="top-start"
      :popup-width="340"
      aria-label="受控状态选择"
      @update:open="open = enabled && $event"
      ><template #header><span>从上方展开的受控浮层</span></template
      ><template #footer="{ close }"
        ><HysButton variant="ghost" size="sm" @click="close()"
          >完成选择</HysButton
        ></template
      ></HysSelect
    ><output class="state-output"
      >浮层：{{ open && enabled ? "打开" : "关闭" }} · 搜索词：{{
        query || "无"
      }}</output
    >
    <p class="scenario-note">
      open 与 searchValue 均支持受控用法。外部可接受或拒绝展开请求；placement
      会在空间不足时自动调整。header、footer 可加入操作区域。
    </p>
  </div>
</template>
