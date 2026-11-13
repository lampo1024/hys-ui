<template>
  <section class="notes">
    <h2>日期类型与格式</h2>
    <p>
      默认保留字符串绑定：date 为 YYYY-MM-DD，month 为 YYYY-MM，year 为
      YYYY，quarter 为 YYYY-[Q]Q。week 返回所在周的起始日期，默认展示 ISO
      周编号。dates、weeks、months、quarters、years 选择多个值。HysDatePicker 的
      daterange、weekrange、monthrange、 quarterrange、yearrange、datetimerange
      和 HysDateRangePicker 均返回两个端点。 picker 可覆盖选取粒度，v-model 或
      v-model:value 都可绑定。
    </p>
    <p>
      valueType 可以指定 string、date 或
      timestamp；未指定时从已有值推断，空值默认使用字符串。Date
      和时间戳使用本地日期与时刻，时间戳单位为毫秒；数字 0 是有效值。valueFormat
      改变字符串绑定格式，format 只改变展示。支持 YYYY、M / MM、D / DD、H /
      HH、m / mm、s / ss、Q、GGGG、WW， 以及方括号字面量。MMM / MMMM 和 dd / ddd
      / dddd 使用 locale 的月名和星期名；h / hh 配合 A / a 可区分上午和下午。 x
      / X 分别表示毫秒和秒的字符串时间戳。
    </p>
    <p>
      editable 开启直接输入。format 可以传字符串、格式函数或数组，
      数组首项用于展示，字符串项和 inputFormats 均可解析。 格式函数接收本地
      Date，可搭配字符串格式支持录入。输入必须是有效日期。Enter
      或离开控件提交，Esc 取消；inputReadonly
      阻止文本编辑，仍允许打开面板。multiple 模式使用面板逐项切换。
    </p>
  </section>
  <section class="notes">
    <h2>周选择与跨年周</h2>
    <p>
      week 选择一周，weeks 选择不连续的多周，范围选择器 type="week"
      选择周区间。默认绑定值为各周起始日期；change 与 value-change 的 weeks
      元数据提供 year、week、start、end 和 dates，范围的完整覆盖日期为首周 start
      至末周 end。清空时对应元数据为空，不提前提交面板草稿。
    </p>
    <p>
      默认 firstDayOfWeek=1、firstWeekContainsDate=4，采用 ISO 周规则；GGGG
      表示周所属年，WW 表示周编号，跨年时应组合使用
      GGGG-[W]WW。firstWeekContainsDate 可设置
      1–7，表示包含一月该日的周为第一周。面板周编号、格式化和文本解析使用相同规则，无效第
      53 周不会自动进位。
    </p>
    <p>
      disabledWeek 按周元数据禁用整周。weekValidation='any'
      保持至少一天可用的规则，'full' 要求七天都通过 min / max / disabledDate
      校验；两者均遵守 disabledWeek。面板、快捷选择、文本输入与 setValue
      使用相同校验。weekNumberFormatter 定制周编号文本，week-number
      插槽定制内容；点击编号也可选周。数量限制与确认取消规则同其他多值日期类型。
      周范围的 minRangeDays / maxRangeDays
      按完整周覆盖天数计算，rangeValidation='continuous'
      会检查中间各周以及最后一周的全部日期。
    </p>
  </section>
  <section class="notes">
    <h2>选择与确认</h2>
    <p>
      单日期和普通范围默认立即提交；范围的第一个端点只更新草稿。多日期、日期时间和开放区间默认需要确认，showConfirm
      可覆盖。确定前的草稿不会改变绑定值；取消、关闭和缓存页面离开会放弃草稿。calendarChange
      报告草稿，change 是一次值更新请求，value-change 和表单 change
      校验只在宿主接受后发生，ok 表示有效确认。
    </p>
    <p>
      defaultValue 用作非受控初始值，defaultPickerValue 指定初始浏览位置。
      范围可传两个浏览日期，也可用 v-model:panelValues 分别控制两侧位置。
      panelValue 控制左侧，mode 控制视图，open 控制显隐。 valueOnClear 优先于
      clearValue，可传值或点击清空时求值的函数。 emptyValues
      声明额外的空值。默认字符串单选为空字符串， Date / timestamp 单选为
      null，多选为空数组，范围为两个对应空值。
    </p>
  </section>
  <section class="notes">
    <h2>禁用与范围规则</h2>
    <p>
      min、max 限制日期或时刻。disabledDate 保留旧接口，接收当天 UTC 零时的
      Date；使用 getUTCFullYear / getUTCMonth / getUTCDate / getUTCDay
      读取日期。第二个参数包含
      iso、range、from，便于按起止角色和已选开始日判断，from 为范围开始端的本地
      Date。 月、季度和年选项在其周期内存在可用日期时允许选择。
    </p>
    <p>
      范围自动整理反向点击的日期。minRangeDays / maxRangeDays
      按包含首尾的自然日计数；rangeValidation 默认为 endpoints，continuous
      还检查中间日期，连续检查跨度最多一百年。disabled 可以是布尔值或
      [开始禁用,结束禁用]；固定端点在清空时保留。allowEmpty
      分别允许开放起止边界，弹层提供单独清除操作。
    </p>
    <p>
      showTime 或 datetime / datetimerange 启用时间选项。defaultTime 支持
      HH:mm[:ss] 或本地 Date，范围可分别设置；showTime 也可配置默认时刻、步长、
      12 小时制和隐藏禁用项。dateFormat、timeFormat 启用面板内的直接输入，
      arrowControl 提供步进按钮。disabledHours / disabledMinutes /
      disabledSeconds 与 disabledTime
      合并。隐藏秒列表时会保留已有秒值，直接输入时刻按指定格式解析。
    </p>
    <p>
      日期范围也可用 defaultTime 为开始和结束日期附加时刻。使用
      Date、时间戳或含时刻的 valueFormat 可保留这两个时刻，面板仍按日期选择。
    </p>
  </section>
  <section class="notes">
    <h2>面板与定制</h2>
    <p>
      默认每周从星期一开始，firstDayOfWeek 使用 0–6 表示周日到周六；locale
      控制月份、星期名称，messages 覆盖操作文字。周编号使用 ISO
      规则。年份面板可继续浏览年代；日期时间选择器可切换到 time 视图。
    </p>
    <p>
      shortcuts、presets、ranges
      接收静态值或点击时计算的函数，遵守相同禁用规则。 shortcutPlacement='start'
      将快捷项放在面板起始侧，窄屏回到顶部。范围默认
      singlePanel=true，关闭后显示两个面板；unlinkPanels
      允许分别浏览。窄屏可点击月份跳转，或在浮层内横向滑动。inline
      直接嵌入面板。placement、fallbackPlacements 配置定位，appendTo、
      getPopupContainer、teleported 配置挂载位置。popperOptions 提供原生浮层的
      strategy、offset、padding 和 flip。
    </p>
    <p>
      cell / default 插槽接收
      iso、date、text、type、disabled、selected、inRange、outside、today、week
      等元数据；date 与 disabledDate 一样使用 UTC
      日期。date-render、month-cell-render
      可单独定制网格。header、footer、extra-footer 和 shortcut
      可定制分区，footer 提供
      dates、confirm、cancel、clear。prefix、suffix、clear-icon
      和四个导航图标均可替换。可通过 id、placeholder、name
      的二元数组分别配置范围输入框。
    </p>
  </section>
  <section class="notes">
    <h2>键盘、表单与实例方法</h2>
    <p>
      上下左右键浏览并跳过禁用日期，Home / End 到周首尾，PageUp / PageDown
      切换月份，Ctrl 加翻页键切换年份；Enter / Space
      选择。月份、季度、年份网格支持相同方向键操作。Esc
      关闭当前浮层并恢复触发器焦点。
    </p>
    <p>
      组件继承 HysForm / HysFormItem
      的尺寸、禁用、标签和反馈；内部时间列表不重复触发字段校验。name
      输出隐藏表单值，范围可分别指定两个名称；form
      指定原生表单归属。非受控初始值支持原生表单重置。validateEvent=false
      关闭主动校验。
    </p>
    <p>
      focus、blur、show / hide、handleOpen / handleClose
      操作焦点与面板；showMonth 浏览指定日期且不选择，setMode
      切换面板。setValue、clear、confirm 返回 Promise&lt;boolean&gt;
      表示是否被接受，cancel 放弃草稿。公开 element、open、value、draft
      便于读取当前状态。关闭及页面离开清理浮层、监听器和未完成交互。
    </p>
  </section>
</template>
