import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('..',import.meta.url))
// The first three columns identify equivalents; a dash means no direct equivalent in that library.
const definitions=`
Accordion|collapse|collapse|collapse|受控展开、手风琴/多面板、禁用、标题/内容插槽、ARIA 关联|过渡高度动画
Alert|alert|alert|alert|四种语义、图标、关闭事件、受控显示、描述与插槽|横幅/跑马灯
AnimatedNumber|statistic|statistic|number-animation|受控数值、精度、时长、减少动态效果、卸载清理|本地化分组与复杂格式
Avatar|avatar|avatar|avatar|图片与文字、失败回退、尺寸、形状、fit、图片变更恢复|头像组
Badge|tag|tag|tag|语义标签、大小、圆角、可关闭、数字上限、圆点|标签组与批量选择
Breadcrumb|breadcrumb|breadcrumb|breadcrumb|层级、末项语义、自定义分隔、链接插槽、路由解耦|溢出折叠
Button|button|button|button|多种外观、尺寸、禁用/加载、图标插槽、形状、block、虚线、链接、安全 rel、原生类型、focus/blur|按钮组独立组件、加载延迟与波纹
Calendar|calendar|calendar|calendar|月导航、周一起始、日期选择、事件、禁用日期、日期插槽|周/年视图与本地化
CalendarNavigation|date-picker|date-picker|date-picker|年份/月快速定位、范围禁用、标题返回、UTC 月值|多语言与财务日历
Card|card|card|card|标题/描述、头部操作、页脚、加载、边框、阴影、内容样式|封面及悬浮动效
Cascader|cascader|cascader|cascader|路径选择、搜索、清空、父级可选、路径显示、禁用、键盘分级导航|多选、异步加载、自定义字段映射
Chart|-|-|-|柱状/折线图、数据、高度|专业图表库联动
Checkbox|checkbox|checkbox|checkbox|受控勾选、中间态、禁用/只读、原生 name/value/required、change、标签|独立 CheckboxGroup 与数量约束
ColorPicker|color-picker|color-picker|-|自定义 HSV 色板、色相、HEX 输入、自定义预设、禁用、清空、键盘微调|透明度、RGBA/HSL 多格式
ColorTokenEditor|-|-|-|颜色令牌编辑与受控数据|令牌继承与设计工具同步
CommandPalette|-|-|-|命令搜索、键盘导航、快捷键、选择、缓存停用清理|命令分组与远程建议
CommentEditor|-|comment|-|评论列表、发送/删除事件、时间与作者|嵌套回复与附件
ContextMenu|dropdown|dropdown|dropdown|视口避让、禁用项、选择、关闭与 Escape、缓存清理|多层子菜单
CronEditor|-|-|-|五段表达式、预设、基础格式反馈|完整语义解析与时区预览
DataGrid|table|table|data-table|固定列、多排序、筛选行、分组/树形、列显隐/拖拽/宽度、分页、汇总、编辑、CSV、远程查询、持久化恢复|合并单元格、横向虚拟化、复杂菜单
DatePicker|date-picker|date-picker|date-picker|自定义日历、周一起始、单日期、年月定位、范围/函数禁用、键盘、清空|时间选择、周/月/季度值模式与国际化
DateRangePicker|date-picker|date-picker|date-picker|单触发框、起止选择、反选/跨月、范围预览、禁用日期、年月定位、清空|双月面板、预设范围、时间精度
DiffViewer|-|-|-|双栏差异、增删内容呈现、相同内容边界|大文件增量算法与行内词级差异
Divider|divider|divider|divider|水平/垂直、文字插槽、分隔线方向、虚线、ARIA 方向|自定义分隔间距
Drawer|drawer|drawer|drawer|受控显示、四方向、宽度/高度、遮罩/Escape/关闭按钮、异步关闭守卫、焦点/滚动管理、销毁策略|拖拽调整尺寸与嵌套推移
Empty|empty|empty|empty|标题/描述、图片与图标插槽、尺寸、操作插槽|预置插画资源
FileManager|upload|upload|upload|本地文件列表、选择/拖入、上传/移除/下载事件|目录、服务端进度与断点续传
Form|form|form|form|规则、必填/范围/正则、自定义异步校验、字段错误、reset/clear/validate、禁用、布局、错误焦点|完整 Schema 表单与复杂依赖
FormItem|form|form|form|prop 绑定、错误/提示、必填语义、标签/控件关联、校验触发、插槽|跨字段联动和表单自动生成
Gantt|-|-|-|时间尺度、选择、进度、依赖、可编辑日期|关键路径与资源排程
Input|input|input|input|受控值、原生属性转发、清空、只读/禁用、密码显隐、字数、前后缀、附加内容、IME、焦点方法|输入掩码与多种格式器
JsonEditor|-|-|-|JSON 编辑、语法错误、格式化|Schema 补全和大型文档
Kanban|-|-|-|列/卡片、拖拽移动、选择器移动|跨列排序及虚拟泳道
Mention|mention|mentions|mention|受控内容、用户建议、键盘选择|异步源与自定义标记
Modal|dialog|modal|modal|受控显示、尺寸、全屏、遮罩/Escape/按钮策略、异步关闭守卫、焦点/滚动管理、销毁策略|可拖拽、服务式 API 与嵌套管理扩展
NotificationCenter|notification|notification|notification|消息列表、未读筛选、单项/全部已读、打开事件、空状态、禁用|服务式推送与堆叠通知
NumberInput|input-number|input-number|input-number|步长/精度、严格步进、上下界、只读/禁用、键盘、控制按钮开关、聚焦全选、focus/blur|自定义格式器/解析器与空值模型
OrgTree|tree|tree|tree|组织层级、搜索、选择、勾选|组织图连线布局与大树虚拟化
Pagination|pagination|pagination|pagination|首尾/前后页、页码、总数、每页条数、跳转、禁用/加载、紧凑布局、可配置标签|动态布局组合与国际化包
PermissionMatrix|checkbox|checkbox|checkbox|资源/角色勾选、受控映射、可访问名称|行列全选和权限继承
Popover|popover|popover|popover|点击/悬停/焦点、受控显示、定位、标题、宽度、禁用、内容插槽、外部/Escape 关闭|箭头/碰撞策略配置
Progress|progress|progress|progress|线形/环形、范围归一、状态颜色、粗细、格式器、进度语义、不定进度|仪表盘与分段进度
RadioGroup|radio|radio|radio|受控单选、选项/整体禁用、独立原生组、方向、change、可访问标签|按钮组外观与异步选项
Rating|rate|rate|rate|评分、半星、清空、只读/禁用、键盘、分值与图标插槽|自定义阈值色彩及提示文本
ResizablePanel|splitter|-|-|拖动/键盘调整、上下界、禁用、分隔条语义|吸附与折叠布局
RichTextEditor|-|-|-|受控 HTML、基础格式工具|文档模型、粘贴净化与扩展插件
Search|input|input|input|防抖、Enter 立即查询、清空、只读/禁用、加载、焦点、缓存停用清理|远程建议面板
Segmented|segmented|segmented|radio|受控选择、选项/整体禁用、方向键/Home/End、block、大小、标签插槽|图标布局与选择动画
Select|select|select|select|单/多选、搜索/远程搜索事件、清空、禁用、加载、空状态、插槽、大小、键盘、焦点方法|虚拟选项、分组与自定义值字段
ShortcutHelp|-|-|-|快捷键列表与说明|冲突检测与动态注册
Skeleton|skeleton|skeleton|skeleton|加载/内容切换、动画开关、标题、头像、行数与加载语义|任意形状骨架组合
Slider|slider|slider|slider|单值/范围、上下界/步长、禁用、原生键盘、刻度、显示格式|垂直模式、吸附与浮动提示
SortableList|-|-|-|手柄拖拽、目标指示、释放动画、按钮/Alt 键排序、禁用、插槽|跨列表拖放和嵌套排序
SplitPane|splitter|-|-|方向、受控比例、上下界、禁用、拖动/键盘、分隔条语义|多分栏、吸附、折叠
Steps|steps|steps|steps|步骤与描述、当前/完成/错误、方向、可选跳转、禁用项、事件|连线自适应和自定义图标
Switch|switch|switch|switch|受控开关、禁用/加载、文字、异步前置守卫、失败事件、原生按钮语义|自定义值和图标动画
Table|table|table|table|稳定行键、列宽/对齐、单列排序、斑马纹/边框/密度、加载/空态、行事件、单元格插槽|复杂能力由 DataGrid 承接，后续合并单元格
Tabs|tabs|tabs|tabs|受控页签、禁用、方向键/Home/End、卡片/垂直、关闭事件、标签/内容插槽|新增、拖动与溢出菜单
TagInput|input-tag|select|dynamic-tags|添加/删除/清空草稿、上限/去重、禁用/只读、分隔符、添加守卫、IME、事件|拖动标签与异步验证
Textarea|input|input|input|受控输入、原生属性、只读/禁用、字数、IME、自适应高度、缩放策略、焦点方法|格式器及富文本
Timeline|timeline|timeline|timeline|内容/时间/状态、颜色、反向、待处理项、插槽|左右交替模式
Toast|message|message|message|类型、自动关闭、持久显示、悬停暂停、位置、关闭按钮、可访问播报、缓存清理|全局服务与多消息堆叠
Tooltip|tooltip|tooltip|tooltip|自定义位置、延时、禁用、hover/focus、内容插槽、唯一关联 ID、缓存清理|受控显示与交互式内容
Tour|tour|tour|-|受控显示/步骤、前后导航、跳过/完成事件、键盘关闭、焦点与滚动管理|目标元素聚光和跨页面引导
Transfer|transfer|transfer|transfer|搜索、勾选移动、双向拖拽、目标/释放动画、标题、禁用、选项插槽、空态|远程分页与可搜索分组
Tree|tree|tree|tree|搜索、受控选择/展开/勾选、严格勾选、键盘、禁用、虚拟行、异步重试、拖放、上下文菜单、实例方法|动态节点增删与字段映射
TreeSelect|tree-select|tree-select|tree-select|层级、搜索、单/多选、叶子限制、清空、禁用继承、键盘、选项插槽|异步/虚拟大树与完整父子勾选策略
Upload|upload|upload|upload|选择/拖入、键盘、accept、数量/大小限制、异步检查、列表、移除/清空、宿主上传事件|网络请求适配、进度/重试与目录上传
VirtualTable|table-v2|table|data-table|行虚拟化、横向滚动、稳定行键、加载/空态、表头/单元格插槽|横向虚拟化与动态行高
`.trim().split('\n').map(line=>{const[name,element,ant,naive,core,later]=line.split('|');return {name:'Hys'+name,element,ant,naive,core,later}})
const names=fs.readdirSync(path.join(root,'packages/ui/src/components')).sort()
if(JSON.stringify(names)!==JSON.stringify(definitions.map(x=>x.name).sort()))throw Error('Comparison must cover every component exactly once')
const link=(library,slug)=>slug==='-'?'—':`[${slug}](${library==='element'?'https://element-plus.org/en-US/component/'+slug+'.html':library==='ant'?'https://antdv.com/components/'+slug:'https://github.com/tusen-ai/naive-ui/blob/main/src/'+slug+'/demos/enUS/index.demo-entry.md'})`
let text=`# 组件能力对标与边界\n\n本轮覆盖全部 69 个组件。按用户确认的范围，对能对应的组件完善核心场景，复杂高级能力分版本迭代。参考实现的 API 命名与 HYS UI 保持独立。\n\n官方参考：[Element Plus](https://element-plus.org/en-US/component/overview.html)、[Ant Design Vue](https://antdv.com/components/overview)、[Naive UI](https://github.com/tusen-ai/naive-ui/tree/main/src)。表中的链接直接指向对应组件文档，— 表示无直接对应组件。组合场景会参考相关基础控件。\n\n“核心能力”记录当前实现，可在每个组件的文档页面运行；“后续高级能力”明确列出本轮没有承诺的能力。日期值当前使用 ISO 日期字符串，上传/文件管理的服务端请求由宿主实现。\n\n| HYS UI | Element Plus | Ant Design Vue | Naive UI | 本轮核心能力 | 后续高级能力 |\n|---|---|---|---|---|---|\n`
for(const item of definitions)text+=`| ${item.name} | ${link('element',item.element)} | ${link('ant',item.ant)} | ${link('naive',item.naive)} | ${item.core} | ${item.later} |\n`
text+='\n## 验证方式\n\n- 源码类型与 API 元信息、69 个独立页面及其真实示例完整性检查。\n- Node 行为回归验证受控值、禁用、异步校验、键盘、浮层与缓存清理。\n- 浏览器逐页冒烟和重点交互验证，检查控制台、复制源码、主题与窄屏。\n- 独立 Vue 消费项目从打包产物安装，验证类型、样式隔离、单 Vue 实例和按需构建。\n- 平台作为第二个消费方验证业务页面、缓存与切换动画。\n'
fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs/COMPONENT_PARITY.md'),text)
fs.writeFileSync(path.join(root,'apps/docs/src/generated/parity.json'),JSON.stringify(definitions,null,2)+'\n')
console.log('Generated 69-component comparison and explicit follow-up boundaries')
