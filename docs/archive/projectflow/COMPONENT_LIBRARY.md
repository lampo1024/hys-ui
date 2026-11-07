> 历史设计记录。当前 API、命名和功能以独立组件文档与源码为准。

# ProjectFlow 完整组件库参考手册

> 基于 V9 源码静态核对，共 **45 个** Vue 单文件组件。本文档记录源码可见的接口，不把尚未通过浏览器测试的行为描述为已验证。

## 目录

- [基础与展示](#基础展示)：11 个
- [表单与选择](#表单选择)：18 个
- [导航与布局](#导航布局)：6 个
- [浮层与反馈](#浮层反馈)：6 个
- [数据与业务](#数据业务)：4 个

## 快速开始

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

组件按需相对路径导入；本项目未建立全局组件注册，也没有发布 npm 包。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import HysButton from './components/HysButton/HysButton.vue'
import HysInput from './components/HysInput/HysInput.vue'
const keyword = ref('')
</script>
<template>
  <HysInput v-model="keyword" />
  <HysButton @click="console.log(keyword)">搜索</HysButton>
</template>
```

> 上例的路径假设代码位于 `src/` 下；业务页面应使用 `../components/...`。

## 组件索引

| 组件 | 用途 | 源码 |
|---|---|---|
| [HysAccordion](#uiaccordion) | 通用 UI 组件 | `src/components/HysAccordion/HysAccordion.vue` |
| [HysAlert](#uialert) | 通用 UI 组件 | `src/components/HysAlert/HysAlert.vue` |
| [HysAnimatedNumber](#uianimatednumber) | 工作台 KPI 数值变化 | `src/components/HysAnimatedNumber/HysAnimatedNumber.vue` |
| [HysAvatar](#uiavatar) | 通用 UI 组件 | `src/components/HysAvatar/HysAvatar.vue` |
| [HysBadge](#uibadge) | 通用 UI 组件 | `src/components/HysBadge/HysBadge.vue` |
| [HysBreadcrumb](#uibreadcrumb) | 通用 UI 组件 | `src/components/HysBreadcrumb/HysBreadcrumb.vue` |
| [HysButton](#uibutton) | 通用 UI 组件 | `src/components/HysButton/HysButton.vue` |
| [HysCard](#uicard) | 通用 UI 组件 | `src/components/HysCard/HysCard.vue` |
| [HysCascader](#uicascader) | 多级分类路径选择 | `src/components/HysCascader/HysCascader.vue` |
| [HysCheckbox](#uicheckbox) | 通用 UI 组件 | `src/components/HysCheckbox/HysCheckbox.vue` |
| [HysColorPicker](#uicolorpicker) | 通用 UI 组件 | `src/components/HysColorPicker/HysColorPicker.vue` |
| [HysCommandPalette](#uicommandpalette) | 键盘命令搜索与导航 | `src/components/HysCommandPalette/HysCommandPalette.vue` |
| [HysDatePicker](#uidatepicker) | 通用 UI 组件 | `src/components/HysDatePicker/HysDatePicker.vue` |
| [HysDateRangePicker](#uidaterangepicker) | 起止日期范围选择 | `src/components/HysDateRangePicker/HysDateRangePicker.vue` |
| [HysDivider](#uidivider) | 通用 UI 组件 | `src/components/HysDivider/HysDivider.vue` |
| [HysDrawer](#uidrawer) | 通用 UI 组件 | `src/components/HysDrawer/HysDrawer.vue` |
| [HysEmpty](#uiempty) | 通用 UI 组件 | `src/components/HysEmpty/HysEmpty.vue` |
| [HysGantt](#uigantt) | 项目排期、任务依赖与进度时间轴 | `src/components/HysGantt/HysGantt.vue` |
| [HysInput](#uiinput) | 通用 UI 组件 | `src/components/HysInput/HysInput.vue` |
| [HysModal](#uimodal) | 通用 UI 组件 | `src/components/HysModal/HysModal.vue` |
| [HysNumberInput](#uinumberinput) | 通用 UI 组件 | `src/components/HysNumberInput/HysNumberInput.vue` |
| [HysPagination](#uipagination) | 通用 UI 组件 | `src/components/HysPagination/HysPagination.vue` |
| [HysPopover](#uipopover) | 通用 UI 组件 | `src/components/HysPopover/HysPopover.vue` |
| [HysProgress](#uiprogress) | 通用 UI 组件 | `src/components/HysProgress/HysProgress.vue` |
| [HysRadioGroup](#uiradiogroup) | 通用 UI 组件 | `src/components/HysRadioGroup/HysRadioGroup.vue` |
| [HysRating](#uirating) | 通用 UI 组件 | `src/components/HysRating/HysRating.vue` |
| [HysSearch](#uisearch) | 通用 UI 组件 | `src/components/HysSearch/HysSearch.vue` |
| [HysSegmented](#uisegmented) | 通用 UI 组件 | `src/components/HysSegmented/HysSegmented.vue` |
| [HysSelect](#uiselect) | 通用 UI 组件 | `src/components/HysSelect/HysSelect.vue` |
| [HysSkeleton](#uiskeleton) | 通用 UI 组件 | `src/components/HysSkeleton/HysSkeleton.vue` |
| [HysSlider](#uislider) | 通用 UI 组件 | `src/components/HysSlider/HysSlider.vue` |
| [HysSortableList](#uisortablelist) | 任务、列表的交互排序 | `src/components/HysSortableList/HysSortableList.vue` |
| [HysSteps](#uisteps) | 通用 UI 组件 | `src/components/HysSteps/HysSteps.vue` |
| [HysSwitch](#uiswitch) | 通用 UI 组件 | `src/components/HysSwitch/HysSwitch.vue` |
| [HysTable](#uitable) | 通用 UI 组件 | `src/components/HysTable/HysTable.vue` |
| [HysTabs](#uitabs) | 通用 UI 组件 | `src/components/HysTabs/HysTabs.vue` |
| [HysTagInput](#uitaginput) | 通用 UI 组件 | `src/components/HysTagInput/HysTagInput.vue` |
| [HysTextarea](#uitextarea) | 通用 UI 组件 | `src/components/HysTextarea/HysTextarea.vue` |
| [HysTimeline](#uitimeline) | 通用 UI 组件 | `src/components/HysTimeline/HysTimeline.vue` |
| [HysToast](#uitoast) | 通用 UI 组件 | `src/components/HysToast/HysToast.vue` |
| [HysTooltip](#uitooltip) | 通用 UI 组件 | `src/components/HysTooltip/HysTooltip.vue` |
| [HysTransfer](#uitransfer) | 成员/权限双栏分配 | `src/components/HysTransfer/HysTransfer.vue` |
| [HysTreeSelect](#uitreeselect) | 树形组织、项目目录选择 | `src/components/HysTreeSelect/HysTreeSelect.vue` |
| [HysUpload](#uiupload) | 通用 UI 组件 | `src/components/HysUpload/HysUpload.vue` |
| [HysVirtualTable](#uivirtualtable) | 固定行高大数据列表 | `src/components/HysVirtualTable/HysVirtualTable.vue` |

## 基础与展示

### HysButton

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysButton/HysButton.vue`。

**Props（源码类型定义摘录）**

```ts
variant?:'primary'|'secondary'|'ghost'|'danger';size?:'sm'|'md'|'lg';disabled?:boolean;loading?:boolean
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`。


### HysCard

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysCard/HysCard.vue`。

**Props（源码类型定义摘录）**

```ts
title?:string;subtitle?:string
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`, `action`。


### HysBadge

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysBadge/HysBadge.vue`。

**Props（源码类型定义摘录）**

```ts
tone?:'blue'|'green'|'orange'|'red'|'purple'|'gray'
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`。


### HysAvatar

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysAvatar/HysAvatar.vue`。

**Props（源码类型定义摘录）**

```ts
name:string;src?:string;size?:number
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysDivider

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysDivider/HysDivider.vue`。

**Props（源码类型定义摘录）**

```ts
label?:string
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysSkeleton

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSkeleton/HysSkeleton.vue`。

**Props（源码类型定义摘录）**

```ts
lines?:number
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysEmpty

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysEmpty/HysEmpty.vue`。

**Props（源码类型定义摘录）**

```ts
title?:string;description?:string
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`。


### HysAlert

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysAlert/HysAlert.vue`。

**Props（源码类型定义摘录）**

```ts
tone?:'info'|'success'|'warning'|'danger';title?:string;closable?:boolean
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`。


### HysProgress

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysProgress/HysProgress.vue`。

**Props（源码类型定义摘录）**

```ts
value:number;showLabel?:boolean;color?:string
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysAnimatedNumber

**用途：** 工作台 KPI 数值变化。
**源码：** `src/components/HysAnimatedNumber/HysAnimatedNumber.vue`。

**Props（源码类型定义摘录）**

```ts
value:number;duration?:number;decimals?:number
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysRating

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysRating/HysRating.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:number;max?:number;readonly?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:number]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。


## 表单与选择

### HysInput

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysInput/HysInput.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue?:string;placeholder?:string;type?:string;disabled?:boolean;error?:string;clearable?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysTextarea

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTextarea/HysTextarea.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue?:string;label?:string;placeholder?:string;rows?:number;maxlength?:number;disabled?:boolean;error?:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysNumberInput

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysNumberInput/HysNumberInput.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:number;min?:number;max?:number;step?:number;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:number]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysCheckbox

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysCheckbox/HysCheckbox.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:boolean;label?:string;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[v:boolean]
```

**Slots：** `default`。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysSwitch

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSwitch/HysSwitch.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:boolean;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[v:boolean]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysRadioGroup

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysRadioGroup/HysRadioGroup.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;options:{label:string;value:string;disabled?:boolean}[];name?:string;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysSegmented

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSegmented/HysSegmented.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;options:{label:string;value:string}[];disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysSlider

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSlider/HysSlider.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:number;min?:number;max?:number;step?:number;disabled?:boolean;label?:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:number]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysSelect

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSelect/HysSelect.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;options:{label:string;value:string;disabled?:boolean}[];disabled?:boolean;placeholder?:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[v:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysTreeSelect

**用途：** 树形组织、项目目录选择。
**源码：** `src/components/HysTreeSelect/HysTreeSelect.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;nodes:Node[];placeholder?:string;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysCascader

**用途：** 多级分类路径选择。
**源码：** `src/components/HysCascader/HysCascader.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string[];options:Node[];disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string[]]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysTransfer

**用途：** 成员/权限双栏分配。
**源码：** `src/components/HysTransfer/HysTransfer.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string[];options:Item[]
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string[]]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysTagInput

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTagInput/HysTagInput.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string[];max?:number;placeholder?:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string[]]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysSearch

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSearch/HysSearch.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;placeholder?:string;delay?:number
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string];search:[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysColorPicker

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysColorPicker/HysColorPicker.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysDatePicker

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysDatePicker/HysDatePicker.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;disabled?:boolean
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[v:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysDateRangePicker

**用途：** 起止日期范围选择。
**源码：** `src/components/HysDateRangePicker/HysDateRangePicker.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:[string,string];min?:string;max?:string
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:[string,string]]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysUpload

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysUpload/HysUpload.vue`。

**Props（源码类型定义摘录）**

```ts
// 此组件未定义 Props
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。



## 导航与布局

### HysTabs

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTabs/HysTabs.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:string;items:{label:string;value:string}[]
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[v:string]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。

### HysBreadcrumb

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysBreadcrumb/HysBreadcrumb.vue`。

**Props（源码类型定义摘录）**

```ts
items:{label:string;href?:string}[]
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysSteps

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysSteps/HysSteps.vue`。

**Props（源码类型定义摘录）**

```ts
items:string[];current:number
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysAccordion

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysAccordion/HysAccordion.vue`。

**Props（源码类型定义摘录）**

```ts
items:{title:string;content:string}[];multiple?:boolean
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysTimeline

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTimeline/HysTimeline.vue`。

**Props（源码类型定义摘录）**

```ts
items:{title:string;time:string;description?:string;status?:'done'|'current'|'pending'}[]
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysPagination

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysPagination/HysPagination.vue`。

**Props（源码类型定义摘录）**

```ts
page:number;total:number;pageSize?:number
```

**Emits（源码类型定义摘录）**

```ts
change:[page:number]
```

**Slots：** 未检测到 `<slot>` 插槽。



## 浮层与反馈

### HysModal

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysModal/HysModal.vue`。

**Props（源码类型定义摘录）**

```ts
open:boolean;title:string;width?:string;closeOnMask?:boolean
```

**Emits（源码类型定义摘录）**

```ts
close:[]
```

**Slots：** `default`, `footer`。


### HysDrawer

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysDrawer/HysDrawer.vue`。

**Props（源码类型定义摘录）**

```ts
open:boolean;title:string;width?:string
```

**Emits（源码类型定义摘录）**

```ts
close:[]
```

**Slots：** `default`, `footer`。


### HysPopover

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysPopover/HysPopover.vue`。

**Props（源码类型定义摘录）**

```ts
placement?:Placement
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`, `trigger`。

**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysTooltip

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTooltip/HysTooltip.vue`。

**Props（源码类型定义摘录）**

```ts
text:string
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** `default`。

**浮层注意：** 需要在滚动容器、缩放、屏幕边缘、弹窗嵌套等情况下进行回归测试。

### HysToast

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysToast/HysToast.vue`。

**Props（源码类型定义摘录）**

```ts
message:string;type?:'success'|'error'|'info'
```

**Emits（源码类型定义摘录）**

```ts
close:[]
```

**Slots：** 未检测到 `<slot>` 插槽。


### HysCommandPalette

**用途：** 键盘命令搜索与导航。
**源码：** `src/components/HysCommandPalette/HysCommandPalette.vue`。

**Props（源码类型定义摘录）**

```ts
actions:Action[]
```

**Emits（源码类型定义摘录）**

```ts
select:[id:string]
```

**Slots：** 未检测到 `<slot>` 插槽。



## 数据与业务

### HysTable

**用途：** 通用界面展示与交互组件。
**源码：** `src/components/HysTable/HysTable.vue`。

**Props（源码类型定义摘录）**

```ts
columns:{key:string;label:string;width?:string}[];rows:T[];emptyText?:string
```

**Emits（源码类型定义摘录）**

```ts
rowClick:[row:T]
```

**Slots：** `default`。


### HysVirtualTable

**用途：** 固定行高大数据列表。
**源码：** `src/components/HysVirtualTable/HysVirtualTable.vue`。

**Props（源码类型定义摘录）**

```ts
rows:Row[];columns:Column[];rowHeight?:number;height?:number
```

**Emits（源码类型定义摘录）**

```ts
// 源码中未声明 Emits
```

**Slots：** 未检测到 `<slot>` 插槽。

**性能与数据注意：** 使用业务真实数据前，应验证大量数据、状态同步、编辑权限和保存失败的回滚。

### HysSortableList

**用途：** 任务、列表的交互排序。
**源码：** `src/components/HysSortableList/HysSortableList.vue`。

**Props（源码类型定义摘录）**

```ts
modelValue:Item[]
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[value:Item[]]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**性能与数据注意：** 使用业务真实数据前，应验证大量数据、状态同步、编辑权限和保存失败的回滚。

### HysGantt

**用途：** 项目排期、任务依赖与进度时间轴。
**源码：** `src/components/HysGantt/HysGantt.vue`。

**Props（源码类型定义摘录）**

```ts
items:GanttItem[];modelValue?:string|number|null;scale?:Scale;editable?:boolean;rowHeight?:number;labelWidth?:number
```

**Emits（源码类型定义摘录）**

```ts
'update:modelValue':[id:string|number|null];'update:items':[items:GanttItem[]];change:[item:GanttItem];open:[item:GanttItem]
```

**Slots：** 未检测到 `<slot>` 插槽。

**双向绑定：** 支持 `v-model`（请核对 `update:modelValue` 的事件签名与值类型）。
**性能与数据注意：** 使用业务真实数据前，应验证大量数据、状态同步、编辑权限和保存失败的回滚。

## 甘特图完整示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import HysGantt, { type GanttItem } from '../components/HysGantt/HysGantt.vue'
const tasks = ref<GanttItem[]>([
  { id: 1, title: '需求评审', start: '2026-11-09', end: '2026-11-11', progress: 100, owner: '产品' },
  { id: 2, title: '功能开发', start: '2026-11-12', end: '2026-11-20', progress: 35, owner: '开发', dependencies: [1] }
])
const selectedId = ref<string | number | null>(null)
function onChange(item: GanttItem) { console.log('需要调用后端持久化', item) }
</script>
<template>
  <HysGantt v-model="selectedId" v-model:items="tasks" editable
    scale="day" @change="onChange" @open="item => console.log(item)" />
</template>
```

**GanttItem 类型：**

```ts
export interface GanttItem {
  id: string | number
  title: string
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
  progress?: number // 0..100
  owner?: string
  status?: string
  dependencies?: Array<string | number>
  color?: string
  disabled?: boolean
}
```

**甘特图边界条件：** 无效日期条目被隐藏；拖动修改通过 `update:items` 返回新数组，组件不负责 API 保存；依赖线仅可视化，不做关键路径/冲突校验；未实现海量任务行虚拟化。

## 主题、动效与基础设施

- `src/composables/useTheme.ts`：主题切换与持久化。
- `src/styles/main.css`：基础变量与全局样式。
- `src/motion/useMotion.ts`：动效模式管理。
- `src/motion/reveal.ts`：滚动进入视口动效。
- `src/styles/motion.css`：动效 CSS 与减少动画支持。
- `src/composables/useFloating.ts`：浮层定位、滚动重定位。
- `src/composables/overlayManager.ts`：浮层堆栈。
- `src/composables/useDialog.ts`：弹窗焦点与滚动管理。

## 接入与开发约定

1. 一个组件一个目录，Props/Emits 使用 TypeScript 类型声明；不要直接修改传入的 props。
2. 业务端负责远程数据加载、权限校验、API 保存、失败重试与冲突处理。
3. 复杂选择器在表格滚动容器、Drawer 和 Modal 内验证 Teleport、焦点恢复与层级。
4. 交互优先保证键盘可达与 `prefers-reduced-motion`，动画不得阻塞业务操作。
5. 新组件补充演示页、Props/Emits 说明、交互边界测试后再纳入公共组件。

## 测试与已知限制

- 运行 `npm run check:contracts`、`npm run typecheck`、`npm run build`。
- 建议增加 Vitest + Vue Test Utils 组件测试及 Playwright 端到端测试。
- 当前交付未提供所有组件的完整浏览器自动化测试通过证明；本文档不构成生产级认证。
- 甘特图触屏编辑、依赖冲突检测、超大数据性能、复杂工作日历尚未覆盖。
- 更多历史限制参见根目录 `V6_STABILITY_REPORT.md`、`MOTION_V8.md`、`GANTT_V9.md`。


## HysDataGrid — 高级数据表格（V10）

源码：`src/components/HysDataGrid/HysDataGrid.vue`；演示：`src/pages/DataGridPage.vue`。

支持列宽拖动（Pointer Events）、表头拖放调整顺序、列显隐、列设置菜单内按钮排序、浏览器本地保存列设置、全列搜索、按列文本过滤、单列升降序排序、客户端分页、跨页勾选、CSV 导出、三种密度、加载与空状态、插槽自定义单元格。

### Props

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `columns` | `GridColumn[]` | 必填 | 列配置 |
| `rows` | `Record<string,unknown>[]` | 必填 | 行数据 |
| `rowKey` | `string` | `id` | 稳定行标识字段，业务中必须唯一 |
| `pageSize` | `number` | `10` | 每页条数 |
| `storageKey` | `string` | 无 | 列设置本地存储命名空间 |
| `selectable` | `boolean` | `true` | 是否允许勾选 |
| `loading` | `boolean` | `false` | 加载状态 |
| `emptyText` | `string` | `暂无数据` | 空状态文案 |
| `density` | `compact\|normal\|comfortable` | `normal` | 行密度 |

`GridColumn` 字段：`key`、`label`、`width`、`minWidth`、`maxWidth`、`sortable`、`filterable`、`hideable`、`resizable`、`reorderable`（预留）、`pinned`（预留）、`align`。`reorderable` 和 `pinned` 当前**尚未实现行为**，不要作为已支持功能使用。

### Emits

`rowClick(row)`、`selectionChange(keys)`、`columnsChange(keys)`、`sortChange(sort)`、`pageChange(page)`。

### 插槽

每列使用与 `column.key` 同名的具名插槽，例如 `#status="{ row, value }"`。

### 示例

```vue
<HysDataGrid :columns="columns" :rows="rows" row-key="id"
  storage-key="project-tasks" :page-size="20"
  @selection-change="onSelectionChange">
  <template #status="{ value }"><strong>{{ value }}</strong></template>
</HysDataGrid>
```

### 约束与注意事项

1. 排序、搜索、过滤和分页在浏览器内完成，不适用于直接加载百万行数据；大数据请在服务端实现并扩展远程模式。
2. 表头原生拖放适用于桌面端；移动端可通过列设置面板的左右移动按钮操作。
3. 表头排序与筛选是单列实现；多列排序、分组、树形行、冻结列、虚拟滚动联动仍需单独扩展。
4. `storageKey` 仅持久化列顺序、列宽和隐藏状态，不持久化行选择、筛选与排序。
5. CSV 导出的是**当前过滤/排序后的全部记录**，而非仅当前页。
6. 自定义单元格插槽内容应自行处理 HTML 安全；默认单元格使用 Vue 文本转义。


## HysDataGrid V12 新增 API

- `groupable`：启用当前页单列分组及折叠。
- `showSummary`：显示汇总行。
- `columns[].summary`：`sum`、`avg`、`min`、`max`、`count`。

详见项目根目录 `DATAGRID_V12.md`。
