<template>
  <section class="notes">
    <h2>请求与文件状态</h2>
    <p>
      默认保留本地选择模式；配置 <code>action</code> 或
      <code>customRequest</code> 后启用请求。<code>autoUpload=false</code>
      时选择后保持待上传，通过 <code>submit()</code> 统一提交。<code
        >concurrency</code
      >
      限制同时进行的检查、配置读取与请求，默认 2。
    </p>
    <p>
      内置请求使用 XMLHttpRequest 与 multipart/form-data，支持
      method、name、headers、data、withCredentials、timeout。action、data、headers
      支持异步函数，并接收 AbortSignal。浏览器负责 multipart
      boundary，不要手工设置
      Content-Type。跨域权限、服务端校验与持久化由接口负责。
    </p>
    <p>
      自定义请求接收条目 file、实际发送 body、配置及 onProgress / onSuccess /
      onError，可返回 Promise、取消函数或 { abort, promise }。body 可由
      beforeUpload 返回的 Blob / File 替换，file.raw
      保留原文件。失败重试会重新检查并读取配置。
    </p>
    <p>
      状态为 ready、uploading、success、error；队列信息由插槽 queued 与实例
      queued / uploading 提供。change 仍传递完整文件数组；fileChange
      额外提供类型及实际修改条目。error 仍接收文字，uploadError
      提供请求错误、HTTP 状态和响应。
    </p>
    <h2>受控列表与类型</h2>
    <p>
      <code>v-model:file-list</code> 或
      <code>v-model</code> 控制列表，同时使用时 fileList 优先。defaultFileList /
      defaultValue 仅设置非受控初值。uid 必须是稳定且唯一的字符串。远程附件使用
      HysUploadItem，无需创建 raw；默认 HysUploadFile 仍要求 raw 和
      size。条目有额外必填字段时，通过 createFile 构造。
    </p>
    <h2>验证、预览与生命周期</h2>
    <p>
      accept、maxSize（字节）和 limit 在选择时检查；beforeUpload
      可异步拒绝或变换文件，beforeRemove 可拦截单个移除。clearFiles
      是显式批量清理，不运行 beforeRemove。multiple=false
      时，新文件通过检查后才替换旧条目。
    </p>
    <p>
      图片支持内置预览；previewFile / downloadFile 可接入业务逻辑，返回 false
      由调用方处理。支持 http(s)、blob 和图片 data
      URL。目录选择依赖浏览器，粘贴文件通过 paste 开启。模板内的链接和
      data-upload-no-trigger 元素不会误开选择器。
    </p>
    <p>
      移除、清空、禁用、卸载和缓存页面离开会取消相应任务，迟到回调不再更新列表，本地缩略图
      URL
      会回收。返回缓存页面后保留列表，已中断项恢复待上传，需手动提交。进度按动画帧合并，listHeight
      限制长列表展示高度。
    </p>
    <h2>键盘操作</h2>
    <p>
      默认选择区域支持 Enter /
      Space。自定义按钮保留自身键盘语义，不产生重复焦点。文件行支持方向键、Home
      / End，Delete 移除当前文件；行内操作可通过 Tab 访问。
    </p>
  </section>
</template>
