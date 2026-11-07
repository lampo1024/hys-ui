<script setup lang="ts">
import { ref } from 'vue';
import { HysTree } from 'hys-ui';
const treeSelected = ref('team-1');
const treeChecked = ref<string[]>([]);
const treeExpanded = ref<string[]>(['root']);
const demoTree = [{ id: 'root', label: '研发中心', children: [{ id: 'team-1', label: '平台开发组', children: [{ id: 'api', label: 'API 服务' }, { id: 'web', label: '前端工程' }] }, { id: 'team-2', label: '质量保障组', children: [{ id: 'qa', label: '自动化测试' }, { id: 'review', label: '代码审查', disabled: true }] }] }];
const toast = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><p>任意层级、搜索、展开折叠、多选勾选、键盘导航</p><HysTree v-model="treeSelected" v-model:checked-keys="treeChecked" v-model:expanded-keys="treeExpanded" :nodes="demoTree" checkable show-line draggable context-menu virtual :viewport-height="280" @node-drop="payload=>toast=`拖动 ${payload.dragId} 到 ${payload.targetId} (${payload.position})`" @node-contextmenu="payload=>toast=`右键：${payload.node.label}`"/><small>当前节点：{{treeSelected}} · 已勾选：{{treeChecked.join(', ')}}</small></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
