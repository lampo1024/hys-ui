<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysInput,
  HysSelect,
  HysProgress,
  type HysUploadRequestOptions,
} from "hys-ui";
const endpoint = ref("/files/upload"),
  method = ref("POST"),
  result = ref("等待请求");
function request(options: HysUploadRequestOptions) {
  result.value = JSON.stringify(
    {
      action: options.action,
      method: options.method,
      name: options.name,
      headers: options.headers,
      data: options.data,
      withCredentials: options.withCredentials,
      timeout: options.timeout,
      file: options.file.name,
      bodySize: options.body.size,
    },
    null,
    2,
  );
  options.onProgress(30);
  const timer = setTimeout(() => options.onSuccess({ saved: true }), 650);
  options.signal.addEventListener("abort", () => clearTimeout(timer), {
    once: true,
  });
  return () => clearTimeout(timer);
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-control-field"
          ><span>请求地址</span><HysInput v-model="endpoint" /></label
        ><label class="demo-control-field"
          ><span>请求方法</span
          ><HysSelect
            v-model="method"
            :options="
              ['POST', 'PUT', 'PATCH'].map((value) => ({ label: value, value }))
            "
        /></label>
      </div>
    </div>
    <HysUpload
      :drag="false"
      :action="async () => endpoint"
      :method="method"
      name="attachment"
      :data="
        (file) => ({
          documentType: 'attachment',
          filename: file.name,
          tags: ['draft', 'review'],
        })
      "
      :headers="async () => ({ 'X-Demo-Token': 'example-token' })"
      with-credentials
      :timeout="10000"
      :custom-request="request"
      ><template #tip
        >本例读取实际生成的请求配置并模拟完成。接入服务端时移除
        customRequest，配置 action 与服务端需要的字段。</template
      ><template #progress="{ percentage }"
        ><HysProgress :value="percentage" :stroke-width="4" /></template
    ></HysUpload>
    <pre class="state-output">{{ result }}</pre>
  </div>
</template>
