<template>
  <section class="notes toast-reference" aria-labelledby="toast-service-api">
    <h2 id="toast-service-api">调用与队列 API</h2>
    <p>
      在组件 setup 中调用
      <code>useHysToast(config)</code>
      以继承主题并随页面清理；模块、请求回调使用 <code>hysToast</code>。通过
      <code>createHysToast(config)</code> 建立独立容器，使用结束后调用
      <code>dispose()</code>。
    </p>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">接口</th>
            <th scope="col">行为与参数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row"><code>show(message | options)</code></th>
            <td>
              创建一条提示并返回
              <code>HysToastHandle</code
              >。<code>success</code>、<code>error</code>、<code>warning</code>、<code>info</code>、<code
                >loading</code
              >
              接受相同参数并指定类型。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>handle</code></th>
            <td>
              <code>id</code> 为业务 ID 或自动生成的 ID。<code
                >update(patch)</code
              >
              接收字符串或局部选项。<code>extend(ms)</code>
              给当前计时增加正数毫秒。<code>pause()</code>、<code
                >resume()</code
              >
              手动控制计时，<code>close()</code> 请求关闭。<code>closed</code>
              在退场或销毁完成时解析。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>find(id) / list(filter?)</code></th>
            <td>
              读取当前快照，含
              <code>status</code
              >、<code>position</code>、<code>type</code>、<code>priority</code>、<code
                >group</code
              >
              和 <code>repeat</code>。过滤器接受
              <code>{ type?, group?, position?, status? }</code
              >。关闭完成后移出列表。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>update(id, patch)</code></th>
            <td>
              合并正文、类型、定位、进度或视觉选项。正文或有效时长变化时重新计时，纯定位变化保留剩余时间。使用已有
              ID 再次 <code>show</code> 会更新并重置计时。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>close(id) / closeType(type)</code></th>
            <td>
              按 ID 或类型关闭。<code>closeAll(filter?)</code>
              可选择性批量关闭；<code>clearQueue()</code> 强制清理等待项。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>configure(config)</code></th>
            <td>
              更新后续消息默认值，布局及队列规则同时应用于现有容器。<code
                >configureHysToast(config)</code
              >
              修改共享服务默认值，也可更新全局提示主题和动效。
            </td>
          </tr>
          <tr>
            <th scope="row"><code>promise(task, options)</code></th>
            <td>
              接收 Promise 或工厂。工厂收到
              <code>{handle, update, progress}</code>。<code>options</code> 包含
              <code>id</code>、通用 <code>options</code> 和
              <code>loading</code>、<code>success</code>、<code>error</code>
              文案或补丁。成功和失败配置也可接收业务结果或异常。返回
              <code>{handle, promise}</code>，业务 Promise 保留原始结果或拒绝。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <dl>
      <div>
        <dt>等待队列与优先级</dt>
        <dd>
          <code>maxCount</code> 默认为 5，每个作用域至少 1 条。<code
            >overflow: 'replace'</code
          >
          为默认行为，优先替换优先级最低、最早的提示。<code
            >overflow: 'queue'</code
          >
          在退场结束后补位，等待项从显示时开始计时。<code>priority</code>
          越大越靠前，同优先级使用
          <code>queueOrder: 'fifo' | 'lifo'</code>，默认 FIFO。<code
            >maxQueue</code
          >
          默认 1000。
        </dd>
      </div>
      <div>
        <dt>独立队列与去重</dt>
        <dd>
          <code>queueScope</code> 为
          <code>global</code>、<code>position</code>、<code>type</code> 或
          <code>group</code>，默认共享上限。<code
            >dedupe: 'merge' | 'ignore'</code
          >
          支持合并计数或忽略。默认用同组、同位置、同类型的相同文本识别，可用
          <code>dedupeKey</code> 为富文本指定键。<code>dedupeWindow</code>
          指定两次调用允许的间隔毫秒，省略时匹配当前显示或等待项。<code
            >grouping: true</code
          >
          等同合并。
        </dd>
      </div>
      <div>
        <dt>容器与样式</dt>
        <dd>
          <code>appendTo</code> 接受选择器、元素或 ShadowRoot，默认
          <code>body</code>。<code>layout</code> 默认垂直，可设为
          <code>horizontal</code> 或 <code>layered</code>。<code>gap</code> 默认
          10px。<code>collapsedCount</code>
          为首屏保留条数，0 表示全部展示。折叠项仍计时。用
          <code>toastStyle</code>、<code>progressStyle</code> 或
          <code>--hys-toast-progress-color</code>、<code
            >--hys-toast-progress-track</code
          >
          定制外观。
        </dd>
      </div>
      <div>
        <dt>层叠预览</dt>
        <dd>
          <code>layout: 'layered'</code>
          在同一位置叠放提示，关闭时展示首条和后续提示的边缘。
          <code>layerCount</code> 为可见层数，包含首条，范围 2–5，默认 3。
          <code>layerTrigger</code> 支持
          <code>hover</code
          >、<code>click</code>、<code>both</code>，默认两者皆可。
          悬停临时展开，点击固定。展开按钮支持 Tab 和
          Enter。悬停预览时遵循各条提示的 <code>pauseOnHover</code> 设置。
        </dd>
      </div>
      <div>
        <dt>渲染与事件</dt>
        <dd>
          <code>content</code
          >、<code>icon</code>、<code>header</code>、<code>footer</code>、<code
            >renderActions</code
          >
          接受 Vue VNode 或渲染函数。文本由 Vue 转义。<code>onShow</code>
          在提示开始显示时调用，<code>onAfterShow</code> 在进场完成时调用；<code
            >onClose</code
          >
          和 <code>onAfterClose</code> 分别对应接受关闭和退场完成。<code
            >onStateChange</code
          >
          接收快照，涵盖入队、显示、更新状态与关闭。
        </dd>
      </div>
      <div>
        <dt>关闭与操作</dt>
        <dd>
          <code>beforeClose(context)</code> 返回 <code>false</code> 或拒绝
          Promise 可保留提示，适用于定时、手势、键盘和 API
          关闭。容量替换、清理等待队列和销毁会强制释放提示。操作的
          <code>run({close,update,copy})</code> 可返回 Promise，<code
            >success</code
          >
          和 <code>error</code> 可合并反馈补丁，<code>closeOnSuccess</code>
          默认为 true。
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.toast-reference th[scope="row"] {
  vertical-align: top;
  padding: 14px 16px;
  border-top: 1px solid var(--docs-border);
  font-weight: 500;
  white-space: nowrap;
}
.toast-reference dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 14px;
  margin: 18px 0 0;
}
.toast-reference dl div {
  padding: 12px 14px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
}
.toast-reference dt {
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 13px;
}
.toast-reference dd {
  margin: 0;
  color: var(--docs-muted);
  font-size: 12px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}
</style>
