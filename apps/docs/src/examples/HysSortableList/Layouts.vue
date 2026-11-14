<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import {
  HysButton,
  HysSelect,
  HysSortableList,
  HysUpload,
  type HysSortLayout,
} from "hys-ui";
import { Grip, Image, Menu, Tag } from "lucide-vue-next";

const kind = ref<"photos" | "tags" | "menu">("photos");
const photos = ref([
  { id: "spring", label: "春季系列", color: "#55a991", url: "" },
  { id: "summer", label: "夏季系列", color: "#d59b5f", url: "" },
  { id: "autumn", label: "秋季系列", color: "#a684ba", url: "" },
  { id: "winter", label: "冬季系列", color: "#5982b6", url: "" },
]);
const tags = ref(
  ["优先", "进行中", "待复核", "已完成"].map((label) => ({
    id: label,
    label,
    url: "",
    color: "",
  })),
);
const menus = ref(
  ["项目概览", "资源中心", "审批记录", "账户设置"].map((label) => ({
    id: label,
    label,
    url: "",
    color: "",
  })),
);
const active = computed(() =>
  kind.value === "photos" ? photos : kind.value === "tags" ? tags : menus,
);
const items = computed({
  get: () => active.value.value,
  set: (value) => {
    active.value.value = value;
  },
});
const layout = computed<HysSortLayout>(() =>
  kind.value === "photos"
    ? "grid"
    : kind.value === "tags"
      ? "horizontal"
      : "vertical",
);
let sequence = 0;

function loadPhotos(files: File[]) {
  const added = files
    .filter((file) => file.type.startsWith("image/"))
    .map((file) => ({
      id: `photo-${++sequence}`,
      label: file.name,
      url: URL.createObjectURL(file),
      color: "",
    }));
  photos.value = [...photos.value, ...added];
}
onBeforeUnmount(() =>
  photos.value.forEach((item) => {
    if (item.url) URL.revokeObjectURL(item.url);
  }),
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview layout-toolbar">
      <label class="demo-toolbar-field layout-field"
        >展示方式
        <HysSelect
          v-model="kind"
          :options="[
            { value: 'photos', label: '图片网格' },
            { value: 'tags', label: '横向标签' },
            { value: 'menu', label: '菜单列表' },
          ]"
        />
      </label>
      <HysUpload
        v-if="kind === 'photos'"
        class="choose-image"
        accept="image/*"
        multiple
        :show-file-list="false"
        @select="loadPhotos"
      >
        <template #trigger="{ open }">
          <HysButton variant="secondary" size="sm" @click="open"
            >添加本地图片</HysButton
          >
        </template>
      </HysUpload>
    </div>
    <HysSortableList
      :key="kind"
      v-model="items"
      :layout="layout"
      :list-tag="kind === 'menu' ? 'ul' : 'div'"
      :show-buttons="false"
      :axis="kind === 'tags' ? 'x' : 'both'"
      :aria-label="'素材顺序'"
      :animation-duration="260"
      class="layout-sample"
    >
      <template #handle><Grip :size="16" aria-hidden="true" /></template>
      <template #item="{ item }">
        <div v-if="kind === 'photos'" class="photo">
          <img v-if="item.url" :src="item.url" :alt="item.label" />
          <span v-else class="cover" :style="{ backgroundColor: item.color }"
            ><Image :size="21" aria-hidden="true"
          /></span>
          <span>{{ item.label }}</span>
        </div>
        <span v-else class="tile"
          ><component
            :is="kind === 'tags' ? Tag : Menu"
            :size="14"
            aria-hidden="true"
          />{{ item.label }}</span
        >
      </template>
      <template #preview="{ drag }"
        ><span class="tile"
          ><Image v-if="kind === 'photos'" :size="16" aria-hidden="true" />{{
            drag.items[0].label
          }}</span
        ></template
      >
      <template #placeholder>拖到新位置</template>
    </HysSortableList>
  </div>
</template>

<style scoped>
.layout-field {
  inline-size: min(100%, 12rem);
}
.layout-toolbar {
  align-items: flex-end;
}
.layout-sample {
  --hys-sort-grid-min: 10rem;
}
.photo {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.photo img,
.cover {
  display: grid;
  place-items: center;
  inline-size: 100%;
  height: 74px;
  border-radius: 6px;
  object-fit: cover;
  color: white;
}
.tile {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tile svg {
  flex: none;
}
.choose-image :deep(.hys-ui-upload-zone) {
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
</style>
