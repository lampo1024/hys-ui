<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
withDefaults(defineProps<{title?:string;subtitle?:string;loading?:boolean;bordered?:boolean;shadow?:'always'|'hover'|'never';bodyStyle?:Record<string,string>;size?:'sm'|'md'|'lg'}>(),{bordered:true,shadow:'never',size:'md'})
</script>
<template><section v-bind="hysRootAttrs" class="hys-ui-card" :class="['hys-ui-card-shadow-'+(shadow||'never'),'hys-ui-card-size-'+(size||'md')]" :style="{border:bordered===false?'0':undefined}"><header v-if="title||subtitle||$slots.header||$slots.action" class="hys-ui-card-head"><slot name="header"><div><h3>{{title}}</h3><p v-if="subtitle" class="hys-ui-muted hys-ui-small">{{subtitle}}</p></div></slot><div><slot name="action"/></div></header><div class="hys-ui-card-content" :style="bodyStyle" :aria-busy="loading"><div v-if="loading" role="status">加载中…</div><slot v-else/></div><footer v-if="$slots.footer" class="hys-ui-card-foot"><slot name="footer"/></footer></section></template>
<style scoped>.hys-ui-card-shadow-always,.hys-ui-card-shadow-hover:hover{box-shadow:0 8px 24px #17274412}.hys-ui-card-foot{padding:14px 20px;border-top:1px solid var(--hys-ui-border,var(--hys-ui-theme-border))}.hys-ui-card-size-sm .hys-ui-card-content{padding:12px}.hys-ui-card-size-lg .hys-ui-card-content{padding:28px}</style>
