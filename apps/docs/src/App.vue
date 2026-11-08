<script setup lang="ts">
import {version} from '../../../packages/ui/package.json'
import {computed,ref,watch} from 'vue'
import {RouterLink,RouterView,useRoute} from 'vue-router'
import {HysSearch,HysSelect,HysButton,provideHysConfig,type HysTheme} from 'hys-ui'
import {ArrowUpRight,Boxes,ChevronRight,Menu,X} from 'lucide-vue-next'
import {catalog} from './catalog'
const query=ref(''),menu=ref(false),route=useRoute()
const stored=localStorage.getItem('hys-docs-theme')||'blue'
const theme=ref<HysTheme>((['blue','dark','green','purple','orange','forest'].includes(stored)?stored:'blue') as HysTheme)
provideHysConfig({theme})
watch(theme,value=>{localStorage.setItem('hys-docs-theme',value);document.documentElement.dataset.docsTheme=value},{immediate:true})
watch(()=>route.path,()=>menu.value=false)
const groups=computed(()=>[...new Set(catalog.map(x=>x.category))].map(category=>({category,items:catalog.filter(x=>x.category===category&&(x.name+' '+x.label).toLowerCase().includes(query.value.toLowerCase()))})).filter(x=>x.items.length))
</script>
<template>
 <div class="docs-shell">
  <aside class="docs-sidebar" :class="{opened:menu}"><RouterLink to="/" class="brand"><span class="brand-mark">h</span><span>HYS <b>UI</b><small>VUE COMPONENT LIBRARY</small></span><span class="version">{{version}}</span></RouterLink>
   <div class="nav-search"><HysSearch v-model="query" placeholder="搜索组件…"/></div>
   <nav><RouterLink to="/" class="overview-link"><Boxes :size="16"/>概览与快速开始</RouterLink><section v-for="group in groups" :key="group.category"><h2>{{group.category}}</h2><RouterLink v-for="item in group.items" :key="item.name" :to="'/components/'+item.slug"><span>{{item.shortName}}<small>{{item.label}}</small></span><ChevronRight :size="13"/></RouterLink></section><p v-if="!groups.length">没有匹配组件</p></nav>
   <footer><span class="live-dot"></span>Vue · TypeScript</footer>
  </aside>
  <div v-if="menu" class="nav-backdrop" @click="menu=false"></div>
  <main class="docs-main"><header class="docs-topbar"><HysButton variant="ghost" class="mobile-nav" aria-label="切换导航" @click="menu=!menu"><component :is="menu?X:Menu" :size="20"/></HysButton><div>开发者文档<span>/</span><strong>{{String(route.meta.title||'概览')}}</strong></div><div class="topbar-tools"><HysSelect v-model="theme" aria-label="文档主题" :options="[{label:'科技蓝',value:'blue'},{label:'深色',value:'dark'},{label:'清新绿',value:'green'},{label:'紫色',value:'purple'},{label:'暖橙',value:'orange'},{label:'森林',value:'forest'}]"/><a href="https://github.com/lampo1024/hys-ui" target="_blank" rel="noreferrer">GitHub<ArrowUpRight :size="14"/></a></div></header>
   <div id="docs-toc-host"></div>
   <RouterView v-slot="{Component,route:current}"><Transition name="docs-page" mode="out-in"><KeepAlive><component :is="Component" :key="current.name"/></KeepAlive></Transition></RouterView>
   <footer class="docs-footer">HYS UI · 独立维护，可用于你的下一个 Vue 项目</footer>
  </main>
 </div>
</template>
