<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import HysCheckbox from '../HysCheckbox/HysCheckbox.vue'
import { useHysRootAttrs } from '../../config'
const props=withDefaults(defineProps<{roles:string[];resources:string[];modelValue:Record<string,boolean>;disabled?:boolean;readonly?:boolean;showSelectAll?:boolean}>(),{showSelectAll:true})
const {disabled:controlDisabled}=useHysControlState(props)

const emit=defineEmits<{'update:modelValue':[value:Record<string,boolean>];change:[value:Record<string,boolean>]}>(),hysRootAttrs=useHysRootAttrs()
function keys(resource?:string,role?:string){return(resource?[resource]:props.resources).flatMap(res=>(role?[role]:props.roles).map(r=>res+':'+r))}
function all(list:string[]){return list.length>0&&list.every(key=>props.modelValue[key])}
function mixed(list:string[]){return !all(list)&&list.some(key=>props.modelValue[key])}
function toggle(list:string[],checked:boolean){if(controlDisabled.value||props.readonly)return;const next={...props.modelValue};for(const key of list)next[key]=checked;emit('update:modelValue',next);emit('change',next)}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-table-scroll"><table class="hys-ui-ent-matrix"><thead><tr><th><HysCheckbox v-if="showSelectAll" class="hys-ui-matrix-group" :model-value="all(keys())" :indeterminate="mixed(keys())" :disabled="controlDisabled||!roles.length||!resources.length" :readonly="readonly" aria-label="全选所有权限" label="资源 / 角色" @change="toggle(keys(),$event)"/><template v-else>资源 / 角色</template></th><th v-for="role in roles" :key="role"><HysCheckbox v-if="showSelectAll" class="hys-ui-matrix-group" :model-value="all(keys(undefined,role))" :indeterminate="mixed(keys(undefined,role))" :disabled="controlDisabled||!resources.length" :readonly="readonly" :aria-label="'全选角色 '+role" :label="role" @change="toggle(keys(undefined,role),$event)"/><template v-else>{{role}}</template></th></tr></thead><tbody><tr v-for="resource in resources" :key="resource"><th><HysCheckbox v-if="showSelectAll" class="hys-ui-matrix-group" :model-value="all(keys(resource))" :indeterminate="mixed(keys(resource))" :disabled="controlDisabled||!roles.length" :readonly="readonly" :aria-label="'全选资源 '+resource" :label="resource" @change="toggle(keys(resource),$event)"/><template v-else>{{resource}}</template></th><td v-for="role in roles" :key="role"><HysCheckbox :aria-label="resource+' - '+role" :model-value="!!modelValue[resource+':'+role]" :disabled="controlDisabled" :readonly="readonly" @change="toggle([resource+':'+role],$event)"/></td></tr></tbody></table></div></template>
<style scoped>.hys-ui-matrix-group :deep(.hys-ui-checkbox-label){font-weight:600}</style>
