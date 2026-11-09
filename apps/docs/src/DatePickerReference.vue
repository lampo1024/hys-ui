<template>
  <section class="notes">
    <h2>日期类型与格式</h2>
    <p>
      默认保留字符串绑定：date 为 YYYY-MM-DD，month 为 YYYY-MM，year 为
      YYYY，quarter 为 YYYY-[Q]Q。week 返回所在周的起始日期，默认展示 ISO
      周编号。dates、weeks、months、quarters、years
      选择多个值；范围选择器沿用单一输入区，返回两个端点。
    </p>
    <p>
      valueType 可以指定 string、date 或
      timestamp；未指定时从已有值推断，空值默认使用字符串。Date
      和时间戳使用本地日期与时刻，时间戳单位为毫秒；数字 0 是有效值。valueFormat
      改变字符串绑定格式，format 只改变展示。支持
      YYYY、MM、DD、HH、mm、ss、Q、GGGG、WW 和方括号字面量；x / X 分别表示毫秒 /
      秒的字符串时间戳。未使用第三方日期对象。
    </p>
    <p>
      editable 开启直接输入；inputFormats 提供额外可接受的格式，展示仍使用
      format。输入必须是有效日期，不会把二月三十一日自动进位。Enter
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
      defaultValue 用作非受控初始值，defaultPickerValue
      只指定初始浏览位置。panelValue、mode、open
      可分别受控；宿主可以拒绝请求。clearValue
      定义清空值；默认字符串单选为空字符串，Date / timestamp 单选为
      null，多选为空数组，范围为两个相应空值。clearable 不改变清空方法的可用性。
    </p>
  </section>
  <section class="notes">
    <h2>禁用与范围规则</h2>
    <p>
      min、max 限制日期或时刻。disabledDate 保留旧接口，接收当天 UTC 零时的
      Date；使用 getUTCFullYear / getUTCMonth / getUTCDate / getUTCDay
      读取日期。第二个参数包含
      iso、range、from，便于按起止角色和已选开始日判断。月、季度和年选项在其周期内存在可用日期时允许选择。
    </p>
    <p>
      范围自动整理反向点击的日期。minRangeDays / maxRangeDays
      按包含首尾的自然日计数；rangeValidation 默认为 endpoints，continuous
      还检查中间日期，连续检查跨度最多一百年。disabled 可以是布尔值或
      [开始禁用,结束禁用]；固定端点在清空时保留。allowEmpty
      分别允许开放起止边界，弹层提供单独清除操作。
    </p>
    <p>
      showTime 或 type='datetime' 在日期下方提供自定义时间选项。defaultTime
      设置新端点的默认 HH:mm:ss，范围可分别设置。disabledTime 返回
      hours、minutes(hour)、seconds(hour,minute)；hourStep、minuteStep、secondStep
      控制列出的步长。隐藏秒列保留已有秒值。无效或颠倒的完整时刻不能确认。
    </p>
  </section>
  <section class="notes">
    <h2>面板与定制</h2>
    <p>
      默认每周从星期一开始，firstDayOfWeek 使用 0–6 表示周日到周六；locale
      控制月份、星期名称，messages 覆盖操作文字。周编号使用 ISO
      规则。点击年份或月份标题可以快速定位，点击面板标题返回选择视图，无需额外返回按钮。
    </p>
    <p>
      shortcuts 接收静态值或点击时计算的函数，遵守相同禁用规则。范围默认
      singlePanel=true，关闭后显示两个面板；unlinkPanels
      允许分别浏览，窄屏时在浮层内滚动。inline
      直接嵌入面板；placement、appendTo、popupWidth、popupClass、popupStyle
      定制浮层，主题与尺寸从宿主继承。
    </p>
    <p>
      cell / default 插槽接收
      iso、date、text、type、disabled、selected、inRange、outside、today、week
      等元数据；date 与禁用回调一样使用 UTC 日期。header、footer 和 shortcut
      可定制分区，footer 提供
      dates、confirm、cancel、clear。prefix、suffix、clear-icon
      和四个导航图标均可替换。
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
