<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
withDefaults(defineProps<{label?:string;direction?:'horizontal'|'vertical';dashed?:boolean;orientation?:'left'|'center'|'right'}>(),{direction:'horizontal',orientation:'center'})
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-divider" :class="['hys-ui-divider-'+direction,'hys-ui-divider-'+orientation,{'hys-ui-divider-dashed':dashed}]" role="separator" :aria-orientation="direction"><span v-if="label||$slots.default"><slot>{{label}}</slot></span></div></template>
<style scoped>.hys-ui-divider-vertical{display:inline-block;vertical-align:middle;height:1em;border-left:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));margin:0 10px}.hys-ui-divider-vertical:before,.hys-ui-divider-vertical:after{display:none}.hys-ui-divider-dashed:before,.hys-ui-divider-dashed:after{height:0;border-top:1px dashed var(--hys-ui-border,var(--hys-ui-theme-border));background:none}.hys-ui-divider-left:before,.hys-ui-divider-right:after{flex:.1}</style>
