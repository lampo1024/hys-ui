<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed,ref} from 'vue';const model=defineModel<string>({default:'{}'});const error=computed(()=>{try{JSON.parse(model.value);return ''}catch(e){return (e as Error).message}});const status=ref('');function format(){try{model.value=JSON.stringify(JSON.parse(model.value),null,2);status.value='已格式化'}catch{status.value='JSON 无效'}};
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-panel"><div class="hys-ui-ent-toolbar"><button type="button" @click="format">格式化</button><span :class="error?'hys-ui-ent-error':'hys-ui-ent-ok'">{{error||'JSON 格式正确'}}</span></div><textarea v-model="model" class="hys-ui-ent-code" spellcheck="false" aria-label="JSON 编辑器"/><small role="status">{{status}}</small></div></template>
