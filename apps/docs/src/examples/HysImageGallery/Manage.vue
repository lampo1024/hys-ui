<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { HysImageGallery, type HysGalleryImage } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
const layout = ref<"grid" | "list" | "masonry">("grid");
const keys = ref<(string|number)[]>([]);
const pictures = ref<HysGalleryImage[]>([
  {key:"chart",src:chart,title:"订单趋势",group:"交付附件",aspectRatio:"3 / 2"},
  {key:"gantt",src:gantt,title:"项目计划",group:"交付附件",aspectRatio:"5 / 3"},
]);
let sequence = 0;
const urls = new Set<string>();
function insert(files: File[]) {
  pictures.value = [...pictures.value, ...files.map(file => {
    const src = URL.createObjectURL(file);
    urls.add(src);
    return {key:"file-"+(++sequence),src,title:file.name,group:"新增图片"};
  })];
}
function remove(selected: (number | string)[]) {
  for (const picture of pictures.value) if (selected.includes(picture.key) && urls.delete(picture.src)) URL.revokeObjectURL(picture.src);
  pictures.value = pictures.value.filter(picture => !selected.includes(picture.key));
  keys.value = keys.value.filter(key => !selected.includes(key));
}
onUnmounted(() => { for (const src of urls) URL.revokeObjectURL(src); });
</script>
<template>
  <HysImageGallery v-model:items="pictures" v-model:layout="layout" v-model:selected-keys="keys" uploadable
    removable selectable sortable layout-switch @upload="insert" @remove="remove" />
</template>
