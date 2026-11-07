<script setup lang="ts">
import {ref} from 'vue'
import {HysTree} from 'hys-ui'
const selected=ref<string[]>([])
const nodes=[{id:'a',label:'研发中心',children:[{id:'b',label:'平台组'},{id:'c',label:'质量组'}]},{id:'d',label:'产品中心'}]
</script>
<template><div><HysTree v-model="selected" :nodes="nodes" multiple default-expand-all/><output>多选节点：{{selected}}</output></div></template>
