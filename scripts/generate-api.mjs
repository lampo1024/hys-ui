import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import ts from 'typescript'
const root=fileURLToPath(new URL('..',import.meta.url)),require=createRequire(import.meta.url)
const {createChecker}=require('vue-component-meta')
const checker=createChecker(path.join(root,'packages/ui/tsconfig.json'),{schema:true})
const dir=path.join(root,'packages/ui/src/components'),api={}
const descriptions={modelValue:'受控值，配合 v-model 使用',disabled:'禁止用户操作',loading:'显示加载状态',min:'允许的最小值或最早日期',max:'允许的最大值或最晚日期',step:'每次调整的步长',showControls:'是否显示加减按钮',selectOnFocus:'输入框获得焦点时选中全部内容',options:'可选项数据，支持单项禁用',nodes:'树节点数据',items:'展示项目数据',rows:'行数据，由使用方提供',columns:'列定义',storageKey:'启用本地列配置持久化的隔离键',loadChildren:'展开节点时异步加载子节点，抛出错误后支持重试',open:'控制浮层显示',closeOnMask:'点击遮罩是否关闭',virtual:'启用可见区域虚拟渲染',draggable:'启用拖拽交互',page:'当前页，从 1 开始',pageSize:'每页条数',total:'总记录数',showQuickJumper:'显示页码跳转输入框',showSizeChanger:'显示每页条数选择器',multiSort:'允许多列排序',serverMode:'启用外部数据分页，通过事件请求新数据',editable:'允许编辑',multiple:'允许多选',popupMatchWidth:'浮层是否严格与选择框等宽；默认按内容扩展，并限制在视口内',filterMethod:'自定义本地搜索规则，参数为关键词与选项；remote 模式由调用方提供结果',fitContainer:'时间轴是否自动填满剩余容器宽度',height:'顶部、底部抽屉高度；未设置时使用 width',placeholder:'空值占位提示',ariaLabel:'辅助技术使用的控件名称',value:'显示或计算用数值',theme:'主题名称',duration:'动画时长，单位毫秒',label:'显示标签',title:'标题',emptyText:'空数据提示',searchable:'显示搜索输入框',viewportHeight:'虚拟视口高度',rowHeight:'每行高度',pinned:'固定在左侧或右侧',events:'日历事件数据'}
for(const name of fs.readdirSync(dir).sort()){
 const meta=checker.getComponentMeta(path.join(dir,name,name+'.vue'))
 const item=p=>({name:p.name,type:p.type||'',required:!!p.required,default:p.default??(!p.required&&/^boolean(?: \| undefined)?$/.test(p.type||'')?'false':''),description:p.description||descriptions[p.name]||'',...('global' in p?{global:p.global}:{})})
 api[name]={props:meta.props.filter(p=>!p.global).map(item),events:meta.events.map(item),slots:meta.slots.map(item),exposed:meta.exposed.filter(p=>!p.name.startsWith('$')).map(item)}
 if(fs.readFileSync(path.join(dir,name,name+'.vue'),'utf8').includes('useHysControlState'))for(const prop of api[name].props){if(prop.name==='size'){prop.default='继承字段/表单配置或 md';prop.description='控件尺寸；显式设置优先于字段与表单尺寸'}if(prop.name==='disabled')prop.description='禁止用户操作；同时继承所属字段或表单的禁用状态'}
 if(['HysForm','HysFormItem'].includes(name)){
  const common={rules:'规则或规则数组；支持字段专属规则与表单规则合并',size:'表单或字段的控件尺寸',labelPosition:'标签位于顶部，或左/右对齐的侧边',labelWidth:'侧边标签宽度，支持像素数值或 CSS 宽度',showLabel:'是否显示标签',showFeedback:'是否显示错误或警告区域；校验与输入语义不受影响',showRequiredMark:'是否显示必填标记',requiredMarkPosition:'必填标记在标签左侧或右侧',validateTrigger:'自动校验触发时机；手动校验始终应用全部规则'}
  const text=name==='HysForm'?{model:'表单数据对象；路径支持嵌套对象与数组',initialValues:'重置使用的初始数据；未指定时记录挂载时的数据',validate:'兼容整表自定义检查，接收含 AbortSignal 的上下文',validateMessages:'自定义规则引擎的提示消息',validateOnRuleChange:'规则变更后是否重新校验',disabled:'禁用全部控件并关闭相关浮层，取消过期检查',loading:'显示忙碌语义并禁用表单控件',inline:'字段和操作区行内排列',scrollToError:'提交失败后滚动到首个错误字段；可传 ScrollIntoViewOptions',focusOnError:'提交失败后聚焦首个错误字段'}:{prop:'字段路径：点号/括号字符串或路径数组',dependencies:'依赖字段路径；变化后重新检查当前字段',error:'由调用方控制的错误提示，优先于规则结果',warning:'由调用方控制的警告提示，不阻止提交',status:'显式反馈状态；未指定时使用规则结果',required:'显示必填语义；校验仍由 required 规则决定',hint:'持续显示的辅助说明，可与错误/警告并存',for:'显式关联的控件 ID',disabled:'禁用当前字段内的控件',feedbackIcon:'显示检查中、成功、警告或错误图标',noStyle:'不输出字段布局和标签，保留规则与上下文'}
  for(const prop of api[name].props)prop.description=text[prop.name]||common[prop.name]||prop.description
  const additions={layout:'vertical、horizontal 或 inline；未指定时保留 labelPosition / inline 用法',columns:'字段列数或容器断点配置；允许 xs、sm、md、lg、xl、xxl',span:'字段占据的列数或断点配置，不超过表单当前列数',gap:'字段间距，数值单位 px，也可传 CSS 长度',labelWidth:'标签宽度；auto 统一测量可见字段，支持数值或 CSS 长度',labelAlign:'标签文字左对齐或右对齐；可覆盖位置的默认对齐',labelWrap:'允许固定宽度标签换行',labelSuffix:'标签文本末尾附加的文字',colon:'横向标签末尾显示冒号',labelCol:'24 栅格中的标签 span / offset，支持断点覆盖',wrapperCol:'24 栅格中的控件 span / offset，支持断点覆盖',optionalMark:'非必填字段附加说明；默认不显示',inlineFeedback:'反馈与控件行内排列；空间不足时换行',feedbackIcon:'显示校验状态图标；字段值优先于表单设置',validateFirst:'字段遇到首个错误后停止；false 收集全部错误',preserve:'字段卸载时保留数据；false 会删除该路径的值',tooltip:'标签旁的补充说明，支持 tooltip 插槽',help:'替代自动反馈的消息；支持 help 插槽',extra:'持续显示的额外说明；可与错误同时显示',autoLink:'自动关联标签和控件 ID；复杂控件可设为 false 并手动关联',group:'将多个控件作为带名称的分组；未指定时自动检测'}
  for(const prop of api[name].props)prop.description=additions[prop.name]||prop.description
  const events={submit:'有效且未过期的提交，参数为表单数据快照',invalid:'提交未通过，参数包含 valid、cancelled、values、errors 和 warnings',reset:'完成重置，参数为字段路径列表',validate:'字段检查完成：path、是否有效、错误消息',validation:'整表或局部检查完成，参数为详细结果；已取消的请求不触发'}
  for(const event of api[name].events)event.description=events[event.name]||event.description
  const methods={validate:'检查全部或指定路径并返回 Promise<boolean>',validateFields:'validate 的别名，可传路径列表',validateResult:'返回包含取消状态、数据和反馈信息的完整结果',validateField:'检查单个路径；可指定自动触发类型',clearValidate:'清除指定或全部反馈并取消相应检查',resetFields:'重置指定或全部字段，并清除反馈',captureInitialValues:'记录当前值作为后续重置基线，支持指定路径',scrollToField:'滚动到注册字段，可传滚动配置',focusField:'聚焦注册字段中的可用控件',getField:'读取一个注册字段的上下文与操作方法',getFields:'读取当前注册字段列表',focus:'聚焦当前字段控件',resetField:'重置当前字段'}
  for(const exposed of api[name].exposed)exposed.description=methods[exposed.name]||exposed.description
  const extraMethods={validate:'检查全部或指定字段，返回 Promise<boolean>，可传完成回调；取消时不调用回调',validateField:'检查单个路径，可传 blur/change 或完成回调',fields:'当前注册字段上下文列表',submit:'执行校验并提交；返回结果，禁用或忙碌时不提交',setInitialValues:'合并更新重置基线，不修改当前表单值',setInitialValue:'设置当前字段的重置基线',getFieldValue:'读取单个字段的独立快照',getFieldsValue:'读取全部或指定字段的数据快照',setFieldValue:'赋值单个路径并取消过期检查，不自动校验',setFieldsValue:'深度合并对象并替换数组，不自动校验',setFields:'回填字段值、错误数组和警告数组',getFieldError:'读取指定字段的错误消息数组',getFieldsError:'读取全部或指定字段的错误与警告数组',errorMessages:'各字段全部错误消息，值为字符串数组',warningMessages:'各字段全部警告消息，值为字符串数组'}
  for(const exposed of api[name].exposed)exposed.description=extraMethods[exposed.name]||exposed.description
  const slotDescriptions={default:name==='HysForm'?'表单字段；接收 errors、warnings 与 validating':'字段内容；接收关联 ID、状态、错误、警告及尺寸配置',actions:'表单操作区；提供 validating、reset、errors、warnings',label:'自定义字段标签，提供 required 和 status',feedback:'自定义校验反馈，提供 error、warning、errors、warnings、status',help:'替代整个反馈区域',error:'自定义错误内容，提供 error 与 errors',warning:'自定义警告内容，提供 warning 与 warnings',hint:'自定义持续显示的辅助说明',extra:'额外说明内容，提供 status',tooltip:'标签提示内容'}
  for(const slot of api[name].slots)slot.description=slotDescriptions[slot.name]||slot.description
 }
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
 if(name==='HysSelect'){
  // Generic SFCs do not expose their instance through vue-component-meta.
  // Read the public, independently type-checked instance interface instead.
  const instanceFile=ts.createSourceFile('selectOptions.ts',fs.readFileSync(path.join(root,'packages/ui/src/composables/selectOptions.ts'),'utf8'),ts.ScriptTarget.Latest,true)
  const instance=instanceFile.statements.find(node=>ts.isInterfaceDeclaration(node)&&node.name.text==='HysSelectInstance')
  if(instance)api[name].exposed=instance.members.map(member=>({name:member.name.getText(instanceFile),type:member.type.getText(instanceFile),required:!member.questionToken,default:'',description:''}))
  const text={modelValue:'受控选择值；支持文本、数字、布尔值、对象及其数组，也可为 null',defaultValue:'非受控模式的初始选择值',options:'选项或分组数据；分组通过 options 字段提供子选项',fieldNames:'映射 label、value、options 和 disabled 的业务字段名',valueKey:'对象值的稳定标识路径；刷新选项时按此路径匹配',emptyValues:'视为空值的配置；null / undefined 始终表示未选，默认也将空字符串视为空值',clearValue:'单选清空后的值；默认空字符串，可显式设置 null',fallbackOption:'缺少对应选项时的显示项工厂；false 不显示回退项',multipleLimit:'多选数量上限；0 表示不限制',maxTagCount:'多选最多展示的标签数，其余以计数折叠',maxTagTextLength:'标签文字截断长度；完整内容保留在 title',removable:'允许移除单个多选标签',clearSearchAfterSelect:'多选后清除搜索词；默认保留',allowCreate:'允许输入并创建新选项，自动启用搜索输入',createOption:'确认创建时调用，返回选项；false / null 拒绝创建',tokenSeparators:'多选创建模式中用于批量输入的分隔符',clearCreatedOnClear:'清空选择时移除本组件创建的选项',remoteMethod:'异步搜索函数 (query, {signal})，返回选项数组；自动管理加载、取消、失败和重试',debounce:'remoteMethod 的防抖等待时间，单位毫秒；search 事件仍立即触发',searchValue:'受控搜索词，配合 v-model:searchValue',filterSort:'本地结果排序函数；不修改宿主数组',open:'受控浮层状态，配合 v-model:open；可拒绝展开或关闭请求',defaultOpen:'初次挂载时默认展开',showOnFocus:'触发器获得焦点时展开；关闭后的焦点恢复不会重新展开',retainSearch:'重新展开时保留上次搜索词',defaultActiveFirst:'没有已选项时激活首个可用项',keyboard:'启用方向键、首末项、翻页和输入首字母定位',popupWidth:'显式浮层宽度，数值单位 px；仍限制在可视区域内',placement:'优先展开位置；空间不足时自动调整',appendTo:'浮层挂载位置；false 保留在组件内，默认 body',popupClass:'额外浮层类名',popupStyle:'浮层样式；定位和尺寸由组件维护',listHeight:'选项滚动区域的最大高度，默认 256px',virtual:'长列表超过可见渲染阈值时启用虚拟滚动',itemHeight:'虚拟列表单行高度，包含行间距；默认随尺寸变化',overscan:'虚拟列表在可见范围前后额外渲染的行数',noMatchText:'本地搜索无匹配时的说明',loadingText:'加载中的说明',status:'显式校验状态；否则继承字段状态',showArrow:'显示展开箭头',showCheckmark:'显示选中图标',bordered:'显示控件边框',readonly:'允许查看和搜索，但不可选择、移除或创建',autofocus:'初次挂载时自动聚焦，禁用时不聚焦',name:'原生表单提交字段名；多选输出多个同名隐藏字段'}
  for(const prop of api[name].props)prop.description=text[prop.name]||prop.description
  const basics={filterable:'显示选项搜索输入框',clearable:'显示清空按钮；禁用和只读时隐藏',remote:'由调用方提供搜索结果，不应用本地筛选'}
  for(const prop of api[name].props)prop.description=basics[prop.name]||prop.description
  const eventText={change:'选择实际变化后触发：value、单个选项或选项数组',select:'选中选项：value、option',deselect:'取消选项：value、option',removeTag:'通过标签移除选项：value、option',create:'确认创建新选项时触发，参数为 option',reject:'批量输入超出上限或创建失败：value、limit/create',search:'搜索词提交后立即触发，中文组合输入结束后触发',searchError:'远程检查失败：error、query；已取消的请求不触发',focus:'整个控件首次获得焦点；在触发器与浮层间移动不重复触发',blur:'焦点离开触发器和浮层后触发',popupScroll:'选项滚动区域的原生滚动事件',reachEnd:'滚动到末尾时触发，可用于追加选项',visibleChange:'实际浮层状态变化；update:open 表示请求状态'}
  for(const event of api[name].events)event.description=eventText[event.name]||event.description
  const methodText={focus:'聚焦可用的触发器',blur:'移开当前控件内的焦点并请求关闭，不影响外部控件',open:'请求展开并聚焦搜索区域，返回 Promise<void>',close:'请求关闭浮层',scrollTo:'在已展开列表中按值定位，支持虚拟列表',retry:'立即重试当前远程搜索',selected:'当前选项数据列表',query:'当前实际搜索词',isOpen:'浮层实际是否展开'}
  for(const exposed of api[name].exposed)exposed.description=methodText[exposed.name]||exposed.description
  const slotText={label:'自定义整个选中内容，接收 selected 数组',option:'选项内容，接收 option、selected 和 created',tag:'单个多选标签，接收 option、remove、disabled',group:'分组标题，接收 label',header:'浮层顶部区域，接收 query、selected、close',footer:'浮层底部区域，接收 query、selected、close',empty:'无结果说明，接收 query',loading:'加载说明',error:'远程异常内容，接收 error、retry',suffix:'后缀图标，接收 open、loading','max-tag':'折叠标签内容，接收 omitted','clear-icon':'清空图标','remove-icon':'标签移除图标','selected-icon':'选中状态图标，接收 option'}
  for(const slot of api[name].slots)slot.description=slotText[slot.name]||slot.description
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
