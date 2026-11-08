<script setup lang="ts">
import {version} from '../../../packages/ui/package.json'
import {RouterLink} from 'vue-router'
import {ArrowRight,Package,Palette,Code2} from 'lucide-vue-next'
import {catalog} from './catalog'
const groups=[...new Set(catalog.map(x=>x.category))]
</script>
<template><article class="doc-page"><div class="doc-eyebrow">BUILD WITH CLARITY</div><section class="intro"><span class="intro-pill">HYS UI / {{version}}</span><h1>组件独立。<br/><span>构建自在。</span></h1><p>为 Vue 3 项目提供灵活的交互组件。<br/>统一视觉、完整类型、可运行示例，从这里开始。</p><a class="start-link" href="#install">快速开始<ArrowRight :size="17"/></a><div class="intro-art" aria-hidden="true"><div></div><div></div><div></div><div></div></div></section>
 <div class="feature-grid"><section><Package :size="22"/><h2>独立安装</h2><p>通过 npm 安装，按需引入组件。</p></section><section><Palette :size="22"/><h2>主题配置</h2><p>响应式配置与隔离的主题变量。</p></section><section><Code2 :size="22"/><h2>完整示例</h2><p>查看源码、体验交互、查阅类型。</p></section></div>
 <section id="install" class="install"><h2>快速开始</h2><pre>npm install hys-ui</pre><pre>import { HysButton } from 'hys-ui'
import 'hys-ui/style.css'</pre><p>需要 Vue 3.5+。在应用入口导入一次样式，在页面中按需导入组件。</p><h3>主题与动效</h3><pre>import { ref } from 'vue'
import { provideHysConfig } from 'hys-ui'

const theme = ref('blue')
provideHysConfig({ theme, motion: 'subtle' })</pre><p>在根组件 setup 中调用。支持 blue、dark、green、purple、orange、forest；动效支持 full、subtle、off。</p></section>
 <section v-for="group in groups" :key="group" class="catalog-group"><h2>{{group}}</h2><div class="catalog-grid"><RouterLink v-for="item in catalog.filter(x=>x.category===group)" :key="item.name" :to="'/components/'+item.slug"><strong>{{item.shortName}}<ArrowRight :size="14"/></strong><span>{{item.label}}</span></RouterLink></div></section>
 </article></template>
