<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
const props=defineProps<{roles:string[];resources:string[];modelValue:Record<string,boolean>}>();const emit=defineEmits<{ 'update:modelValue':[value:Record<string,boolean>] }>();function toggle(k:string,e:Event){emit('update:modelValue',{...props.modelValue,[k]:(e.target as HTMLInputElement).checked})}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-table-scroll"><table class="hys-ui-ent-matrix"><thead><tr><th>资源 / 角色</th><th v-for="r in roles" :key="r">{{r}}</th></tr></thead><tbody><tr v-for="res in resources" :key="res"><th>{{res}}</th><td v-for="r in roles" :key="r"><input type="checkbox" :aria-label="res+' - '+r" :checked="!!modelValue[res+':'+r]" @change="toggle(res+':'+r,$event)"/></td></tr></tbody></table></div></template>
