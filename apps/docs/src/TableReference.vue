<template>
  <section class="notes">
    <h2>数据、列与受控状态</h2>
    <p>
      rows 与 columns 是唯一必需参数，组件不修改数据、列配置或
      row.children。rowKey
      支持字段路径或函数，选择、树形、异步加载和跨页保留需要稳定且唯一的字符串或数字；字符串和数字编号分别处理。dataIndex
      支持点号路径或路径数组，未指定时读取 column.key。
    </p>
    <p>
      sort /
      sorts、filters、selectedRowKeys、currentRowKey、expandedRowKeys、page、pageSize、columnWidths
      支持受控更新。未绑定时由组件维护本地状态，defaultSort / defaultFilters /
      defaultSelectedRowKeys / defaultExpandedRowKeys
      提供初值。选择与展开实例方法返回
      Promise&lt;boolean&gt;，可判断宿主是否接受请求。原有 columns /
      rows、rowClick、sortChange 首个参数及 column.key 单元格插槽继续兼容。
    </p>
  </section>
  <section class="notes">
    <h2>列参数</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>参数</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>key / label / dataIndex</td>
            <td>稳定列标识、表头与数据路径；key 同时作为原有单元格插槽名。</td>
          </tr>
          <tr>
            <td>children</td>
            <td>
              嵌套列组成多级表头，自动计算 colspan /
              rowspan；隐藏列不留下空表头。
            </td>
          </tr>
          <tr>
            <td>type</td>
            <td>
              default、selection、index、expand；也可通过
              selectable、showIndex、expandable 自动添加操作列。
            </td>
          </tr>
          <tr>
            <td>width / minWidth / maxWidth</td>
            <td>
              宽度可为数值或 CSS
              长度；固定列和交互列宽建议使用数值。分隔线调整遵守最小与最大值。
            </td>
          </tr>
          <tr>
            <td>fixed</td>
            <td>
              true / left /
              right。分组继承给子列；跨固定区域的分组拆分呈现，固定单元格始终保持不透明背景。
            </td>
          </tr>
          <tr>
            <td>align / headerAlign</td>
            <td>单元格和表头的 left / center / right 对齐。</td>
          </tr>
          <tr>
            <td>sortable / sorter / sortBy / sortOrders</td>
            <td>
              启用排序、指定比较函数或取值规则、设置排序循环。sortable='custom'
              只发送查询，不本地排序。
            </td>
          </tr>
          <tr>
            <td>filters / filterable / filterMultiple / filterMethod</td>
            <td>
              选项筛选、文本筛选、是否多选、指定匹配函数。选项包含 label / value
              / disabled，value 保留原类型。
            </td>
          </tr>
          <tr>
            <td>formatter</td>
            <td>
              (row, column, value, index) =&gt;
              VNodeChild，格式化默认内容；命名单元格插槽优先。
            </td>
          </tr>
          <tr>
            <td>ellipsis / showOverflowTooltip / tooltipFormatter</td>
            <td>
              单行省略、溢出时显示浮层、自定义提示内容。提示使用共享浮层，避免为每个单元格创建定位监听。
            </td>
          </tr>
          <tr>
            <td>summary / index</td>
            <td>
              sum / avg / min / max / count
              汇总；序号列可设置起始数字或自定义渲染函数。
            </td>
          </tr>
          <tr>
            <td>hidden / responsive</td>
            <td>
              隐藏列或匹配容器断点 xs / sm / md / lg / xl / xxl，阈值为 576 /
              768 / 992 / 1200 / 1600px。
            </td>
          </tr>
          <tr>
            <td>className / headerClassName / cellStyle</td>
            <td>
              列级样式，可与表格级 rowStyle / cellStyle / headerCellStyle
              组合。行背景可使用 --hys-ui-table-row-bg 变量。
            </td>
          </tr>
          <tr>
            <td>resizable</td>
            <td>
              覆盖表格级 resizable；鼠标拖动、方向键调整，Esc
              取消。交互提交列宽快照，resetColumnWidths 恢复自适应布局。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section class="notes">
    <h2>排序、筛选与分页</h2>
    <p>
      本地处理顺序为筛选、同级稳定排序、根行分页、展开树形节点。多列排序按 sorts
      数组次序生效，空值排在末尾。文本筛选不区分大小写，选项值使用类型一致的匹配；同列条件按或、多列条件按且。应用排序或筛选会请求回到第一页。
    </p>
    <p>
      pagination 默认关闭；true 启用内置分页，也可传入配置对象。配置支持 page /
      pageSize / total / pageSizeOptions / showSizeChanger / showQuickJumper /
      showTotal / compact / hideOnSinglePage；独立 page、pageSize、total
      参数优先。serverMode 不执行本地排序、过滤和分页，宿主通过 queryChange 获取
      action、page、pageSize、sorts、filters 与当前已应用的
      currentData，再提供结果数据。
    </p>
  </section>
  <section class="notes">
    <h2>选择与树形数据</h2>
    <p>
      selectable 可传布尔值或行可选判断函数。selectionType='radio' 单选，默认
      checkbox
      多选；全选只影响当前根行页及其已加载后代，忽略禁用行。selectOnIndeterminate=false
      时，点击半选表头会取消当前页选择。reserveSelection
      保留跨页编号与已见过的选中行；关闭后请求移除不再存在的编号。highlightCurrentRow
      独立于复选框或单选框，可用 setCurrentRow() 清除高亮。
    </p>
    <p>
      treeMode 读取 childrenKey（默认
      children），筛选保留祖先路径。checkStrictly 默认 true，false
      启用已加载节点的父子联动与半选；未加载后代不会提前选中。hasChildrenKey
      标记可加载节点，loadChildren 返回子行数组，接收 AbortSignal、key 与
      depth。自动展开最多同时请求四个节点；失败显示重试，折叠、数据替换或页面离开会取消请求，旧返回不会覆盖新数据。静态
      children 优先于异步缓存。
    </p>
  </section>
  <section class="notes">
    <h2>布局、汇总与插槽</h2>
    <p>
      height 固定滚动区域高度，maxHeight
      限制最大高度；提供高度时自动固定表头，可用 stickyHeader
      显式覆盖。表头和数据共享同一张表格，固定列在横向滚动时保持位置。fit
      默认填满容器，列宽交互后使用像素布局，避免拖动引起比例跳变。窄容器可用
      responsive 隐藏次要列，避免左右固定区域占满可用空间。
    </p>
    <p>
      showSummary 基于全部已过滤数据计算汇总；summaryMethod 返回数组或以列 key
      为键的对象。spanMethod 返回 {rowspan, colspan} 或二元数组，0
      隐藏对应单元格；覆盖区域自动跳过，合并不跨固定列边界，并在展开详情前截断。expand
      插槽接收 row / index / expanded，preserveExpandedContent
      仅保留曾展开过的详情。
    </p>
    <p>
      column.key 和 body-cell 自定义数据内容；header-columnKey 和 header-cell
      自定义表头；filter-dropdown 提供 column / values / setValues / confirm /
      clear / close；tooltip
      提供完整单元格上下文。title、footer、append、summary-cell、loading、empty
      覆盖相应区域。行内编辑与业务校验可在单元格插槽中组合
      HysInput、HysNumberInput 和 HysForm；自定义操作使用 @click.stop
      可避免触发行点击。
    </p>
  </section>
  <section class="notes">
    <h2>键盘与生命周期</h2>
    <p>
      Tab 可聚焦排序按钮、筛选图标、选择控件和可调整列宽的分隔线，Enter / Space
      执行按钮操作，Esc
      关闭筛选和提示，或取消正在进行的列宽拖动。分隔线的左右方向键每次调整
      10px。滚动区域可直接聚焦并使用原生方向键或翻页键滚动。
    </p>
    <p>
      组件缓存后保留已生效的排序、选择、展开与滚动状态，关闭浮层并清理拖动、观察器和未完成请求。返回时恢复尺寸观察，仍展开的异步节点可重新请求。普通表格渲染传入数据，大数据可使用分页、服务端查询或专用
      HysVirtualTable。
    </p>
  </section>
</template>
