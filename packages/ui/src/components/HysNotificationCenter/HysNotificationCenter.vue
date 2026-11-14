<script setup lang="ts">
import { computed, ref } from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysSelect from "../HysSelect/HysSelect.vue";

export interface Notice {
  id: string;
  title: string;
  detail?: string;
  read?: boolean;
  time?: string;
  category?: string;
}
const props = defineProps<{
  items: Notice[];
  title?: string;
  emptyText?: string;
  disabled?: boolean;
  searchable?: boolean;
  dismissible?: boolean;
  categoryFilter?: boolean;
}>();
const emit = defineEmits<{
  read: [id: string];
  "read-all": [];
  open: [id: string];
  dismiss: [id: string];
  categoryChange: [category: string];
}>();
defineSlots<{
  notice?: (scope: { item: Notice }) => unknown;
  empty?: () => unknown;
}>();
const hysRootAttrs = useHysRootAttrs();
const filter = ref<"all" | "unread">("all");
const query = ref("");
const category = ref("");
const categories = computed(() => [
  ...new Set(
    props.items.flatMap((item) => (item.category ? [item.category] : [])),
  ),
]);
const categoryOptions = computed(() => [
  { value: "", label: "全部分类" },
  ...categories.value.map((name) => ({ value: name, label: name })),
]);
const activeCategory = computed(() =>
  props.categoryFilter && categories.value.includes(category.value)
    ? category.value
    : "",
);
function setCategory(value: string) {
  if (props.disabled) return;
  category.value = value;
  emit("categoryChange", activeCategory.value);
}
const unread = computed(() => props.items.filter((item) => !item.read).length);
const shown = computed(() => {
  const term = props.searchable ? query.value.trim().toLowerCase() : "";
  return props.items.filter(
    (item) =>
      (filter.value === "all" || !item.read) &&
      (!activeCategory.value || item.category === activeCategory.value) &&
      (!term ||
        [item.title, item.detail, item.category]
          .join(" ")
          .toLowerCase()
          .includes(term)),
  );
});
function openNotice(item: Notice) {
  if (props.disabled) return;
  emit("open", item.id);
  emit("read", item.id);
}
</script>

<template>
  <section v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <header class="hys-ui-ent-toolbar">
      <strong>{{ title || "通知中心" }} ({{ unread }})</strong>
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="disabled || !unread"
        @click="!disabled && unread && emit('read-all')"
      >
        全部已读
      </HysButton>
    </header>
    <div class="hys-ui-ent-toolbar">
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="disabled"
        :pressed="filter === 'all'"
        @click="!disabled && (filter = 'all')"
        >全部</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="disabled"
        :pressed="filter === 'unread'"
        @click="!disabled && (filter = 'unread')"
        >未读</HysButton
      >
      <div
        v-if="categoryFilter && categories.length"
        class="hys-notice-category"
      >
        分类
        <HysSelect
          size="sm"
          aria-label="通知分类"
          :model-value="activeCategory"
          :options="categoryOptions"
          :empty-values="[null, undefined]"
          :disabled="disabled"
          @update:model-value="setCategory"
        />
      </div>
    </div>
    <HysInput
      v-if="searchable"
      v-model="query"
      type="search"
      size="sm"
      clearable
      aria-label="搜索通知"
      placeholder="搜索标题、详情或分类"
      :disabled="disabled"
    />
    <ul v-if="shown.length" class="hys-ui-ent-notices">
      <li
        v-for="item in shown"
        :key="item.id"
        class="hys-notice-row"
        :class="{ 'hys-ui-unread': !item.read }"
      >
        <HysButton
          size="sm"
          variant="ghost"
          class="hys-notice-body"
          :disabled="disabled"
          @click="openNotice(item)"
        >
          <slot name="notice" :item="item">
            <strong>{{ item.title }}</strong>
            <span v-if="item.detail">{{ item.detail }}</span>
            <small v-if="item.time">{{ item.time }}</small>
          </slot>
        </HysButton>
        <HysButton
          size="sm"
          variant="ghost"
          v-if="dismissible"
          class="hys-notice-dismiss"
          :disabled="disabled"
          :aria-label="'移除 ' + item.title"
          @click="!disabled && emit('dismiss', item.id)"
        >
          移除
        </HysButton>
      </li>
    </ul>
    <div v-else class="hys-ui-ent-muted hys-notice-empty" role="status">
      <slot name="empty">{{
        emptyText ||
        (searchable && query.trim() ? "没有匹配的通知" : "暂无通知")
      }}</slot>
    </div>
  </section>
</template>

<style scoped>
.hys-notice-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 5px;
}
.hys-notice-row .hys-notice-body {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-notice-row .hys-notice-dismiss {
  width: auto;
  flex: none;
}
.hys-notice-empty {
  padding-block: 16px;
}
.hys-notice-category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hys-notice-category :deep(.hys-ui-select-wrap) {
  inline-size: 120px;
}
.hys-ui-ent-panel :deep(.hys-ui-input) {
  border: 0;
  padding: 0;
}
</style>
