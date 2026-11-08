<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysButton, HysForm, HysFormItem, HysInput, HysSelect } from "hys-ui";
const model = reactive({ keyword: "", status: "all" }),
  result = ref("填写条件后查询");
</script>
<template>
  <div class="demo-content">
    <HysForm
      :model="model"
      layout="inline"
      label-position="top"
      size="sm"
      @submit="(values) => (result = '查询条件：' + JSON.stringify(values))"
      @reset="result = '已重置查询条件'"
    >
      <HysFormItem label="关键词" prop="keyword"
        ><HysInput v-model="model.keyword" placeholder="按名称搜索" clearable
      /></HysFormItem>
      <HysFormItem label="状态" prop="status"
        ><HysSelect
          v-model="model.status"
          :options="[
            { label: '全部状态', value: 'all' },
            { label: '进行中', value: 'active' },
            { label: '已完成', value: 'done' },
          ]"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">查询</HysButton
        ><HysButton type="reset" variant="secondary">重置</HysButton></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ result }}</output>
    <p class="scenario-note">
      行内表单适合紧凑的筛选区域。空间不足时字段和操作区自动换行；输入框中按
      Enter 可提交。
    </p>
  </div>
</template>
