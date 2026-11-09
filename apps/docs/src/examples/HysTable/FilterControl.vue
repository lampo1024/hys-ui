<script setup lang="ts">
import { ref } from "vue";
import { Search } from "lucide-vue-next";
import {
  HysTable,
  HysButton,
  HysInput,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";
type Member = { id: number; name: string; team: string };
const table = ref<HysTableInstance<Member>>(),
  key = ref<string | null>(null);
const rows: Member[] = [
  { id: 1, name: "张工", team: "产品组" },
  { id: 2, name: "李工", team: "研发组" },
  { id: 3, name: "陈工", team: "研发组" },
];
const columns: HysTableColumn<Member>[] = [
  { key: "name", label: "姓名", filterable: true },
  { key: "team", label: "团队", filterable: true },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="table?.showFilter('name')"
        >打开姓名筛选</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        :disabled="!key"
        @click="table?.hideFilter()"
        >关闭面板</HysButton
      >
    </div>
    <div class="demo-content">
      <HysTable
        ref="table"
        v-model:filter-column-key="key"
        :rows="rows"
        :columns="columns"
        filter-placement="bottom-start"
        ><template #filter-icon="{ filtered }"
          ><Search
            :size="14"
            :style="{ opacity: filtered ? 1 : 0.55 }" /></template
        ><template
          #filter-dropdown="{
            column,
            values,
            setValues,
            confirm,
            clear,
            close,
          }"
          ><strong>{{ column.label }}筛选</strong
          ><HysInput
            :model-value="String(values[0] ?? '')"
            :aria-label="column.label + '关键词'"
            size="sm"
            clearable
            @update:model-value="setValues($event ? [$event] : [])"
            @keydown.enter.prevent="confirm({ closeDropdown: false })"
          />
          <div class="demo-control-actions">
            <HysButton
              size="sm"
              variant="secondary"
              @click="clear({ confirm: false })"
              >清空草稿</HysButton
            ><HysButton size="sm" @click="confirm({ closeDropdown: false })"
              >应用</HysButton
            ><HysButton size="sm" variant="ghost" @click="close()"
              >完成</HysButton
            >
          </div></template
        ></HysTable
      >
    </div>
    <output class="state-output">当前筛选面板：{{ key || "未打开" }}</output>
    <p class="scenario-note">
      应用后保留面板便于连续筛选；清空草稿不会提前修改结果。filterColumnKey
      控制唯一打开的列，appendFilterTo 可设置浮层挂载容器。
    </p>
  </div>
</template>
