<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {ref} from 'vue';export interface Comment{id:string;author:string;text:string;time?:string}defineProps<{comments:Comment[]}>();const emit=defineEmits<{send:[text:string];remove:[id:string]}>();const draft=ref('');function send(){if(!draft.value.trim())return;emit('send',draft.value.trim());draft.value=''}
</script>
<template><section v-bind="hysRootAttrs" class="hys-ui-ent-panel"><div v-for="c in comments" :key="c.id" class="hys-ui-ent-comment"><strong>{{c.author}}</strong><small>{{c.time}}</small><p>{{c.text}}</p><button type="button" @click="emit('remove',c.id)">删除</button></div><textarea v-model="draft" placeholder="输入评论，Ctrl+Enter 发送" @keydown.ctrl.enter="send"/><button type="button" :disabled="!draft.trim()" @click="send">发送评论</button></section></template>
