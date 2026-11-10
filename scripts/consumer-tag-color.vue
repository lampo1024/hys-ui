<script setup lang="ts">
import { ref } from "vue";
import {
  HysTagInput,
  HysColorPicker,
  HysColorTokenEditor,
  HysButton,
  HysCheckbox,
  provideHysConfig,
  type HysTagInputProps,
  type HysTagInputInstance,
  type HysTagInputAddContext,
  type HysTagInputInvalid,
  type HysColorPickerProps,
  type HysColorPickerInstance,
  type HysColorPickerContext,
  type HysColorFormat,
} from "hys-ui";
provideHysConfig({ theme: "green", motion: "off" });
const tags = ref(["Initial"]),
  tagApi = ref<HysTagInputInstance>(),
  colorApi = ref<HysColorPickerInstance>(),
  color = ref("rgba(56, 103, 245, 0.5)"),
  immediate = ref(false),
  message = ref("Ready"),
  tokens = ref({ primary: "#3867f5", accent: "#22a06b" });
const tagProps: HysTagInputProps = {
  max: 20,
  delimiters: [",", ";"],
  clearable: true,
  draggable: true,
  beforeAdd: async (value: string, context: HysTagInputAddContext) =>
    !context.signal.aborted && value !== "blocked",
};
const format: HysColorFormat = "rgb",
  colorProps: HysColorPickerProps = {
    format,
    showAlpha: true,
    clearable: true,
  };
function invalid(info: HysTagInputInvalid) {
  message.value = info.reason;
}
function scoped(info: HysColorPickerContext) {
  const value: string = info.value;
  const saturation: number = info.color.s;
  void [value, saturation];
}
function tagInstance(
  instance: InstanceType<typeof HysTagInput>,
): HysTagInputInstance {
  return instance;
}
function colorInstance(
  instance: InstanceType<typeof HysColorPicker>,
): HysColorPickerInstance {
  return instance;
}
async function methods() {
  await tagApi.value?.add(["One", "Two"]);
  await tagApi.value?.move(0, 1);
  await tagApi.value?.remove(0);
  tagApi.value?.setDraft("Draft");
  await colorApi.value?.setColor("hsl(150, 50%, 40%)");
  await colorApi.value?.confirm();
}
void [scoped, tagInstance, colorInstance, methods];
</script>
<template>
  <div
    style="
      display: grid;
      gap: 20px;
      max-width: 720px;
      padding: 20px;
      background: #fff;
      color: #172a4d;
    "
  >
    <HysTagInput
      ref="tagApi"
      v-model="tags"
      v-bind="tagProps"
      aria-label="Installed tags"
      @invalid="invalid"
      ><template #suffix="{ values, pending }"
        ><span>{{ values.length }}{{ pending ? " busy" : "" }}</span></template
      ></HysTagInput
    ><output id="tag-consumer-values">{{ tags.join("|") }}</output
    ><output id="tag-consumer-message">{{ message }}</output>
    <HysButton @click="tagApi?.add(['Batch one', 'Batch two'])"
      >Add installed tags</HysButton
    >
    <HysCheckbox v-model="immediate" label="Installed immediate color" />
    <HysColorPicker
      ref="colorApi"
      v-model="color"
      v-bind="colorProps"
      :immediate="immediate"
      label="Installed color"
    /><output id="color-consumer-value">{{ color }}</output>
    <HysColorPicker
      default-value="#8955ea"
      inline
      label="Installed inline color"
    />
    <HysColorTokenEditor v-model="tokens" /><output id="token-consumer-value">{{
      tokens.primary
    }}</output>
  </div>
</template>
