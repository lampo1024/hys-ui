<script setup lang="ts">
import { ref } from 'vue'
import { HysButton, HysCheckbox, HysPagination } from 'hys-ui'

const page = ref(10)
const pageSize = ref(10)
const acceptPageSize = ref(false)
const total = ref(100)

function updatePageSize(size: number) {
  if (acceptPageSize.value) pageSize.value = size
}

function reset() {
  total.value = 100
  pageSize.value = 10
  page.value = 10
}
</script>

<template>
  <div class="demo-content">
    <p class="scenario-note">在第 10 页尝试切换到每页 50 条。开启「允许修改每页条数」后再选择，页码会随生效后的页数调整。</p>
    <div class="demo-row">
      <HysCheckbox v-model="acceptPageSize" label="允许修改每页条数" />
      <HysButton variant="secondary" size="sm" @click="total = 5">只保留 5 条</HysButton>
      <HysButton variant="secondary" size="sm" @click="reset">恢复最后一页</HysButton>
    </div>
    <HysPagination
      v-model:page="page"
      :page-size="pageSize"
      :page-size-options="[10, 20, 50]"
      :total="total"
      show-size-changer
      hide-on-single-page
      @update:page-size="updatePageSize"
    />
    <output class="state-output">第 {{ page }} 页 · 每页 {{ pageSize }} 条 · 共 {{ total }} 条</output>
  </div>
</template>
