<template>
  <section class="notes">
    <h2>列配置与编辑协议</h2>
    <p>
      同时引入 <code>hys-ui/style.css</code> 和
      <code>hys-ui/pro-grid.css</code>。后者是 ProGrid 的独立样式入口。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>列配置</th>
            <th>行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>render</code></td>
            <td>
              <code>(cell) =&gt; VNodeChild</code>。<code>#cell</code>
              插槽优先，其次是 render、formatter
              和原值。排序、筛选与编辑继续使用原始值。
            </td>
          </tr>
          <tr>
            <td><code>editor</code></td>
            <td>
              未配置时只展示。<code>text</code> 提交字符串，<code>trim</code>
              默认 false。<code>number</code> 提交有限数字，支持含端点的 min /
              max，<code>nullable: true</code> 将空值提交为 null。<code
                >select</code
              >
              从
              <code>{ label, value }</code>
              数组提交原类型的字符串、数字或布尔值。
            </td>
          </tr>
          <tr>
            <td><code>editor.type = 'custom'</code></td>
            <td>
              使用 <code>#editor</code>。可通过
              <code>toDraft(cell)</code> 初始化草稿，<code
                >parse(draft, cell)</code
              >
              返回 <code>{ ok: true, value }</code> 或
              <code>{ ok: false, message }</code
              >。省略时使用原值与草稿。编辑对象或数组时，通过
              <code>toDraft</code> 创建独立草稿，并用 <code>setDraft</code>
              提交新的草稿值。自定义控件应适应列宽，使用插槽提供的 inputId 和
              errorId 关联焦点与错误提示。
            </td>
          </tr>
          <tr>
            <td><code>canEdit</code></td>
            <td>
              <code>(cell) =&gt; boolean</code
              >。缺省允许编辑已配置编辑器的单元格。整表
              readonly、加载状态以及无效或重复行键也会限制编辑。
            </td>
          </tr>
          <tr>
            <td><code>validate</code></td>
            <td>
              <code
                >(change, { signal }) =&gt; void | boolean | string |
                Promise</code
              >。在类型解析后、saveCell 前执行。true 或无返回值表示通过，false
              使用默认错误提示，字符串作为错误文案。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      双击单元格、点击铅笔，或聚焦单元格后按 F2 或
      Enter，可在原位置编辑。文本和数字按 Enter 提交，Escape 取消。内置编辑器按
      Tab 或 Shift+Tab
      提交，成功后向前或向后聚焦一格。下拉编辑器也可以点击勾号提交。
    </p>
    <p>
      编辑保持行高，校验和保存反馈显示在单元格旁。失败时保留草稿，可修改输入或点击重试。重试会重新校验。查询变化、单元格隐藏、数据更新和离开页面会使相应编辑失效。
    </p>
    <p>
      <code>saveCell</code> 与校验使用相同的返回协议。取消会发出
      AbortSignal，业务请求应处理该信号。成功后通过 <code>cellCommit</code> 更新
      rows，回调内完成后端保存即可。
    </p>
    <p>
      通过 <code>gridOptions</code> 传递 DataGrid
      的查询、分页、列设置和选中状态。远程场景用 <code>serverMode</code> 与
      <code>queryChange</code> 管理当前页数据；将受控查询传入
      <code>gridOptions.query</code>，接收 <code>update:query</code> 后更新。
    </p>
  </section>
  <section class="notes">
    <h2>条件格式</h2>
    <p>
      从 <code>hys-ui/pro-grid/conditional-format</code> 引入
      <code>createProGridConditionalFormat</code>，并将返回的函数传给
      <code>gridOptions.cellClassName</code>。预设颜色需要额外引入
      <code>hys-ui/pro-grid/conditional-format.css</code>。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>规则字段</th>
            <th>类型</th>
            <th>行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>columnKey</code></td>
            <td><code>string</code></td>
            <td>选填。省略时匹配所有数据列。</td>
          </tr>
          <tr>
            <td><code>when</code></td>
            <td>
              <code>(cell: HysDataGridCellContext&lt;T&gt;) =&gt; boolean</code>
            </td>
            <td>
              必填。读取原始值、行和列等上下文，每格使用第一条返回 true 的规则。
            </td>
          </tr>
          <tr>
            <td><code>tone</code></td>
            <td><code>'info' | 'success' | 'warning' | 'danger'</code></td>
            <td>选填。为单元格添加随主题变化的底色和底部标记。</td>
          </tr>
          <tr>
            <td><code>className</code></td>
            <td><code>string</code></td>
            <td>选填。可提供多个空格分隔的 CSS 类，与预设色同时生效。</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      工厂函数的第二个参数可接收原有的单元格类名或类名回调，规则命中时会追加类名。规则应使用同步、无副作用的判断。单元格按宿主已提交的行数据重新匹配，编辑草稿和保存失败期间继续显示原有格式。
    </p>
  </section>
  <section class="notes" id="clipboard-api">
    <h2>复制粘贴</h2>
    <p>
      从 <code>hys-ui/pro-grid/clipboard</code> 引入
      <code>createProGridClipboard</code>，每张表格创建一个实例并传给
      <code>:clipboard</code>。引入
      <code>hys-ui/pro-grid/clipboard.css</code> 后显示选区。使用 Ctrl / ⌘ +
      C、Ctrl / ⌘ + V 与 Excel 交换纯文本 TSV。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>选项与方法</th>
            <th>行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>maxCells?: number</code></td>
            <td>
              单次选区和粘贴的单元格上限，默认 10,000，有效范围 1–10,000。TSV
              文本上限为 100 万个 UTF-16 代码单元。
            </td>
          </tr>
          <tr>
            <td><code>formatCopy?(cell): string</code></td>
            <td>
              按单元格自定义复制文本，默认使用原始值的字符串形式，空值转为空字符串。
            </td>
          </tr>
          <tr>
            <td><code>parsePaste?(text, cell): unknown</code></td>
            <td>
              将剪贴板文本转换为编辑器草稿，再交由原有解析和校验。默认枚举按原值的字符串或唯一标签匹配，其他编辑器收到原文本。
            </td>
          </tr>
          <tr>
            <td><code>saveBatch?(changes, { signal })</code></td>
            <td>
              全部单元格校验成功后调用一次，参数为按行排列的类型化修改数组。返回
              true 或 void 表示成功，false 或错误字符串表示拒绝，可返回
              Promise。配置了 saveCell 时，单格粘贴默认复用它，多格粘贴须提供
              saveBatch 来完成批量持久化。
            </td>
          </tr>
          <tr>
            <td><code>onSelectionChange?(range)</code></td>
            <td>
              选区变化时收到 <code>{ anchor, focus }</code>，清空时收到
              null。两个端点均为 <code>{ rowKey, columnKey }</code>。
            </td>
          </tr>
          <tr>
            <td><code>onPaste?(result)</code></td>
            <td>
              每次已连接表格的粘贴完成后调用。成功返回
              <code>{ ok: true, count }</code>。失败返回
              <code>{ ok: false, reason, message, cell? }</code>，其中 cell
              标识可定位的失败单元格。
            </td>
          </tr>
          <tr>
            <td><code>selectRange(anchor, focus = anchor)</code></td>
            <td>
              按可见行列键设置选区，成功返回 true。<code>clearSelection()</code>
              清空选区。
            </td>
          </tr>
          <tr>
            <td><code>copyText()</code> / <code>pasteText(text)</code></td>
            <td>
              读取选区 TSV，或将指定 TSV 粘贴到选区。前者无选区时返回
              undefined，后者返回
              <code>Promise&lt;HysProGridPasteResult&gt;</code
              >。方法直接处理文本，适合在工具栏接入浏览器剪贴板。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      从单格粘贴时向右、向下展开。已有多格选区时，选区行列须为数据尺寸的整数倍，可用单个值填满选区。坐标按当前页可见行列计算，越界或遇到无权限的目标时整批拒绝。Esc
      清空选区并取消进行中的粘贴。
    </p>
    <p>
      权限、类型解析、列校验和批量保存全部通过后，<code>cellsCommit</code>
      一次发出修改数组，由宿主一起更新
      <code>rows</code>。批量校验逐格读取提交前的行数据，可在
      <code>saveBatch</code> 中检查跨单元格约束。
    </p>
  </section>
</template>
