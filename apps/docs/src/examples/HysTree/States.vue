<script setup lang="ts">
import { ref } from 'vue';
import { HysTree } from 'hys-ui';
const treeSelected = ref('team-1');
const treeChecked = ref<string[]>([]);
const treeExpanded = ref<string[]>(['root']);
const toast = ref('');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><p>任意层级、搜索、展开折叠、多选勾选、键盘导航</p><HysTree v-model="treeSelected" v-model:checked-keys="treeChecked" v-model:expanded-keys="treeExpanded" :nodes="[]" checkable show-line draggable context-menu virtual :viewport-height="280" @node-drop="payload=>toast=`拖动 ${payload.dragId} 到 ${payload.targetId} (${payload.position})`" @node-contextmenu="payload=>toast=`右键：${payload.node.label}`"/><small>当前节点：{{treeSelected}} · 已勾选：{{treeChecked.join(', ')}}</small></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
