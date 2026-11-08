<script setup lang="ts">
import { onBeforeUnmount,onDeactivated,ref } from 'vue'
import { HysButton } from 'hys-ui'
import { Check,ChevronDown,Code2,Copy,FileCode2 } from 'lucide-vue-next'
import type { ExampleSourceData } from './sourceTypes'
const props=defineProps<{loadSource:()=>Promise<ExampleSourceData>;filename:string}>()
const source=ref<ExampleSourceData>(),expanded=ref(false),loading=ref(false),error=ref(false),copying=ref(false),copied=ref(false),copyError=ref(false)
let request:Promise<void>|undefined,timer:ReturnType<typeof setTimeout>|undefined
function clearFeedback(){clearTimeout(timer);copied.value=false;copyError.value=false}
onDeactivated(clearFeedback);onBeforeUnmount(clearFeedback)
async function load(){if(source.value)return;if(request)return request;loading.value=true;error.value=false;request=props.loadSource().then(value=>{source.value=value}).catch(()=>{error.value=true}).finally(()=>{loading.value=false;request=undefined});return request}
function toggle(event:Event){expanded.value=(event.target as HTMLDetailsElement).open;if(expanded.value)void load()}
function fallbackCopy(text:string){const field=document.createElement('textarea'),previous=document.activeElement as HTMLElement|null;field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.append(field);try{field.select();if(!document.execCommand('copy'))throw Error('Clipboard unavailable')}finally{field.remove();previous?.focus()}}
async function copy(){if(copying.value)return;await load();if(!source.value)return;clearFeedback();copying.value=true;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(source.value.code);else fallbackCopy(source.value.code);copied.value=true;timer=setTimeout(clearFeedback,2000)}catch{copyError.value=true}finally{copying.value=false}}
</script>
<template>
  <details class="example-source" @toggle="toggle">
    <summary class="source-toggle"><span><Code2 :size="15" aria-hidden="true"/>{{expanded?'收起示例源码':'查看示例源码'}}</span><ChevronDown :size="14" class="source-chevron" aria-hidden="true"/></summary>
    <div class="source-panel">
      <div class="source-toolbar"><div class="source-file"><FileCode2 :size="15" aria-hidden="true"/><span>{{filename}}</span><span class="source-language">Vue / TypeScript</span></div><HysButton class="source-copy" variant="ghost" size="sm" :disabled="!source||copying" :aria-label="'复制 '+filename+' 源码'" @click="copy"><component :is="copied?Check:Copy" :size="14" aria-hidden="true"/>{{copying?'复制中':copied?'已复制':'复制代码'}}</HysButton></div>
      <div v-if="loading" class="source-message" role="status">正在加载源码…</div>
      <div v-else-if="error" class="source-message" role="status">源码加载失败<HysButton variant="ghost" size="sm" @click="load">重新加载</HysButton></div>
      <div v-else-if="source" class="source-code" role="region" :aria-label="filename+' 示例源码'" v-html="source.html"/>
      <div v-if="source" class="source-footer"><span>{{source.lines}} 行<span class="source-footer-hint"> · 可横向滚动查看长行</span></span><span role="status" :class="{'source-copy-error':copyError}">{{copyError?'复制失败，请手动选择源码':copied?'代码已复制到剪贴板':'示例代码可直接复制使用'}}</span></div>
    </div>
  </details>
</template>
<style scoped>
.example-source{border-top:1px solid var(--docs-border);font-size:12px}.source-toggle{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 22px;color:var(--docs-muted);cursor:pointer;list-style:none;background:var(--docs-bg);user-select:none;transition:color .15s,background-color .15s}.source-toggle::-webkit-details-marker{display:none}.source-toggle>span{display:flex;align-items:center;gap:8px}.source-toggle:hover{color:var(--docs-text);background:color-mix(in srgb,var(--docs-bg) 85%,var(--docs-border))}.source-toggle:focus-visible{outline:2px solid #315df5;outline-offset:-3px}.source-chevron{flex:none;transition:transform .18s}.example-source[open] .source-chevron{transform:rotate(180deg)}
.source-panel{background:#111c30;color:#cbd5e1}.source-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:48px;padding:8px 18px;border-bottom:1px solid #ffffff12;background:#162237}.source-file{display:flex;align-items:center;gap:8px;min-width:0;font-size:12px;color:#dce6f4}.source-file>span:first-of-type{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.source-language{font-size:10px;color:#93a4bb;border-left:1px solid #ffffff24;padding-left:10px;margin-left:2px;white-space:nowrap}.source-toolbar :deep(.source-copy){position:static;flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;min-height:30px;padding:4px 9px;border:1px solid #ffffff26;background:#ffffff06;color:#c9d7eb;border-radius:6px;font-size:11px;font-weight:500;transform:none;box-shadow:none}.source-toolbar :deep(.source-copy:hover:not(:disabled)){background:#ffffff12;border-color:#ffffff45;color:#fff}.source-toolbar :deep(.source-copy:focus-visible){outline:2px solid #79b8ff;outline-offset:2px}
.source-code{min-width:0;max-width:100%}.source-code :deep(pre){margin:0;padding:20px 22px;max-height:430px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#46546d transparent;background:#111c30!important;color:#dce6f4;white-space:pre;tab-size:2;font-family:Consolas,'SFMono-Regular','Liberation Mono',monospace;font-size:12px;line-height:1.85;border-radius:0}.source-code :deep(pre:focus-visible){outline:2px solid #79b8ff;outline-offset:-2px}.source-code :deep(code){font:inherit;white-space:inherit;display:block;width:max-content;min-width:100%;background:none;padding:0}.source-code :deep(.line){min-height:1em}.source-code :deep(::selection){background:#3b5886;color:#fff}.source-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:9px 18px;border-top:1px solid #ffffff12;font-size:10px;color:#93a4bb}.source-copy-error{color:#fda4af}.source-message{padding:24px;display:flex;align-items:center;justify-content:center;gap:12px;color:#b9c6d9}
@media(max-width:600px){.source-toggle{padding:12px 16px}.source-toolbar{padding:8px 12px;gap:8px}.source-language,.source-footer-hint{display:none}.source-code :deep(pre){padding:16px;font-size:11px}.source-footer{padding:9px 12px;font-size:10px}.source-file{font-size:11px}}
@media(prefers-reduced-motion:reduce){.source-chevron,.source-toggle{transition:none}}
</style>
