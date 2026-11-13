<template>
  <section class="notes" aria-labelledby="hys-spin-control-reference">
    <h2 id="hys-spin-control-reference">任务与服务</h2>
    <div class="api-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">接口</th>
            <th scope="col">用法</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>spinRef.run(work, options?)</code></td>
            <td>
              接收 Promise 或工厂，返回业务 Promise。工厂接收
              <code>{ signal, attempt, update, progress }</code>。把
              <code>signal</code> 传给请求，显式取消、超时和实例卸载会中止任务。
            </td>
          </tr>
          <tr>
            <td><code>useHysSpinTask()</code></td>
            <td>
              单独管理任务。<code>state</code> 是只读快照，包含
              <code>spinning</code>、<code>status</code>、<code>progress</code>
              和
              <code>error</code
              >。可将其绑定到表格、搜索、分页、上传或媒体缓冲指示器。
            </td>
          </tr>
          <tr>
            <td><code>runOptions</code></td>
            <td>
              <code>timeout</code> 为非负毫秒。<code>initial</code>
              可预设正文、阶段、剩余时间和初始进度。重试时
              <code>attempt</code> 从 2 开始递增，连续启动会中止上一任务。
            </td>
          </tr>
          <tr>
            <td><code>hysSpin.show(props?)</code></td>
            <td>
              创建命令式加载，默认全屏。返回
              <code>{ update, close, closed }</code>，其中
              <code>closed</code> 在加载层退出或所属范围销毁后解析。 用
              <code>{ mode: 'overlay', appendTo: element }</code>
              可以覆盖指定容器。
            </td>
          </tr>
          <tr>
            <td><code>hysSpin.run(work, props?)</code></td>
            <td>
              在业务 Promise
              执行期间显示加载，结束后自动关闭。可用于跨页面任务。<code
                >closeAll()</code
              >
              关闭服务管理的全部指示器。
            </td>
          </tr>
          <tr>
            <td>
              <code>useHysSpin()</code> / <code>createHysSpin(config?)</code>
            </td>
            <td>
              局部服务随组件卸载和缓存停用清理。独立服务在使用结束后调用
              <code>dispose()</code>。
            </td>
          </tr>
          <tr>
            <td><code>provideHysSpin(config)</code></td>
            <td>
              为组件树配置 <code>defaults</code> 和具名
              <code>presets</code>。<code>configureHysSpin</code>
              设置全局默认值，实例的显式属性优先。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      普通 Promise
      可以停止等待和显示。要取消实际请求或重试，请传入任务工厂。配置最短显示时间后，<code
        >end</code
      >
      表示任务状态结束，<code>afterHide</code> 表示加载层已经退出。
    </p>
  </section>
</template>
