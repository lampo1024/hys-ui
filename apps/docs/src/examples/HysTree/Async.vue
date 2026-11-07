<script setup lang="ts">
import { ref } from 'vue';
import { HysTree, HysCheckbox, type TreeNode } from 'hys-ui';
const fail = ref(true);
const selected = ref('');
const message = ref('');
const nodes: TreeNode[] = [{ id: 'async-root', label: '展开以加载团队', hasChildren: true }];
async function loadChildren(node: TreeNode) {
    await new Promise(resolve => setTimeout(resolve, 350));
    if (fail.value)
        throw new Error('模拟网络错误');
    return [{ id: node.id + '-one', label: '平台团队' }, { id: node.id + '-two', label: '质量团队', disabled: true }];
}
</script>
<template><div class="demo-content"><HysCheckbox v-model="fail" label="模拟加载失败（取消勾选后点击重试）"/><HysTree v-model="selected" :nodes="nodes" :load-children="loadChildren" @load-error="message='加载失败，可重新展开重试'" @children-loaded="message='加载完成'"/><output aria-live="polite">{{message}} · 选中 {{selected||'无'}}</output></div></template>
