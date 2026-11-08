<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysCheckbox } from "hys-ui";
import { LockKeyhole, UnlockKeyhole } from "lucide-vue-next";
const value = ref(""),
  visible = ref(false);
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>点击切换</span
        ><HysInput
          v-model="value"
          type="password"
          show-password
          autocomplete="new-password"
          aria-label="点击显示密码" /></label
      ><label class="input-demo-field"
        ><span>按住查看，释放隐藏</span
        ><HysInput
          v-model="value"
          type="password"
          show-password
          show-password-on="mousedown"
          aria-label="按住显示密码" /></label
      ><label class="input-demo-field"
        ><span>受控显示与自定义图标</span
        ><HysInput
          v-model="value"
          v-model:password-visible="visible"
          type="password"
          show-password
          aria-label="受控密码"
          ><template #password-icon="{ visible }"
            ><component
              :is="visible ? UnlockKeyhole : LockKeyhole"
              :size="16" /></template></HysInput
      ></label>
    </div>
    <HysCheckbox v-model="visible" label="显示受控密码" />
    <p class="scenario-note">
      切换时保留输入选择范围。按住模式在释放、失去窗口焦点或离开页面时结束；键盘
      Enter / 空格也可以切换。
    </p>
  </div>
</template>
