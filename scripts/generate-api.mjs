import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
const root=fileURLToPath(new URL('..',import.meta.url)),require=createRequire(import.meta.url)
const {createChecker}=require('vue-component-meta')
const checker=createChecker(path.join(root,'packages/ui/tsconfig.json'),{schema:true})
const dir=path.join(root,'packages/ui/src/components'),api={}
const descriptions={modelValue:'受控值，配合 v-model 使用',disabled:'禁止用户操作',loading:'显示加载状态',min:'允许的最小值或最早日期',max:'允许的最大值或最晚日期',step:'每次调整的步长',showControls:'是否显示加减按钮',selectOnFocus:'输入框获得焦点时选中全部内容',options:'可选项数据，支持单项禁用',nodes:'树节点数据',items:'展示项目数据',rows:'行数据，由使用方提供',columns:'列定义',storageKey:'启用本地列配置持久化的隔离键',loadChildren:'展开节点时异步加载子节点，抛出错误后支持重试',open:'控制浮层显示',closeOnMask:'点击遮罩是否关闭',virtual:'启用可见区域虚拟渲染',draggable:'启用拖拽交互',page:'当前页，从 1 开始',pageSize:'每页条数',total:'总记录数',showQuickJumper:'显示页码跳转输入框',showSizeChanger:'显示每页条数选择器',multiSort:'允许多列排序',serverMode:'启用外部数据分页，通过事件请求新数据',editable:'允许编辑',multiple:'允许多选',popupMatchWidth:'浮层是否严格与选择框等宽；默认按内容扩展，并限制在视口内',filterMethod:'自定义本地搜索规则，参数为关键词与选项；remote 模式由调用方提供结果',fitContainer:'时间轴是否自动填满剩余容器宽度',height:'顶部、底部抽屉高度；未设置时使用 width',placeholder:'空值占位提示',ariaLabel:'辅助技术使用的控件名称',value:'显示或计算用数值',theme:'主题名称',duration:'动画时长，单位毫秒',label:'显示标签',title:'标题',emptyText:'空数据提示',searchable:'显示搜索输入框',viewportHeight:'虚拟视口高度',rowHeight:'每行高度',pinned:'固定在左侧或右侧',events:'日历事件数据'}
for(const name of fs.readdirSync(dir).sort()){
 const meta=checker.getComponentMeta(path.join(dir,name,name+'.vue'))
 const item=p=>({name:p.name,type:p.type||'',required:!!p.required,default:p.default??(!p.required&&/^boolean(?: \| undefined)?$/.test(p.type||'')?'false':''),description:p.description||descriptions[p.name]||'',...('global' in p?{global:p.global}:{})})
 api[name]={props:meta.props.filter(p=>!p.global).map(item),events:meta.events.map(item),slots:meta.slots.map(item),exposed:meta.exposed.filter(p=>!p.name.startsWith('$')).map(item)}
 if(['HysTabs','HysAccordion','HysSteps','HysBreadcrumb'].includes(name)){
  const common={size:'组件尺寸',disabled:'禁止用户操作',items:'展示项；每项的字段见公开类型',ariaLabel:'辅助技术使用的组件名称'}
  const text={
   HysTabs:{defaultValue:'非受控模式的初始页签；未指定时使用首个可用项',type:'line、card、border-card 或 segment 外观',placement:'导航位置；未指定时 vertical=true 对应 left，否则 top',vertical:'兼容纵向导航设置；显式 placement 优先',stretch:'将标签均分到导航容器的可用宽度',centered:'标签在可用空间居中',closable:'允许关闭页签；单项 closable 优先',addable:'显示添加按钮',editable:'同时启用添加和关闭操作',trigger:'鼠标激活方式：点击或悬停；键盘始终可用',activation:'方向键自动激活，或只移动焦点并等待 Enter/空格确认',lazy:'首次访问时才挂载面板；用于 panel 插槽',destroyOnHide:'离开时销毁面板；默认保留已访问面板的局部状态',animated:'启用内容进入动画；遵循减少动态效果配置',showScrollButtons:'标签溢出时显示滚动按钮',beforeLeave:'切换前检查，参数为 next、current；false、拒绝的 Promise 或抛出错误会阻止切换',beforeClose:'关闭前检查，参数为页签值；false、拒绝的 Promise 或抛出错误会阻止关闭'},
   HysAccordion:{modelValue:'展开项标识数组；有 id 时使用 id，否则使用索引',defaultActive:'非受控模式的默认展开项',multiple:'允许多个面板同时展开；默认仅展开一项',bordered:'显示外框',ghost:'透明背景与无边框外观',showArrow:'显示展开图标；仅图标触发模式始终保留图标',arrowPlacement:'图标位于标题左侧或右侧',trigger:'点击整段标题，或仅点击图标按钮展开',lazy:'保留内容模式下，是否延迟到首次访问时挂载',destroyOnHide:'收起时销毁内容；设为 false 可保留已访问面板的局部状态',beforeToggle:'展开或收起前检查，参数为 key、expanded；false 或拒绝的 Promise 阻止操作'},
   HysSteps:{current:'当前步骤，索引从 0 开始；-1 表示尚未开始，items.length 表示全部完成',status:'当前步骤状态；单项 status 优先于自动计算',vertical:'使用纵向布局',clickable:'允许通过点击和方向键切换可用步骤',labelPlacement:'横向布局中，标题与描述位于图标右侧或下方',progressDot:'使用点状进度标记',simple:'简洁背景并隐藏描述',responsive:'小屏幕下使用纵向布局'},
   HysBreadcrumb:{separator:'默认分隔文本；单项 separator 优先',separatorIcon:'分隔图标组件；separator 插槽优先'}
  }[name]
  for(const prop of api[name].props)prop.description=text[prop.name]||common[prop.name]||prop.description
  const events={change:'实际值变化后触发；参数为更新后的值',guardError:'异步检查抛出错误或 Promise 被拒绝时触发；取消与过期请求不会覆盖当前值',add:'请求添加页签，由调用方维护 items',close:'请求关闭页签，由调用方移除 items 并维护当前值',edit:'添加/关闭操作：value、add 或 remove',tabClick:'点击可用页签时触发：value、MouseEvent',itemClick:'请求展开或收起时触发：key、目标展开状态',select:'默认链接点击事件：item、index、MouseEvent'}
  for(const event of api[name].events)event.description=events[event.name]||event.description
 }
 if(name==='HysToast'){
  const text={message:'提示文本，可使用默认插槽自定义内容',duration:'自动关闭时长（毫秒）；普通状态默认 3000，loading 默认 0。0 表示不自动关闭',type:'success、info、warning、error、loading 五种状态',position:'七种显示位置，默认 top-center；top/bottom 为兼容别名',offset:'与窗口边缘的距离，单位 px',zIndex:'浮层层级',showIcon:'显示状态图标，可通过 icon 插槽替换',pauseOnHover:'鼠标悬停时暂停剩余关闭时间',closeOnEscape:'按 Escape 关闭最近一条允许关闭的提示',repeat:'重复次数，大于 1 时显示次数标记',plain:'使用柔和背景',teleport:'是否渲染到浮层容器，false 时在原位置显示',appendTo:'浮层挂载目标，默认 body'}
  for(const prop of api[name].props)if(text[prop.name])prop.description=text[prop.name]
  for(const event of api[name].events)event.description=event.name==='close'?'开始关闭时触发':event.name==='afterClose'?'退出动画结束后触发':event.description
 }
 if(['HysTable','HysDataGrid','HysVirtualTable'].includes(name))api[name].slots.push({name:'[column.key]',type:'{ row: Record<string, unknown>; value: unknown; index?: number }',required:false,default:'',description:'与列 key 对应的单元格插槽，参数来自模板中的 slot 绑定。'})
}
fs.mkdirSync(path.join(root,'apps/docs/src/generated'),{recursive:true})
fs.writeFileSync(path.join(root,'apps/docs/src/generated/api.json'),JSON.stringify(api,null,2)+'\n')
console.log('Generated source-backed API for '+Object.keys(api).length+' components')
