<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import HysPopover from "../../HysPopover/HysPopover.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysButton from "../../HysButton/HysButton.vue";
import type { HysInputInstance } from "../../../composables/textInput";
import TabsSlot from "../TabsSlot/TabsSlot";
import type {
  HysTabItem,
  HysTabsMenuScope,
  HysTabsSlots,
  HysTabValue,
} from "../tabsTypes";
const props = defineProps<{
  items: readonly HysTabItem[];
  overflow: readonly HysTabValue[];
  recent: readonly HysTabValue[];
  active: HysTabValue;
  disabled?: boolean;
  search?: boolean;
  slots: HysTabsSlots;
  select: (value: HysTabValue) => Promise<boolean>;
}>();
const open = ref(false),
  query = ref(""),
  searchBox = ref<HysInputInstance>();
const filter = ref<"all" | "recent" | "favorite">("all");
const clipped = computed(() => {
  const keys = new Set(props.overflow);
  return props.items.filter((item) => keys.has(item.value));
});
const matching = computed(() => {
  let choices = props.items;
  if (filter.value === "favorite")
    choices = choices.filter((item) => item.favorite);
  if (filter.value === "recent") {
    const byKey = new Map(choices.map((item) => [item.value, item]));
    choices = props.recent.flatMap((key) => byKey.get(key) ?? []);
  }
  const text = query.value.trim().toLocaleLowerCase();
  return text
    ? choices.filter((item) => item.label.toLocaleLowerCase().includes(text))
    : choices;
});
async function choose(value: HysTabValue) {
  const accepted = await props.select(value);
  if (accepted) open.value = false;
  return accepted;
}
watch(open, (value) => {
  if (!value) {
    query.value = "";
    filter.value = "all";
  }
});
const scope = computed<HysTabsMenuScope>(() => ({
  items: props.items,
  overflowed: clipped.value,
  active: props.active,
  select: choose,
  close: () => {
    open.value = false;
  },
}));
</script>

<template>
  <HysPopover
    v-model:open="open"
    placement="bottom-end"
    :width="248"
    :max-height="360"
    aria-label="更多页签"
    :disabled="disabled"
    @opened="searchBox?.focus({ preventScroll: true })"
  >
    <template #trigger>
      <HysButton
        size="sm"
        variant="ghost"
        class="hys-ui-tab-control hys-tab-more"
        aria-label="更多页签"
        :disabled="disabled"
      >
        <TabsSlot :render="slots['more-icon']"
          ><ChevronDown :size="16" aria-hidden="true"
        /></TabsSlot>
      </HysButton>
    </template>
    <TabsSlot :render="slots.more" :scope="scope">
      <div class="hys-tab-more-panel">
        <HysInput
          v-if="search !== false"
          ref="searchBox"
          v-model="query"
          type="search"
          size="sm"
          aria-label="搜索页签"
          placeholder="搜索页签"
        />
        <div class="hys-tab-more-filters">
          <HysButton
            size="sm"
            variant="ghost"
            v-for="[key, label] in [
              ['all', '全部'],
              ['recent', '最近'],
              ['favorite', '收藏'],
            ] as const"
            :key="key"
            :pressed="filter === key"
            @click="filter = key"
          >
            {{ label }}
          </HysButton>
        </div>
        <div class="hys-tab-more-list hys-ui-scrollbar">
          <HysButton
            size="sm"
            variant="ghost"
            v-for="item in matching"
            :key="item.value"
            :disabled="item.disabled"
            :aria-current="item.value === active ? 'true' : undefined"
            @click="choose(item.value)"
          >
            <span>{{ item.label }}</span
            ><small v-if="item.value === active">当前</small>
          </HysButton>
          <p v-if="!matching.length">没有符合条件的页签</p>
        </div>
      </div>
    </TabsSlot>
  </HysPopover>
</template>

<style scoped>
.hys-tab-more-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
}
.hys-tab-more-filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.hys-tab-more-panel button {
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  padding: 5px 8px;
  text-align: start;
  cursor: pointer;
  font: inherit;
}
.hys-tab-more-panel button:is(:hover, [aria-current], [aria-pressed="true"]) {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-tab-more-panel button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-tab-more-list {
  display: grid;
  gap: 2px;
  max-block-size: 220px;
  overflow: auto;
}
.hys-tab-more-list button {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
}
.hys-tab-more-list button span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-tab-more-list small {
  flex: none;
  font-size: 11px;
}
.hys-tab-more-list p {
  margin: 4px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
</style>
