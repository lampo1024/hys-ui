<script setup lang="ts">
import { ref } from 'vue';
import { HysCommentEditor } from 'hys-ui';
const toast = ref('');
const comments = ref([{ id: '1', author: '张工', text: '建议补充测试用例', time: '今天' }]);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysCommentEditor :comments="comments" @send="text=>comments=[...comments,{id:String(Date.now()),author:'当前用户',text,time:'刚刚'}]" @remove="id=>comments=comments.filter(c=>c.id!==id)"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
