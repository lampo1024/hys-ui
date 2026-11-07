import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
const root=fileURLToPath(new URL('..',import.meta.url)),require=createRequire(import.meta.url)
const {createChecker}=require('vue-component-meta')
const checker=createChecker(path.join(root,'packages/ui/tsconfig.json'),{schema:true})
const dir=path.join(root,'packages/ui/src/components'),api={}
const descriptions={modelValue:'受控值，配合 v-model 使用',disabled:'禁止用户操作',loading:'显示加载状态',min:'允许的最小值或最早日期',max:'允许的最大值或最晚日期',step:'每次调整的步长',showControls:'是否显示加减按钮',selectOnFocus:'输入框获得焦点时选中全部内容',options:'可选项数据，支持单项禁用',nodes:'树节点数据',items:'展示项目数据',rows:'行数据，由使用方提供',columns:'列定义',storageKey:'启用本地列配置持久化的隔离键',loadChildren:'展开节点时异步加载子节点，抛出错误后支持重试',open:'控制浮层显示',closeOnMask:'点击遮罩是否关闭',virtual:'启用可见区域虚拟渲染',draggable:'启用拖拽交互',page:'当前页，从 1 开始',pageSize:'每页条数',total:'总记录数',showQuickJumper:'显示页码跳转输入框',showSizeChanger:'显示每页条数选择器',multiSort:'允许多列排序',serverMode:'启用外部数据分页，通过事件请求新数据',editable:'允许编辑',multiple:'允许多选',placeholder:'空值占位提示',ariaLabel:'辅助技术使用的控件名称',value:'显示或计算用数值',theme:'主题名称',duration:'动画时长，单位毫秒',label:'显示标签',title:'标题',emptyText:'空数据提示',searchable:'显示搜索输入框',viewportHeight:'虚拟视口高度',rowHeight:'每行高度',pinned:'固定在左侧或右侧',events:'日历事件数据'}
for(const name of fs.readdirSync(dir).sort()){
 const meta=checker.getComponentMeta(path.join(dir,name,name+'.vue'))
 const item=p=>({name:p.name,type:p.type||'',required:!!p.required,default:p.default??(!p.required&&/^boolean(?: \| undefined)?$/.test(p.type||'')?'false':''),description:p.description||descriptions[p.name]||'',...('global' in p?{global:p.global}:{})})
 api[name]={props:meta.props.filter(p=>!p.global).map(item),events:meta.events.map(item),slots:meta.slots.map(item),exposed:meta.exposed.filter(p=>!p.name.startsWith('$')).map(item)}
 if(['HysTable','HysDataGrid','HysVirtualTable'].includes(name))api[name].slots.push({name:'[column.key]',type:'{ row: Record<string, unknown>; value: unknown; index?: number }',required:false,default:'',description:'与列 key 对应的单元格插槽，参数来自模板中的 slot 绑定。'})
}
fs.mkdirSync(path.join(root,'apps/docs/src/generated'),{recursive:true})
fs.writeFileSync(path.join(root,'apps/docs/src/generated/api.json'),JSON.stringify(api,null,2)+'\n')
console.log('Generated source-backed API for '+Object.keys(api).length+' components')
