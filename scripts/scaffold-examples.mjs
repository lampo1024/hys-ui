// Explicit maintenance command. Normal documentation builds never overwrite authored examples.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
const root=fileURLToPath(new URL('..',import.meta.url)),require=createRequire(import.meta.url),{parse}=require('@vue/compiler-sfc'),{parse:dom}=require('@vue/compiler-dom')
const api=JSON.parse(fs.readFileSync(path.join(root,'apps/docs/src/generated/api.json'),'utf8'))
for(const [name,meta]of Object.entries(api)){
 const dir=path.join(root,'apps/docs/src/examples',name),basic=fs.readFileSync(path.join(dir,'Basic.vue'),'utf8'),d=parse(basic).descriptor,ast=dom(d.template.content)
 let node;function find(n){if(n.type!==1)return;if(!node&&n.tag===name)node=n;for(const c of n.children)find(c)}for(const n of ast.children)find(n);if(!node)throw Error('Missing live component '+name)
 const skip=new Set(['modelValue','multiple','checkedKeys','expandedKeys','open','visible','storageKey','serverMode','treeMode','editable','href'])
 const controls=meta.props.filter(p=>!p.required&&!p.name.startsWith('on')&&!skip.has(p.name)).flatMap(p=>{
  const values=[...p.type.matchAll(/"([^"]*)"/g)].map(m=>m[1]);const base={name:p.name,type:p.type.replace(/ \| undefined/g,'')}
  if(/^boolean(?: \| undefined)?$/.test(p.type))return [{...base,kind:'boolean',value:p.default==='true'}]
  if(values.length>=2&&values.length<=12&&!p.type.includes('{')&&!p.type.includes('=>'))return [{...base,kind:'enum',options:values,value:p.default?JSON.parse(p.default):values[0]}]
  if(/^number(?: \| undefined)?$/.test(p.type)&&p.default&&Number.isFinite(Number(p.default)))return [{...base,kind:'number',value:Number(p.default)}]
  if(/^string(?: \| undefined)?$/.test(p.type)&&['placeholder','title','label','description','emptyText','hint','error','text','separator'].includes(p.name))return [{...base,kind:'string',value:p.default?JSON.parse(p.default):'自定义'+p.name}]
  return []
 })
 if(!controls.length)continue
 const edits=[];for(const p of node.props){const key=p.type===6?p.name:p.arg?.content;if(controls.some(c=>c.name===key?.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())))edits.push([p.loc.start.offset,p.loc.end.offset,''])}
 edits.push([node.loc.start.offset+1+name.length,node.loc.start.offset+1+name.length,' v-bind="demoConfig"']);let html=d.template.content
 for(const[a,b,v]of edits.sort((a,b)=>b[0]-a[0]))html=html.slice(0,a)+v+html.slice(b)
 const fields=controls.map(c=>c.kind==='boolean'?`<DemoCheckbox v-model="demoConfig.${c.name}" label="${c.name}"/>`:c.kind==='enum'?`<label class="demo-field">${c.name}<DemoSelect :model-value="demoConfig.${c.name}" @update:model-value="demoConfig.${c.name}=$event as typeof demoConfig.${c.name}" :options='${JSON.stringify(c.options.map(value=>({label:value,value})))}'/></label>`:c.kind==='number'?`<label class="demo-field">${c.name}<DemoNumber v-model="demoConfig.${c.name}" :show-controls="false"/></label>`:`<label class="demo-field">${c.name}<DemoInput v-model="demoConfig.${c.name}"/></label>`).join('')
 const script=d.scriptSetup.content+`\nimport {reactive as demoReactive} from 'vue'\nimport {HysCheckbox as DemoCheckbox,HysSelect as DemoSelect,HysInput as DemoInput,HysNumberInput as DemoNumber} from 'hys-ui'\nconst demoConfig=demoReactive<{${controls.map(c=>c.name+':'+c.type).join(';')}}>(${JSON.stringify(Object.fromEntries(controls.map(c=>[c.name,c.value])))})\n`
 fs.writeFileSync(path.join(dir,'Configure.vue'),`<script setup lang="ts">\n${script}\n</script>\n<template><div><div class="demo-controls">${fields}</div>${html}<pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>\n${d.styles.map(s=>'<style scoped>'+s.content+'</style>').join('\n')}`)
}
console.log('Updated typed, runnable configuration scenarios')
