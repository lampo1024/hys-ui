<script setup lang="ts">
import { ref } from 'vue';
import { HysTree } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const treeSelected = ref('team-1');
const treeChecked = ref<string[]>([]);
const treeExpanded = ref<string[]>(['root']);
const demoTree = [{ id: 'root', label: '研发中心', children: [{ id: 'team-1', label: '平台开发组', children: [{ id: 'api', label: 'API 服务' }, { id: 'web', label: '前端工程' }] }, { id: 'team-2', label: '质量保障组', children: [{ id: 'qa', label: '自动化测试' }, { id: 'review', label: '代码审查', disabled: true }] }] }];
const toast = ref('');
const demoConfig = demoReactive<{
    checkable: boolean;
    searchable: boolean;
    disabled: boolean;
    defaultExpandAll: boolean;
    showLine: boolean;
    virtual: boolean;
    rowHeight: number;
    viewportHeight: number;
    draggable: boolean;
    contextMenu: boolean;
    checkStrictly: boolean;
}>({ "checkable": false, "searchable": true, "disabled": false, "defaultExpandAll": false, "showLine": false, "virtual": false, "rowHeight": 38, "viewportHeight": 340, "draggable": false, "contextMenu": false, "checkStrictly": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.checkable" label="checkable"/><DemoCheckbox v-model="demoConfig.searchable" label="searchable"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.defaultExpandAll" label="defaultExpandAll"/><DemoCheckbox v-model="demoConfig.showLine" label="showLine"/><DemoCheckbox v-model="demoConfig.virtual" label="virtual"/><label class="demo-field">rowHeight<DemoNumber v-model="demoConfig.rowHeight" :show-controls="false"/></label><label class="demo-field">viewportHeight<DemoNumber v-model="demoConfig.viewportHeight" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.draggable" label="draggable"/><DemoCheckbox v-model="demoConfig.contextMenu" label="contextMenu"/><DemoCheckbox v-model="demoConfig.checkStrictly" label="checkStrictly"/></div><div class="demo-content"><section class="ent-gallery-section"><p>任意层级、搜索、展开折叠、多选勾选、键盘导航</p><HysTree v-bind="demoConfig" v-model="treeSelected" v-model:checked-keys="treeChecked" v-model:expanded-keys="treeExpanded" :nodes="demoTree"       @node-drop="payload=>toast=`拖动 ${payload.dragId} 到 ${payload.targetId} (${payload.position})`" @node-contextmenu="payload=>toast=`右键：${payload.node.label}`"/><small>当前节点：{{treeSelected}} · 已勾选：{{treeChecked.join(', ')}}</small></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
