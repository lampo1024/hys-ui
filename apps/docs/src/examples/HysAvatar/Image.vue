<script setup lang="ts">
import { ref } from "vue";
import { HysAvatar, HysButton } from "hys-ui";
import { Image } from "lucide-vue-next";
const source =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#fff0df"/><circle cx="48" cy="34" r="17" fill="#d7883c"/><path d="M14 96a34 34 0 0 1 68 0" fill="#d7883c"/></svg>',
  );
const visible = ref(true),
  message = ref("等待图片加载");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatar
        v-if="visible"
        :src="source"
        :srcset="source + ' 1x'"
        :size="64"
        name="原生图片属性"
        lazy
        :img-props="{ referrerpolicy: 'no-referrer' }"
        @load="message = '图片加载完成'"
        ><template #placeholder><Image :size="24" /></template></HysAvatar
      ><HysButton size="sm" variant="secondary" @click="visible = !visible">{{
        visible ? "移除头像" : "重新加载"
      }}</HysButton>
    </div>
    <output class="state-output" aria-live="polite">{{ message }}</output>
    <p class="scenario-note">
      支持 srcset、sizes、crossOrigin、draggable、lazy 与 imgProps。load/error
      事件保留原生事件，并提供来源和是否为备用图片的信息。
    </p>
  </div>
</template>
