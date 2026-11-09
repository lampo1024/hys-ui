<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysAvatar, HysBadge, HysButton, HysEmpty } from "hys-ui";
import type { HysTransferInstance } from "hys-ui";
interface Member {
  value: string;
  label: string;
  team: string;
  email: string;
}
const value = ref<string[]>([]),
  api = ref<HysTransferInstance<Member, string>>();
const options: Member[] = [
  { value: "alice", label: "林工", team: "产品设计", email: "lin@example.com" },
  { value: "bob", label: "周工", team: "前端研发", email: "zhou@example.com" },
  {
    value: "carol",
    label: "陈工",
    team: "质量保障",
    email: "chen@example.com",
  },
];
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      ref="api"
      v-model="value"
      :options="options"
      :titles="['团队成员', '协作成员']"
      :list-height="260"
      :format="
        (info) =>
          info.checked
            ? info.checked + ' 已勾选 / ' + info.total
            : info.total + ' 位成员'
      "
    >
      <template #option="{ option }"
        ><div class="member-option">
          <HysAvatar :name="option.label" :size="28" />
          <div class="member-info">
            <strong
              >{{ option.label }}
              <HysBadge size="sm" tone="gray">{{
                option.team
              }}</HysBadge></strong
            ><small>{{ option.email }}</small>
          </div>
        </div></template
      >
      <template #left-footer
        ><HysButton variant="ghost" size="sm" @click="api?.checkAll('left')"
          >勾选当前结果</HysButton
        ></template
      >
      <template #right-footer="{ filteredItems }"
        ><span class="hint-inline"
          >当前显示 {{ filteredItems.length }} 位协作成员</span
        ></template
      >
      <template #right-empty="{ query }"
        ><HysEmpty
          :title="query ? '没有匹配成员' : '还没有协作成员'"
          description=""
          :image-size="30"
      /></template>
    </HysTransfer>
  </div>
  <p class="hint">
    普通列表中的自定义内容可自然增高。使用虚拟滚动时，需要设置足够的
    itemHeight，使内容与固定行高一致。
  </p>
</template>
<style scoped>
.member-option {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-block: 2px;
  min-width: 0;
}
.member-info {
  min-width: 0;
  display: grid;
  gap: 5px;
}
.member-info strong {
  font-size: 12px;
  font-weight: 500;
}
.member-info small {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--docs-muted);
}
.hint-inline {
  font-size: 12px;
  color: var(--docs-muted);
}
</style>
