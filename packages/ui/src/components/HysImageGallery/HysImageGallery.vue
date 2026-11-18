<script setup lang="ts">
import { computed, ref, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysActionBar from "../HysActionBar/HysActionBar.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import HysImageViewer, { type HysImageViewerItem, type HysImageViewerTransition } from "../HysImageViewer/HysImageViewer.vue";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";
import HysSortableList from "../HysSortableList/HysSortableList.vue";
import HysUpload from "../HysUpload/HysUpload.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import { ImageOff } from "../HysIcon/svgIcons";

type Key = string | number;
export interface HysGalleryImage extends HysImageViewerItem {
  key: Key;
  description?: string;
  sizeText?: string;
  /** 图片的可选分组标题。 */
  group?: string;
  /** 此图片在瀑布流中的宽高比。 */
  aspectRatio?: string;
  disabled?: boolean;
}
export interface HysImageGalleryProps {
  /** 当前图片数据及稳定键。 */
  items: readonly HysGalleryImage[];
  /** 网格或缩略图列表，默认 grid。 */
  layout?: "grid" | "list" | "masonry";
  /** 提供网格、列表和瀑布流切换入口，由调用方回写 layout。 */
  layoutSwitch?: boolean;
  /** 所有布局均可在同一分组内拖动排序。 */
  sortable?: boolean;
  /** 提供图片文件选择入口，上传由调用方完成。 */
  uploadable?: boolean;
  /** 多选时提供带确认的批量移除入口。 */
  removable?: boolean;
  /** 网格内卡片最小宽度（像素），默认 152。 */
  minWidth?: number;
  /** 缩略图宽高比，默认 4 / 3。 */
  aspectRatio?: string;
  /** 缩略图间距（像素），默认 12。 */
  gap?: number;
  /** 缩略图裁切方式，默认 cover。 */
  fit?: "cover" | "contain";
  /** 启用图片多选及本页全选。 */
  selectable?: boolean;
  /** 受控选中键，配合 v-model:selectedKeys。 */
  selectedKeys?: readonly Key[];
  /** 预览切换图片时的动效，fade 渐变、slide 滑动、zoom 推近、none 关闭。默认 slide。 */
  imageTransition?: HysImageViewerTransition;
  /** 预览到达首尾时循环切换，默认 true。 */
  loop?: boolean;
  /** 加载时显示骨架。 */
  loading?: boolean;
}
const props = withDefaults(defineProps<HysImageGalleryProps>(), {
  layout: "grid",
  minWidth: 152,
  aspectRatio: "4 / 3",
  gap: 12,
  fit: "cover",
  imageTransition: "slide",
  loop: true,
});
const emit = defineEmits<{
  /** 选择变化后发出全部选中键。 */
  "update:selectedKeys": [keys: Key[]];
  /** 打开预览时发出图片及其索引。 */
  preview: [image: HysGalleryImage, index: number];
  /** 在展示模式切换后请求更新布局。 */
  "update:layout": [layout: "grid" | "list" | "masonry"];
  /** 拖动后发出新的全部图片顺序。 */
  "update:items": [items: HysGalleryImage[]];
  /** 批量移除已确认，发出当前页可移除的键。 */
  remove: [keys: Key[]];
  /** 附件选择后发出 File 数组。 */
  upload: [files: File[]];
}>();
defineSlots<{
  /** 替换图片标题及说明。 */
  caption?: (scope: { image: HysGalleryImage }) => VNodeChild;
  /** 替换空图库提示。 */
  empty?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const local = ref<Key[]>([]);
const open = ref(false);
const index = ref(0);
const failures = ref(new Set<string>());
const selected = computed(() => props.selectedKeys ?? local.value);
const modes = [{ value: "grid", label: "网格" }, { value: "list", label: "列表" }, { value: "masonry", label: "瀑布流" }] as const;
const removeActions = [{ key: "remove", label: "删除选中图片", variant: "danger" }] as const;
const groups = computed(() => {
  const map = new Map<string, HysGalleryImage[]>();
  for (const image of props.items) {
    const label = image.group ?? "";
    const group = map.get(label);
    if (group) group.push(image);
    else map.set(label, [image]);
  }
  return [...map.entries()];
});
const itemDisabled = (item: HysGalleryImage) => !!item.disabled;
const itemLabel = (item: HysGalleryImage) => item.title || item.alt || String(item.key);
function reorder(label: string, items: HysGalleryImage[]) {
  let index = 0;
  emit("update:items", props.items.map(item => (item.group ?? "") === label ? items[index++] : item));
}
function showImage(item: HysGalleryImage) {
  const position = props.items.findIndex(image => image.key === item.key);
  if (position >= 0) show(position);
}
const available = computed(() => props.items.filter(item => !item.disabled).map(item => item.key));
const count = computed(() => available.value.filter(key => selected.value.includes(key)).length);
function commit(keys: Key[]) { local.value = keys; emit("update:selectedKeys", keys); }
function toggle(key: Key, checked: boolean) {
  if (!available.value.includes(key)) return;
  commit(checked ? [...new Set([...selected.value, key])] : selected.value.filter(item => item !== key));
}
function selectPage() { commit([...new Set([...selected.value, ...available.value])]); }
function clearPage() { commit(selected.value.filter(key => !available.value.includes(key))); }
function show(position: number) {
  index.value = position;
  open.value = true;
  emit("preview", props.items[position], position);
}
</script>
<template>
  <div
    v-bind="skin"
    class="hys-image-gallery"
    :class="'layout-' + layout"
    :aria-busy="loading || undefined"
    :style="{ '--gallery-gap': gap + 'px', '--gallery-min': minWidth + 'px' }"
  >
    <div v-if="uploadable || layoutSwitch" class="gallery-tools">
      <HysUpload v-if="uploadable" accept="image/*" multiple :auto-upload="false" :show-file-list="false" @select="emit('upload', $event)">
        <HysButton size="sm" variant="secondary">添加图片</HysButton>
      </HysUpload>
      <HysSegmented v-if="layoutSwitch" :model-value="layout" :options="modes" size="sm" aria-label="画廊布局" @update:model-value="emit('update:layout', $event)" />
    </div>
    <HysSkeleton v-if="loading" :lines="4" />
    <slot v-else-if="!items.length" name="empty"><HysEmpty description="暂无图片" /></slot>
    <template v-else>
      <HysActionBar v-if="selectable" visible-when-empty show-select-all :selected-count="count" :total-count="available.length"
        :labels="{ selectAll: '选择本页 {total} 张', clear: '取消本页选择' }" :actions="removable ? removeActions : undefined"
        @select-all="selectPage" @clear-selection="clearPage" @action="emit('remove', available.filter(key => selected.includes(key)))" />
      <section v-for="[label, group] in groups" :key="label" class="gallery-group">
      <h3 v-if="label">{{ label }}</h3>
      <component
        :is="sortable ? HysSortableList : 'ul'"
        :model-value="sortable ? group : undefined"
        item-key="key"
        :item-label="itemLabel"
        :layout="layout === 'grid' ? 'grid' : 'vertical'"
        :item-disabled="itemDisabled"
        :show-buttons="false"
        :live-preview="layout !== 'masonry'"
        @update:model-value="reorder(label, $event)"
      >
        <template v-for="slotName in [sortable ? 'item' : 'default']" #[slotName]="scope">
        <component :is="sortable ? 'div' : 'li'" v-for="(item, i) in scope?.item ? [scope.item] : group" :key="item.key" class="gallery-tile">
          <HysButton variant="ghost" class="thumbnail" :aria-label="'预览 ' + (item.title || item.alt || '图片 ' + (i + 1))"
            :style="{ aspectRatio: layout === 'masonry' ? (item.aspectRatio || aspectRatio) : aspectRatio }" @click="showImage(item)">
            <img v-if="!failures.has(item.thumbnail ?? item.src)" :src="item.thumbnail ?? item.src" :alt="item.alt ?? ''" loading="lazy"
              :style="{ objectFit: fit }" @error="failures.add(item.thumbnail ?? item.src)" />
            <ImageOff v-else aria-hidden="true" />
          </HysButton>
          <div class="caption">
            <slot name="caption" :image="item">
              <strong v-if="item.title">{{ item.title }}</strong>
              <span v-if="item.description">{{ item.description }}</span>
              <span v-if="item.sizeText">{{ item.sizeText }}</span>
            </slot>
          </div>
          <HysCheckbox v-if="selectable" :model-value="selected.includes(item.key)" :disabled="item.disabled"
            :aria-label="'选择 ' + (item.title || i + 1)" @update:model-value="toggle(item.key, $event === true)" />
        </component>
        </template>
      </component>
      </section>
    </template>
    <HysImageViewer
      v-model:open="open"
      v-model:index="index"
      :images="items"
      :image-transition="imageTransition"
      :loop="loop"
      show-thumbnails
      show-info
    />
  </div>
</template>
<style scoped>
.hys-image-gallery {
  display: grid;
  gap: 10px;
  min-width: 0;
  --hys-sort-gap: var(--gallery-gap);
  --hys-sort-grid-min: var(--gallery-min);
}
ul { display: grid; gap: var(--gallery-gap); margin: 0; padding: 0; list-style: none; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--gallery-min)), 1fr)); }
.gallery-tile { display: grid; gap: 7px; min-width: 0; padding: 8px; border: 1px solid var(--hys-ui-theme-border); border-radius: var(--hys-ui-radius, 8px); }
.layout-list ul { grid-template-columns: minmax(0, 1fr); }
.layout-list .gallery-tile { grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; }
.gallery-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.gallery-group h3 { margin: 0 0 8px; font-size: 13px; }
.layout-masonry ul,
.layout-masonry :deep(.hys-sort-list) { display: block; columns: var(--gallery-min); column-gap: var(--gallery-gap); }
.layout-masonry li,
.layout-masonry :deep(.hys-sort-row) { break-inside: avoid; margin-bottom: var(--gallery-gap); }
.hys-image-gallery :deep(.hys-sort-row) { padding: 0; gap: 0; }
.hys-image-gallery :deep(.hys-sort-row) .gallery-tile { border: 0; }
.thumbnail { width: 100%; height: auto; min-width: 0; padding: 0; overflow: hidden; background: var(--hys-ui-theme-surface-alt); }
.thumbnail :deep(.hys-ui-button-content) { width: 100%; height: 100%; }
.thumbnail img { display: block; width: 100%; height: 100%; }
.caption { display: grid; gap: 3px; min-width: 0; color: var(--hys-ui-theme-muted); font-size: 12px; overflow-wrap: anywhere; }
.caption strong { color: var(--hys-ui-theme-text); font-size: 13px; }
</style>
