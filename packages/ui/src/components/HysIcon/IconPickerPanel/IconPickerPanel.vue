<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Star,
  Upload,
} from "lucide-vue-next";
import IconReferenceGraphic from "../IconReferenceGraphic/IconReferenceGraphic.vue";
import HysAccordion from "../../HysAccordion/HysAccordion.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import HysUpload from "../../HysUpload/HysUpload.vue";
import { importHysIconSvg, serializeHysIconSvg } from "../iconSafety";
import type {
  HysIconEntry,
  HysIconPickerLocale,
  HysIconRecord,
  HysIconRegistry,
} from "../iconTypes";
import { useIconResource } from "../useIconResource";

const props = defineProps<{
  name?: string;
  registry: HysIconRegistry;
  variant?: string;
  allowUpload?: boolean;
  storageKey?: string;
  allowedOrigins?: readonly string[];
  locale?: Partial<HysIconPickerLocale>;
}>();
const emit = defineEmits<{ select: [name: string] }>();
const locale = computed<HysIconPickerLocale>(() => ({
  search: "搜索名称或关键词",
  library: "图标库",
  category: "分类",
  variant: "风格",
  all: "全部",
  favorites: "收藏",
  recent: "最近使用",
  popular: "常用",
  empty: "没有符合条件的图标",
  previous: "上一页",
  next: "下一页",
  addFavorite: "收藏图标",
  removeFavorite: "取消收藏",
  copyName: "复制名称",
  copyCode: "复制组件代码",
  copySvg: "复制 SVG",
  copied: "已复制",
  copyFailed: "无法复制，请检查浏览器剪贴板权限",
  upload: "导入 SVG",
  imported: (count) => "已导入 " + count + " 个图标",
  ...props.locale,
}));
const root = ref<HTMLElement>();
const query = ref(""),
  library = ref(""),
  category = ref(""),
  variant = ref(""),
  page = ref(1),
  focusIndex = ref(0);
const view = ref<"all" | "popular" | "favorites" | "recent">("all");
const favorites = ref<string[]>([]),
  recent = ref<string[]>([]),
  feedback = ref("");
const pageSize = ref(42);
let observer: ResizeObserver | undefined;
const popular = [
  "core:search",
  "core:plus",
  "core:check",
  "core:close",
  "core:arrow-right",
  "core:folder",
  "core:settings",
  "core:star",
  "core:refresh",
  "core:download",
];
let active = false;
const all = computed(() => {
  void props.registry.revision.value;
  return props.registry.list();
});
const namespaces = computed(() => [
  ...new Set(all.value.map((record) => record.namespace)),
]);
const categories = computed(() => [
  ...new Set(all.value.map((record) => record.category)),
]);
const variants = computed(() => [
  ...new Set(all.value.flatMap((record) => [...record.variants])),
]);
const filterOptions = (values: readonly string[], empty = locale.value.all) => [
  { value: "", label: empty },
  ...values.map((value) => ({ value, label: value })),
];
const results = computed(() => {
  void props.registry.revision.value;
  const matches = props.registry.search(query.value, {
    namespace: library.value,
    category: category.value,
    variant: variant.value,
  });
  if (view.value === "all") return matches;
  const names =
    view.value === "popular"
      ? popular
      : view.value === "favorites"
        ? favorites.value
        : recent.value;
  const indexed = new Map(matches.map((record) => [record.name, record]));
  return names
    .map((name) => indexed.get(name))
    .filter((record) => record !== undefined);
});
const pages = computed(() =>
  Math.max(1, Math.ceil(results.value.length / pageSize.value)),
);
const visible = computed(() =>
  results.value.slice(
    (page.value - 1) * pageSize.value,
    page.value * pageSize.value,
  ),
);
const selected = computed(() => {
  void props.registry.revision.value;
  return props.name ? props.registry.resolve(props.name) : undefined;
});
const chosenVariant = ref("");
const selectedVariant = computed(
  () => chosenVariant.value || variant.value || props.variant || "outline",
);
const preview = useIconResource({
  reference: () => selected.value?.name,
  registry: () => props.registry,
  variant: () => selectedVariant.value,
  allowedOrigins: () => props.allowedOrigins,
});
const svg = computed(() =>
  preview.source.value?.type === "svg"
    ? serializeHysIconSvg(preview.source.value)
    : undefined,
);
watch([query, library, category, variant, view], () => {
  page.value = 1;
  focusIndex.value = 0;
});
watch(pages, (value) => {
  if (page.value > value) page.value = value;
});
watch(selected, () => {
  chosenVariant.value = "";
});
watch(page, () => {
  focusIndex.value = 0;
});
watch(
  pageSize,
  (size, previous) => {
    page.value = Math.floor(((page.value - 1) * previous) / size) + 1;
    focusIndex.value = 0;
  },
  { flush: "sync" },
);

