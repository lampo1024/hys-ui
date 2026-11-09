<template>
  <section class="notes"><h2>月份切换动画</h2><p>transition 支持 slide（默认横向滑动）、fade（淡入淡出）、slide-up（纵向滑动）、zoom（轻微缩放）、none（直接切换）。transitionDuration 默认 180ms，范围 0–800ms，0 关闭动画。切换年月、视图和外部面板日期时使用同样的配置，同月内选择日期不会触发动画。滑动按前后月份调整方向；减少动态效果和全局 motion=off 优先。</p><p>动画使用 transform 与 opacity，旧面板退出时禁用鼠标和辅助技术访问，键盘焦点始终进入新面板。fixedWeeks 固定月视图高度，适合需要稳定布局的场景。</p></section>
  <section class="notes">
    <h2>选择与面板导航</h2>
    <p>
      默认绑定 YYYY-MM-DD 字符串；defaultValue
      提供非受控初值，未设置时使用今天。Date
      模型按本地年月日读取和返回，组件不修改宿主 Date。valueType
      指定输出类型，valueFormat 支持包含一次 YYYY、MM、DD 的字符串格式（如
      YYYY/MM/DD），不依赖外部日期库。
    </p>
    <p>
      mode 为 month 或 year，可使用
      v-model:mode。月份与年份导航仅改变面板，不改选中值；panelChange
      返回面板日期和视图。选择日期触发 update:modelValue 与
      select，日期变化时额外触发 change。select 的第二个参数 source 区分
      date、month、keyboard、customize。pickDay 返回
      Promise&lt;boolean&gt;，表示宿主最终是否接受选择；showMonth、selectDate、setMode
      负责浏览。
    </p>
  </section>
  <section class="notes">
    <h2>范围与日历布局</h2>
    <p>
      validRange 限制可选日期（包含两端），disabledDate 接收 ISO
      日期字符串。range
      用于固定展示区间，须位于同月或相邻两个月内，组件自动向两端补齐整周并禁用补齐区域；range
      模式固定为月视图。无效 validRange 禁用选择，无效 range
      回退展示当前月份。fixedWeeks 固定显示六周；showAdjacentDays
      控制相邻月份；showWeekNumbers 显示 ISO 周编号。
    </p>
    <p>
      firstDayOfWeek 默认 1（星期一），0 为星期日。locale 用 Intl
      格式化星期、月份、日期；内置操作文案提供中文与英文，其他语言可使用 header
      插槽自定义操作文字。fullscreen=false
      使用紧凑卡片尺寸，并不进入浏览器全屏。readonly
      允许浏览和查看日程，disabled 与 loading 停止内置操作。
    </p>
  </section>
  <section class="notes">
    <h2>日程与插槽</h2>
    <p>
      CalendarEvent 包含 id、date、title，可补充
      end、time、color、description、disabled。date / end 始终为 ISO
      日期，结束日包含在内；组件仅索引当前可见日期。maxEvents
      控制单元格内的日程条数，多余内容在浮层中查看，浮层同步主题，页面离开时关闭。event
      保留第一个参数日程 id，后续提供事件对象和点击日期；点击日程不选择日期。
    </p>
    <p>
      date 插槽保留原有 {date: ISO 字符串, day: 日号}。date-cell
      向日期下方追加内容，date-full-cell 完整替换日期单元格；month-cell /
      month-full-cell 对应年视图。新单元格插槽提供原生 Date 与 data（ISO
      day、isSelected、isToday、disabled、events，日期单元格另有
      type）。event、more、header、footer、loading
      可自定义相应区域。自定义操作建议使用
      HysButton，并通过事件处理避免不必要的父级业务操作。
    </p>
  </section>
  <section class="notes">
    <h2>键盘与可访问性</h2>
    <p>
      日期网格采用单个 Tab 入口，方向键移动一天或一周，Home / End
      移动到周首尾，PageUp / PageDown 移动月份，Shift 组合移动年份，Enter /
      Space
      选择。年视图左右移动月份，上下移动三个月。方向键跳过禁用日期，不自动提交选择，范围内没有可用项时停止。快捷键仅作用于日期网格，单元格内的输入和按钮保留自身交互。
    </p>
    <p>
      focus
      将焦点移入当前可用单元格。selectedDay、panelValue、currentMode、visibleRange
      提供当前状态。缓存页面保留面板与选择，浮层关闭并清理监听；组件不写入全局主题、路由或本地存储。
    </p>
  </section>
</template>
