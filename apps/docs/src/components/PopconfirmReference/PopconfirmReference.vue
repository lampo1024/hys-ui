<template>
  <section class="notes" aria-labelledby="hys-popconfirm-contract">
    <h2 id="hys-popconfirm-contract">确认流程与键盘操作</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">操作</th>
            <th scope="col">行为</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>确认</td>
            <td>
              依次等待 <code>beforeConfirm</code> 和
              <code>action</code>。任一返回
              <code>false</code>
              时保留气泡，调用方可在描述插槽提示需要补充的条件。成功后派发
              <code>confirm(result, context)</code>，然后按
              <code>closeOnConfirm</code> 决定是否收起。
            </td>
          </tr>
          <tr>
            <td>失败与重试</td>
            <td>
              抛出错误或 Promise 拒绝时派发
              <code>error(error, context)</code>，并播报
              <code>errorText</code
              >。确认按钮恢复可用，再次点击会重新检查并提交。
            </td>
          </tr>
          <tr>
            <td>取消和收起</td>
            <td>
              点击取消会执行 <code>beforeCancel</code>，通过后派发
              <code>cancel</code>。点击外部、Escape 和实例
              <code>close()</code> 等收起方式使用
              <code>dismiss(reason)</code>。受控时由父组件接受更新。
            </td>
          </tr>
          <tr>
            <td>中止请求</td>
            <td>
              将 <code>context.signal</code> 传入
              <code>fetch</code> 或任务工厂。调用
              <code>abort()</code
              >、关闭浮层或销毁实例都会中止内部等待。已发到服务器的操作能否撤销取决于接口。
            </td>
          </tr>
          <tr>
            <td>焦点</td>
            <td>
              默认聚焦取消按钮。Tab 按顺序经过浮层内控件，Space 和 Enter
              激活当前按钮，Escape 收起最上层浮层。自定义按钮可用
              <code>data-hys-popconfirm-focus="cancel"</code> 或
              <code>"confirm"</code> 标记初始焦点。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      使用 <code>v-model:open</code> 控制显示，使用
      <code>trigger="manual"</code> 和
      <code>reference</code>
      连接表格行外的控制器。操作会删除触发元素时，可在提交后把焦点移到下一行或邻近控件。
    </p>
  </section>
</template>