function choose(record: HysIconRecord, index: number) {
  focusIndex.value = index;
  recent.value = [
    record.name,
    ...recent.value.filter((name) => name !== record.name),
  ].slice(0, 32);
  emit("select", record.name);
}
function toggleFavorite(name: string) {
  favorites.value = favorites.value.includes(name)
    ? favorites.value.filter((item) => item !== name)
    : [...favorites.value, name].slice(-150);
}
function keyboard(event: KeyboardEvent) {
  if (
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key) ||
    !visible.value.length
  )
    return;
  const grid = event.currentTarget as HTMLElement;
  const columns =
    getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length || 1;
  const rtl = getComputedStyle(grid).direction === "rtl";
  const step: Record<string, number> = {
    ArrowLeft: rtl ? 1 : -1,
    ArrowRight: rtl ? -1 : 1,
    ArrowUp: -columns,
    ArrowDown: columns,
  };
  const position =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? visible.value.length - 1
        : focusIndex.value + (step[event.key] ?? 0);
  focusIndex.value = Math.min(visible.value.length - 1, Math.max(0, position));
  event.preventDefault();
  void nextTick(() =>
    grid
      .querySelectorAll<HTMLButtonElement>(".hys-icon-picker-tile")
      [focusIndex.value]?.focus(),
  );
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    feedback.value = locale.value.copied;
  } catch {
    feedback.value = locale.value.copyFailed;
  }
}
function copyCode() {
  if (selected.value)
    void copy(
      '<HysIcon name="' +
        selected.value.name +
        '" variant="' +
        selectedVariant.value.replace(/[^\w-]/g, "") +
        '" />',
    );
}
function readStorage() {
  favorites.value = [];
  recent.value = [];
  if (!active || !props.storageKey) return;
  try {
    const saved = JSON.parse(localStorage.getItem(props.storageKey) ?? "{}");
    const names = (value: unknown, max: number) =>
      Array.isArray(value)
        ? value.filter((item) => typeof item === "string").slice(0, max)
        : [];
    favorites.value = names(saved.favorites, 150);
    recent.value = names(saved.recent, 32);
  } catch {
    /* Storage can be unavailable in embedded documents. */
  }
}
watch([favorites, recent], () => {
  if (!active || !props.storageKey) return;
  try {
    localStorage.setItem(
      props.storageKey,
      JSON.stringify({ favorites: favorites.value, recent: recent.value }),
    );
  } catch {
    /* Keep the in-memory list if persistence fails. */
  }
});
watch(() => props.storageKey, readStorage);
async function upload(selectedFiles: File[]) {
  const files = selectedFiles.slice(0, 32);
  const parsed: { base: string; entry: HysIconEntry }[] = [];
  let failed = 0;
  for (const file of files) {
    try {
      if (file.size > 250000) throw new Error("SVG is too large");
      const base =
        file.name
          .replace(/\.svg$/i, "")
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "-")
          .replace(/^[^a-z0-9]+/, "")
          .slice(0, 80) || "icon";
      parsed.push({
        base,
        entry: {
          source: importHysIconSvg(await file.text()),
          label: file.name,
          category: "导入",
        },
      });
    } catch {
      failed++;
    }
  }
  if (!active) return;
  const icons: Record<string, HysIconEntry> = Object.create(null);
  for (const { base, entry } of parsed) {
    let name = base,
      suffix = 2;
    while (icons[name] || props.registry.resolve("uploads:" + name))
      name = base + "-" + suffix++;
    icons[name] = entry;
  }
  const count = parsed.length;
  if (count) {
    props.registry.register({
      namespace: "uploads",
      icons,
      version: new Date().toISOString(),
    });
    query.value = category.value = variant.value = "";
    view.value = "all";
    library.value = "uploads";
  }
  feedback.value =
    locale.value.imported(count) +
    (failed ? "，" + failed + " 个文件无法导入" : "");
}
onMounted(() => {
  active = true;
  readStorage();
  const element = root.value;
  if (element) {
    const resize = (width: number) => {
      pageSize.value = width < 460 ? 9 : 42;
    };
    resize(element.clientWidth);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(([entry]) =>
        resize(entry.contentRect.width),
      );
      observer.observe(element);
    }
  }
});
onBeforeUnmount(() => {
  active = false;
  observer?.disconnect();
});
</script>

