<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import {
  HysAlert,
  HysEmpty,
  HysTimeline,
  HysButton,
  HysCheckbox,
  HysInput,
  provideHysConfig,
  type HysAlertProps,
  type HysAlertInstance,
  type HysAlertCloseContext,
  type HysEmptyProps,
  type HysEmptyInstance,
  type HysTimelineItem,
  type HysTimelineProps,
  type HysTimelineInstance,
  type HysTimelineItemContext,
  type HysTheme,
} from "hys-ui";
const theme = ref<HysTheme>("green");
provideHysConfig({ theme, motion: "off" });
const accept = ref(false),
  visible = ref(true),
  requested = ref(0),
  closed = ref(0),
  alert = ref<HysAlertInstance>(),
  empty = ref<HysEmptyInstance>(),
  reverse = ref(false),
  image = ref<string | false>(false),
  failures = ref(0);
const items = ref<HysTimelineItem[]>([
  { id: 0, title: "First", time: "09:00", label: "Today", status: "done" },
  { id: 1, title: "Second", time: "10:00", label: "Later", status: "current" },
]);
const Note = defineComponent({
  props: { title: { type: String, required: true } },
  setup(p) {
    const text = ref("");
    return () =>
      h(HysInput, {
        modelValue: text.value,
        "aria-label": p.title + " note",
        "onUpdate:modelValue": (value: string) => (text.value = value),
      });
  },
});
const alertProps: HysAlertProps = {
  tone: "primary",
  effect: "outline",
  beforeClose: async (context: HysAlertCloseContext) => !context.signal.aborted,
  transition: "collapse",
};
const emptyProps: HysEmptyProps = {
  image: false,
  title: false,
  description: false,
  imageStyle: { height: 100 },
  imageFit: "cover",
  referrerPolicy: "no-referrer",
};
interface RecordItem {
  code: number;
  details: { name: string };
}
const records: RecordItem[] = [{ code: 0, details: { name: "Mapped record" } }];
const mapped: HysTimelineProps<RecordItem> = {
  items: records,
  itemKey: (r) => r.code,
  fieldNames: { title: "details.name" },
  mode: "alternate",
};
function legacy(item: HysTimelineItem) {
  const title: string = item.title;
  return title;
}
function context(info: HysTimelineItemContext<RecordItem>) {
  const name: string = info.item.details.name;
  const source: number = info.sourceIndex;
  return name + source;
}
function alertInstance(
  instance: InstanceType<typeof HysAlert>,
): HysAlertInstance {
  return instance;
}
function emptyInstance(
  instance: InstanceType<typeof HysEmpty>,
): HysEmptyInstance {
  return instance;
}
const timeline = ref<HysTimelineInstance<RecordItem>>();
async function methods() {
  await alert.value?.close();
  await alert.value?.show();
  const retried: boolean | undefined = empty.value?.retryImage();
  const current: RecordItem[] | undefined = timeline.value?.getItems();
  void [retried, current];
}
void [
  alertProps,
  emptyProps,
  legacy,
  context,
  alertInstance,
  emptyInstance,
  methods,
];
</script>
<template>
  <div style="display: grid; gap: 20px; max-width: 720px; padding: 20px">
    <HysButton @click="theme = theme === 'green' ? 'dark' : 'green'"
      >Toggle feedback theme</HysButton
    >
    <HysCheckbox v-model="accept" label="Accept installed close" />
    <HysButton @click="visible = true">Restore installed alert</HysButton>
    <HysAlert
      ref="alert"
      :visible="visible"
      @update:visible="
        (value) => {
          if (accept) visible = value;
        }
      "
      @close="requested++"
      @after-close="closed++"
      tone="primary" title="Installed alert"
      effect="outline"
      closable
      show-icon
      aria-label="Installed alert"
      ><template #action="{ closing, close }"
        ><HysButton size="sm" :disabled="closing" @click="close"
          >Dismiss installed alert</HysButton
        ></template
      ></HysAlert
    >
    <output id="feedback-count">{{ requested }} / {{ closed }}</output>
    <HysButton @click="image = 'data:image/png;base64,broken'"
      >Break installed image</HysButton
    >
    <HysEmpty
      ref="empty"
      :image="image"
      title="Installed empty"
      @image-error="failures++"
      aria-label="Installed empty"
      ><template #fallback="{ retryImage }"
        ><HysButton @click="retryImage"
          >Retry installed image</HysButton
        ></template
      ><template #action
        ><HysButton>Empty action</HysButton></template
      ></HysEmpty
    ><output id="feedback-image-errors">{{ failures }}</output>
    <HysCheckbox
      v-model="reverse"
      label="Reverse installed timeline"
    /><HysButton @click="items = items.map((item) => ({ ...item }))"
      >Clone installed records</HysButton
    >
    <HysTimeline
      :items="items"
      :reverse="reverse"
      mode="alternate"
      pending="Next"
      aria-label="Installed timeline"
      ><template #item="{ item, index, sourceIndex }"
        ><strong>{{ item.title }}</strong
        ><Note :title="item.title" /><small
          >{{ index }} / {{ sourceIndex }}</small
        ></template
      ></HysTimeline
    >
    <HysTimeline ref="timeline" v-bind="mapped" aria-label="Mapped timeline"
      ><template #item="{ item }">{{
        item.details.name
      }}</template></HysTimeline
    >
  </div>
</template>
