<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysButton } from "hys-ui";
import type { HysTransferInstance } from "hys-ui";
const value = ref(Array.from({ length: 18 }, (_, i) => "member-" + (i + 30))),
  api = ref<HysTransferInstance>(),
  event = ref("");
const options = Array.from({ length: 60 }, (_, i) => ({
  value: "member-" + i,
  label: "成员 " + String(i + 1).padStart(2, "0"),
  disabled: i % 17 === 0,
}));
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      ref="api"
      v-model="value"
      :options="options"
      :pagination="{
        pageSize: 8,
        showSizeChanger: true,
        pageSizeOptions: [5, 8, 15],
      }"
      show-invert
      :list-height="250"
      @page-change="
        (side, page) =>
          (event =
            (side === 'left' ? '待选' : '已选') + '面板：第 ' + page + ' 页')
      "
    />
    <div class="demo-row">
      <HysButton
        variant="secondary"
        size="sm"
        @click="api?.checkAll('left', true, 'filtered')"
        >勾选全部待选结果</HysButton
      ><HysButton variant="secondary" size="sm" @click="api?.clearChecked()"
        >清除勾选</HysButton
      >
    </div>
  </div>
  <output>{{ event || "两侧面板分别分页，跨页保留勾选状态" }}</output>
  <p class="hint">
    表头全选、反选只作用于当前页。搜索将对应面板回到第一页；页大小和页码可通过
    pageSizes、pages 分别控制。
  </p>
</template>