<template>
  <div ref="root" class="hys-icon-picker">
    <div class="hys-icon-picker-filters">
      <HysInput
        v-model="query"
        class="hys-icon-picker-search"
        size="sm"
        type="search"
        :prefix-icon="Search"
        :aria-label="locale.search"
        :placeholder="locale.search"
      />
      <div class="hys-icon-picker-field">
        <span>{{ locale.library }}</span>
        <HysSelect
          v-model="library"
          size="sm"
          :aria-label="locale.library"
          :options="filterOptions(namespaces)"
          :empty-values="[null, undefined]"
        />
      </div>
      <div class="hys-icon-picker-field">
        <span>{{ locale.category }}</span>
        <HysSelect
          v-model="category"
          size="sm"
          :aria-label="locale.category"
          :options="filterOptions(categories)"
          :empty-values="[null, undefined]"
        />
      </div>
      <div class="hys-icon-picker-field">
        <span>{{ locale.variant }}</span>
        <HysSelect
          v-model="variant"
          size="sm"
          :aria-label="locale.variant"
          :options="filterOptions(variants)"
          :empty-values="[null, undefined]"
        />
      </div>
    </div>
    <div class="hys-icon-picker-toolbar">
      <HysButton
        v-for="item in ['all', 'popular', 'favorites', 'recent'] as const"
        :key="item"
        size="sm"
        variant="secondary"
        :pressed="view === item"
        @click="view = item"
      >
        {{ locale[item] }}
      </HysButton>
      <HysUpload
        v-if="allowUpload"
        class="hys-icon-picker-upload"
        accept=".svg,image/svg+xml"
        multiple
        :show-file-list="false"
        @select="upload"
      >
        <template #trigger="{ open }">
          <HysButton
            size="sm"
            variant="secondary"
            :icon="Upload"
            @click="open"
            >{{ locale.upload }}</HysButton
          >
        </template>
      </HysUpload>
    </div>
    <div class="hys-icon-picker-main">
      <div>
        <div
          v-if="visible.length"
          class="hys-icon-picker-grid"
          role="listbox"
          :aria-label="locale.library"
          @keydown="keyboard"
        >
          <HysButton
            size="sm"
            variant="secondary"
            v-for="(record, index) in visible"
            :key="record.name"
            class="hys-icon-picker-tile"
            role="option"
            :tabindex="index === focusIndex ? 0 : -1"
            :aria-selected="selected?.name === record.name"
            :aria-label="record.label + ' ' + record.name"
            :title="record.name"
            @focus="focusIndex = index"
            @click="choose(record, index)"
          >
            <span class="hys-icon-picker-glyph"
              ><IconReferenceGraphic
                :icon="record.name"
                :registry="registry"
                :variant="variant || props.variant"
                :allowed-origins="allowedOrigins"
            /></span>
            <span class="hys-icon-picker-label">{{ record.label }}</span>
          </HysButton>
        </div>
        <p v-else class="hys-icon-picker-empty">{{ locale.empty }}</p>
        <nav
          v-if="pages > 1"
          class="hys-icon-picker-pages"
          aria-label="图标分页"
        >
          <HysButton
            size="sm"
            variant="secondary"
            :aria-label="locale.previous"
            :disabled="page === 1"
            @click="page--"
          >
            <ChevronLeft :size="16" />
          </HysButton>
          <span>{{ page }} / {{ pages }}</span>
          <HysButton
            size="sm"
            variant="secondary"
            :aria-label="locale.next"
            :disabled="page === pages"
            @click="page++"
          >
            <ChevronRight :size="16" />
          </HysButton>
        </nav>
      </div>
      <aside v-if="selected" class="hys-icon-picker-detail">
        <div class="hys-icon-picker-preview">
          <span class="hys-icon-picker-large"
            ><IconReferenceGraphic
              :icon="selected.name"
              :registry="registry"
              :variant="selectedVariant"
              :allowed-origins="allowedOrigins"
          /></span>
          <HysButton
            size="sm"
            variant="secondary"
            :aria-label="
              favorites.includes(selected.name)
                ? locale.removeFavorite
                : locale.addFavorite
            "
            :aria-pressed="favorites.includes(selected.name)"
            @click="toggleFavorite(selected.name)"
          >
            <Star :size="16" />
          </HysButton>
        </div>
        <strong>{{ selected.label }}</strong>
        <code>{{ selected.name }}</code>
        <small v-if="selected.version"
          >{{ selected.namespace }} · {{ selected.version }}</small
        >
        <div v-if="selected.variants.length > 1" class="hys-icon-picker-field">
          <span>{{ locale.variant }}</span>
          <HysSelect
            v-model="chosenVariant"
            size="sm"
            :aria-label="locale.variant"
            :options="filterOptions(selected.variants, selectedVariant)"
            :empty-values="[null, undefined]"
          />
        </div>
        <div class="hys-icon-picker-actions">
          <HysButton size="sm" variant="secondary" @click="copy(selected.name)">
            <Copy :size="13" />{{ locale.copyName }}
          </HysButton>
          <HysButton size="sm" variant="secondary" @click="copyCode">{{
            locale.copyCode
          }}</HysButton>
          <HysButton
            size="sm"
            variant="secondary"
            v-if="svg"
            @click="copy(svg)"
          >
            {{ locale.copySvg }}
          </HysButton>
        </div>
        <HysAccordion v-if="svg" size="sm" :items="[{ title: 'SVG' }]">
          <template #content>
            <pre class="hys-ui-scrollbar">{{ svg }}</pre>
          </template>
        </HysAccordion>
      </aside>
    </div>
    <output
      v-if="feedback"
      class="hys-icon-picker-feedback"
      aria-live="polite"
      >{{ feedback }}</output
    >
  </div>
</template>

<style scoped src="./iconPicker.css"></style>
