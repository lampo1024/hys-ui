<template>
  <section class="notes">
    <h2>显示、关闭与确认</h2>
    <p>
      使用 v-model:open 或 v-model 控制显示；两者同时提供时 open
      优先。defaultOpen 用于非受控初始值，实例 show / hide / close
      仍遵守受控状态。footer=true
      启用内置操作区；默认保持原有的底部插槽用法。自定义 footer 插槽可获得
      confirm、cancel、close、busy、confirming、closing 和 error。
    </p>
    <p>
      beforeConfirm(context) 在确认前执行，beforeClose(reason, context)
      检查全部交互关闭入口，包含确认。返回 false 保持打开，Promise
      会进入等待状态，抛出错误显示可重试提示并触发 confirmError /
      closeError。context.signal 在取消、外部关闭或页面离开时中止，可传给
      fetch。异步处理应放在守卫中；ok / cancel 是操作通过检查后的通知事件。
    </p>
    <p>
      默认确认期间禁止关闭与重复提交。closeWhileConfirming=true
      允许取消正在等待的确认；组件会中止旧任务，迟到的结果不会再次确认或关闭。closeOnConfirm=false
      可用于重复执行操作而不关闭。confirmOnCtrlEnter 启用 Ctrl / Cmd +
      Enter，输入法组合期间不触发。外部把 open 设为 false
      属于宿主决定，不执行关闭守卫。
    </p>
  </section>
  <section class="notes">
    <h2>布局、移动与内容</h2>
    <p>
      size 内置
      xs(360px)、sm(440px)、md(560px，默认)、lg(720px)、xl(960px)、2xl(1200px)
      和 full(可用宽度)。显式 width 优先，full 仅铺满宽度，不等同全屏。width /
      height / maxHeight 支持数值像素和 CSS 长度。centered
      控制垂直居中；关闭后使用 top，默认 15vh。center
      让标题和操作区居中。长内容只滚动主体，标题与操作区保持可见。opacity
      控制背景透明度，0–1，默认不透明，文字和按钮保持清晰；maskOpacity
      单独设置遮罩透明度，未传时使用默认遮罩样式。showFullscreen
      提供切换入口，支持 v-model:fullscreen；defaultFullscreen 用于非受控模式。
    </p>
    <p>
      draggable
      仅允许从标题区域拖动，按钮与输入区域不参与。默认保留视口边距，overflow=true
      允许越界。双击移动手柄或 弹窗内 Alt + Home 平滑复位，Alt +
      方向键微调，Shift 加速。resizable 显示右下角手柄，支持指针、方向键与 Home
      复位，并遵守 minWidth / minHeight / maxWidth 及数值 maxHeight。拖动时按
      Esc 或指针取消会还原本次操作，dragMode=preview
      时，实体内容保留在原处，预览框按帧显示目标位置，释放后通过合成层动画移动；取消时放弃预览，减少动态效果时直接定位。默认
      live 模式直接跟手。dragEffect 可选择 lift 柔和抬升（默认）、outline
      边缘高亮或 none
      关闭；特效只在开始和结束时切换透明度。拖拽更新按动画帧合并，手势期间缓存边界、直接更新合成层位置，在结束时同步组件状态。
    </p>
    <p>
      destroyOnClose 默认在退出完成后销毁内容；false 保留内部状态。forceRender
      提前挂载并保留内容，适合提前访问表单引用。loading
      使用状态占位并保留原内容。关闭父弹窗时，同时清理内部选择器、日期等传送浮层。resetPositionOnClose
      / resetSizeOnClose
      默认恢复初始布局。手动复位位置和尺寸也具有平滑过渡；窗口缩小时自动保持移动手柄可见，实例
      resetPosition 可由宿主页面的外部入口调用。
    </p>
  </section>
  <section class="notes">
    <h2>焦点、层级与动效</h2>
    <p>
      initialFocus 支持 auto、dialog、confirm、cancel、CSS 选择器、元素或
      false。Tab 在弹窗内循环，关闭后恢复打开前的焦点。openAutoFocus /
      closeAutoFocus 可调用 preventDefault() 自定义焦点处理。自定义标题插槽请把
      titleId 设置到实际标题元素上，并为无标题弹窗提供 ariaLabel。重要确认可使用
      role="alertdialog"。
    </p>
    <p>
      嵌套弹窗与内部浮层按打开顺序分配层级，Escape
      仅处理最上层。lockScroll、trapFocus、restoreFocus 可分别配置。modal=false
      隐藏遮罩；同时 modalPenetrable=true
      时允许操作背景，并默认解除焦点与滚动限制。appendTo 默认为 body，false
      保留原地；原地模式应避免祖先的 overflow 与 transform 裁剪。
    </p>
    <p>
      transition 支持 fade、scale、slide、none 或 Vue Transition
      配置，transitionDuration
      设置时长。默认使用柔和缩放，全屏与还原也具有尺寸过渡。系统减少动态效果和全局关闭动效设置优先。open
      / opened 分别在开始与完成打开时触发；close 表示关闭请求已通过守卫，closed
      / afterClose 在退出和焦点恢复完成后触发。openDelay / closeDelay
      的等待会随状态变化取消。
    </p>
  </section>
  <section class="notes">
    <h2>调用式弹窗</h2>
    <p>
      在 setup 调用 useHysModal()
      获得当前页面的弹窗服务，继承祖先注入与响应式主题，页面离开时自动清理。show(options)
      创建一般弹窗；confirm / info / success / warning / error
      接收选项或正文字符串。默认开启内置操作区、关闭遮罩取消；confirm
      显示取消按钮，其余提示默认仅确认。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th>接口</th>
            <th>用法</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>options.onOk / onCancel</code></td>
            <td>
              接收含 reason 与 signal 的操作上下文，支持异步、false
              拦截和抛出错误后重试。
            </td>
          </tr>
          <tr>
            <td><code>options.content</code></td>
            <td>
              正文字符串、VNode 或 (context) =&gt;
              VNode。函数可读取响应式数据，不解析 HTML 字符串。
            </td>
          </tr>
          <tr>
            <td><code>handle.update(options)</code></td>
            <td>更新标题、正文、按钮、加载和布局等配置。</td>
          </tr>
          <tr>
            <td><code>handle.confirm / cancel / close</code></td>
            <td>
              请求操作，返回 Promise&lt;boolean&gt;，执行守卫；close 的原因是
              api。
            </td>
          </tr>
          <tr>
            <td><code>handle.closed</code></td>
            <td>
              等待完整关闭，返回 {action, reason}。action 为
              confirm、cancel、destroy 或 owner-dispose。
            </td>
          </tr>
          <tr>
            <td><code>handle.destroy / destroyAll</code></td>
            <td>
              强制清理单个或当前服务中的全部弹窗，不等待守卫，适合任务取消和页面清理。
            </td>
          </tr>
          <tr>
            <td><code>createHysModal(config)</code></td>
            <td>
              setup 外创建浏览器服务，支持 theme / motion
              配置；宿主应用结束时必须调用 dispose()。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      调用式服务配置支持 defaults 与
      appendTo。每个服务独立管理自身弹窗；destroyAll
      不影响其他调用范围。组件当前面向浏览器应用。
    </p>
  </section>
</template>
