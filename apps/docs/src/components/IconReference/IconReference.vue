<template>
  <section class="notes" aria-labelledby="hys-icon-library-reference">
    <h2 id="hys-icon-library-reference">注册表与资源 API</h2>
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
            <td><code>hysBuiltinIcons</code></td>
            <td>
              内置图标集合，类型为 <code>HysIconLibrary</code>，命名空间为
              <code>core</code>。<code>name="chart-line"</code> 与
              <code>name="core:chart-line"</code> 指向同一个内置图标。 使用
              <code>hysIconRegistry.search("物流", { namespace: "core" })</code>
              可按中文关键词查找；每条结果包含可传给
              <code>name</code> 的完整名称。
            </td>
          </tr>
          <tr>
            <td><code>createHysIconRegistry({ builtins? })</code></td>
            <td>
              创建独立注册表，默认包含 <code>core</code>。传
              <code>builtins: false</code> 创建空注册表。<code
                >hysIconRegistry</code
              >
              为默认共享实例。
            </td>
          </tr>
          <tr>
            <td><code>register(library, conflict?)</code></td>
            <td>
              注册
              <code>{ namespace, version?, icons }</code
              >。条目可声明资源、变体、别名、关键词、分类及 RTL
              镜像。重复名称默认报错，<code>replace</code> 替换，<code
                >keep</code
              >
              保留已有资源。
            </td>
          </tr>
          <tr>
            <td><code>resolve(name)</code> / <code>list()</code></td>
            <td>
              读取图标元数据，包含实际名称、资源版本、变体和别名。名称不带命名空间时按
              <code>core</code> 解析。
            </td>
          </tr>
          <tr>
            <td>
              <code>get(name, variant?)</code> /
              <code>load(name, variant?)</code>
            </td>
            <td>
              <code>get</code> 同步读取已就绪资源。扩展图标的 SVG
              首次使用时按分类分块加载，加载前 <code>get</code> 返回
              <code>undefined</code>。<code>load</code> 返回资源
              Promise，别名和同一图形的笔画变体共享请求及结果。失败后可重试，<code
                >unregister(namespace)</code
              >
              移除整个库。
            </td>
          </tr>
          <tr>
            <td><code>search(query, filter?)</code></td>
            <td>
              按名称、别名、标签和关键词匹配。精确名称或别名优先，其次为完整词、前缀、包含和顺序子序列匹配。<code
                >fuzzy: false</code
              >
              可关闭顺序子序列匹配。可按 <code>namespace</code>、<code
                >category</code
              >
              和 <code>variant</code> 筛选。
            </td>
          </tr>
          <tr>
            <td><code>preload(names, variant?, allowedOrigins?)</code></td>
            <td>
              预取多个资源，返回每个名称的成功或失败结果。首屏需要扩展图标时，可提前
              <code>await hysIconRegistry.preload(["calendar-range"])</code>。
              可以提供外部资源的允许来源，组件实例沿用自己的
              <code>allowedOrigins</code>。
            </td>
          </tr>
          <tr>
            <td><code>importHysIconSvg(markup)</code></td>
            <td>
              在浏览器解析 SVG
              并转换为结构化资源。过滤脚本、事件属性、外部引用和嵌入内容。<code
                >serializeHysIconSvg(source)</code
              >
              输出可复制的安全子集。
            </td>
          </tr>
          <tr>
            <td><code>provideHysIcons(config)</code></td>
            <td>
              为当前组件树设置 <code>registry</code> 和
              <code>defaults</code>。<code>configureHysIcon</code>
              设置全局默认值。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      同页 Sprite 使用 <code>#symbol-id</code>。外部 Sprite
      是否可显示受浏览器的跨源规则约束。IconFont
      使用应用已加载的字体族或样式类。可传
      <code>allowedOrigins</code> 限制外部图片和 Sprite 来源。
    </p>
  </section>
</template>
