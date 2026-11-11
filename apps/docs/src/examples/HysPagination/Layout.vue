<script setup lang="ts">
import { HysPagination } from 'hys-ui'
</script>

<template>
  <div class="demo-content">
    <div>
      <p class="scenario-note">使用初始页码和页大小后，分页器会自行维护状态。总数在左侧，翻页和跳转在右侧。</p>
      <HysPagination
        :total="240"
        :default-page="3"
        :default-page-size="20"
        layout="total, ->, prev, pager, next, sizes, jumper"
        :labels="{ navigation: '任务列表分页', jump: '页码' }"
      >
        <template #total="{ total, start, end }">任务 {{ start }}–{{ end }} / {{ total }}</template>
        <template #item="{ type, page }">
          {{ type === 'prev' ? '上一页' : type === 'next' ? '下一页' : page }}
        </template>
        <template #jump-button>前往</template>
      </HysPagination>
    </div>
    <div>
      <p class="scenario-note">只有总页数时可传入 pageCount。这里使用小尺寸，并在窄容器中保留页码。</p>
      <HysPagination
        :page-count="12"
        :default-page="5"
        :sibling-count="0"
        layout="prev, pager, next"
        size="sm"
        :responsive="false"
      />
    </div>
  </div>
</template>
