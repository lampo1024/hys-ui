<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
} from "vue";
import { LoaderCircle, RotateCw } from "lucide-vue-next";
import HysInput from "../HysInput/HysInput.vue";
import { useHysRootAttrs } from "../../config";
import {
  fieldKey,
  formKey,
  useHysControlState,
} from "../../composables/formContext";
import { useFloating } from "../../composables/useFloating";
import {
  autocompleteValue,
  normalizeAutocomplete,
  type HysAutocompleteProps,
  type HysAutocompleteDataOption,
  type HysAutocompleteItem,
  type HysAutocompleteRow,
} from "../../composables/autocomplete";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysAutocompleteProps>(), {
  defaultValue: "",
  options: () => [],
  valueKey: "value",
  labelKey: "label",
  filterOption: undefined,
  caseSensitive: false,
  debounce: 300,
  minQueryLength: 0,
  triggerOnFocus: true,
  loopNavigation: true,
  bordered: true,
  placement: "bottom-start",
  appendTo: "body",
  popupMatchWidth: true,
  listHeight: 256,
  emptyText: "暂无建议",
  loadingText: "正在加载建议…",
  errorText: "建议加载失败，请重试",
  open: undefined,
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [open: boolean];
  input: [value: string];
  change: [value: string];
  search: [query: string];
  select: [item: HysAutocompleteItem, value: string];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  pressEnter: [event: KeyboardEvent];
  visibleChange: [open: boolean];
  searchError: [error: unknown, query: string];
}>();
const attrs = useAttrs(),
  skin = useHysRootAttrs(),
  field = inject(fieldKey, undefined),
  form = inject(formKey, undefined),
  { disabled, size, label: fieldLabel } = useHysControlState(props);
const root = ref<HTMLElement>(),
  panel = ref<HTMLElement>(),
  list = ref<HTMLElement>(),
  control = ref<HTMLInputElement | HTMLTextAreaElement>(),
  id = useId(),
  local = ref(props.defaultValue ?? ""),
  preview = ref<string>(),
  draft = ref<string>(),
  composing = ref(false),
  active = ref<string>(),
  pending = ref(false),
  failure = shallowRef<unknown>(),
  hasError = ref(false),
  remote = shallowRef<readonly HysAutocompleteDataOption[]>([]);
const current = computed(() =>
    String(
      props.modelValue === undefined ? local.value : (props.modelValue ?? ""),
    ),
  ),
  display = computed(() => draft.value ?? preview.value ?? current.value),
  mutable = computed(() => !disabled.value && !props.readonly),
  isRemote = computed(() => typeof props.fetchSuggestions === "function"),
  busy = computed(() => !!props.loading || pending.value);
const data = computed(() =>
  isRemote.value
    ? remote.value
    : Array.isArray(props.options) && props.options.length
      ? props.options
      : Array.isArray(props.fetchSuggestions)
        ? props.fetchSuggestions
        : [],
);
const rows = computed(() =>
    normalizeAutocomplete(data.value, current.value, {
      valueKey: props.valueKey,
      labelKey: props.labelKey,
      filter: props.filterOption ?? !isRemote.value,
      caseSensitive: props.caseSensitive,
    }),
  ),
  choices = computed(() => rows.value.filter((row) => row.kind === "option")),
  suggestions = computed(() => choices.value.map((row) => row.item)),
  enabled = computed(() => choices.value.filter((row) => !row.disabled)),
  activeRow = computed(() =>
    rows.value.find(
      (row) =>
        row.key === active.value && row.kind === "option" && !row.disabled,
    ),
  ),
  highlightedIndex = computed(() =>
    choices.value.findIndex((row) => row.key === active.value),
  );
let live = true,
  request = 0,
  edit = 0,
  noQueryEdit = -1,
  immediateOpen = false,
  focusGeneration = 0,
  expected: string | undefined,
  withinFocus = false,
  suppressFocus = false,
  pendingNavigation: "first" | "last" | undefined,
  controller: AbortController | undefined,
  timer: ReturnType<typeof setTimeout> | undefined,
  resize: ResizeObserver | undefined;
const floating = useFloating(root, panel, {
  closeOnTab: false,
  get placement() {
    return props.placement;
  },
  matchWidth: () => (props.popupMatchWidth ? true : "min"),
  width: () => props.popupWidth,
  requestOpen: (next) => {
    emit("update:open", next);
    return props.open === undefined ? undefined : false;
  },
});
const isOpen = floating.open;
const popupStyle = computed<CSSProperties>(() => ({
  ...props.popupStyle,
  ...floating.style.value,
  overflowY: "hidden",
}));
const minLength = computed(() =>
    Math.max(0, Math.floor(Number(props.minQueryLength) || 0)),
  ),
  height = computed(() =>
    Math.max(64, Math.min(1200, Number(props.listHeight) || 256)),
  );
function allowed(value = current.value) {
  if (!live || !mutable.value || value.length < minLength.value) return false;
  try {
    return props.getShow?.(value) !== false;
  } catch {
    return false;
  }
}
function syncControl() {
  const node = root.value?.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >('input:not([type="hidden"]),textarea');
  if (control.value !== node) control.value = node ?? undefined;
}
function cancel() {
  request++;
  controller?.abort();
  controller = undefined;
  clearTimeout(timer);
  timer = undefined;
  pending.value = false;
}
function close(force = false) {
  preview.value = undefined;
  pendingNavigation = undefined;
  floating.close(false, force);
}
function focus(options?: FocusOptions) {
  if (!disabled.value) {
    syncControl();
    control.value?.focus(options);
  }
}
function blur() {
  syncControl();
  control.value?.blur();
  close();
}
function refreshPosition() {
  if (isOpen.value) floating.update();
}
async function reveal() {
  await nextTick();
  const node = list.value?.querySelector<HTMLElement>(
    '[id="' + id + "-option-" + active.value + '"]',
  );
  if (!node || !list.value) return;
  const top = node.offsetTop,
    bottom = top + node.offsetHeight,
    visible = list.value.clientHeight || height.value;
  if (top < list.value.scrollTop) list.value.scrollTop = top;
  else if (bottom > list.value.scrollTop + visible)
    list.value.scrollTop = bottom - visible;
}
function activate(row: HysAutocompleteRow | undefined, keyboard = false) {
  active.value = row?.key;
  if (keyboard && props.backfill && row)
    preview.value = (props.append ? current.value : "") + row.value;
  else preview.value = undefined;
  if (keyboard) void reveal();
}
function initial() {
  const row =
    pendingNavigation === "last"
      ? enabled.value.at(-1)
      : pendingNavigation === "first" || props.highlightFirst
        ? enabled.value[0]
        : undefined;
  activate(row, !!pendingNavigation);
  pendingNavigation = undefined;
}
function requestData(query = current.value, immediate = false) {
  cancel();
  failure.value = undefined;
  hasError.value = false;
  if (!isOpen.value || !allowed(query)) return;
  if (!isRemote.value) {
    initial();
    void nextTick(refreshPosition);
    return;
  }
  const token = request,
    abort = new AbortController();
  controller = abort;
  remote.value = [];
  pending.value = true;
  active.value = undefined;
  preview.value = undefined;
  let settled = false;
  const valid = () =>
    live &&
    request === token &&
    !abort.signal.aborted &&
    isOpen.value &&
    mutable.value;
  const done = (result: readonly HysAutocompleteDataOption[]) => {
    if (settled || !valid()) return;
    settled = true;
    remote.value = Array.isArray(result) ? result : [];
    pending.value = false;
    initial();
    void nextTick(refreshPosition);
  };
  const fail = (error: unknown) => {
    if (settled || !valid()) return;
    settled = true;
    pending.value = false;
    failure.value = error;
    hasError.value = true;
    emit("searchError", error, query);
    void nextTick(refreshPosition);
  };
  const run = () => {
    timer = undefined;
    if (!valid()) return;
    try {
      const result = (
        props.fetchSuggestions as Exclude<
          typeof props.fetchSuggestions,
          readonly HysAutocompleteDataOption[] | undefined
        >
      )(query, done, { signal: abort.signal });
      if (result && typeof (result as Promise<unknown>).then === "function")
        void Promise.resolve(result)
          .then((value) => {
            if (Array.isArray(value)) done(value);
          })
          .catch(fail);
      else if (Array.isArray(result)) done(result);
    } catch (error) {
      fail(error);
    }
  };
  const delay = Math.max(0, Math.min(60000, Number(props.debounce) || 0));
  if (immediate || !delay) run();
  else timer = setTimeout(run, delay);
}
async function open() {
  if (!allowed()) return;
  await floating.show(props.open === true);
}
async function getData() {
  if (!allowed()) return;
  const was = isOpen.value;
  immediateOpen = !was;
  await open();
  immediateOpen = false;
  if (was && isOpen.value) requestData(current.value, true);
}
function publish(value: string, query = true) {
  if (!live || !mutable.value) return;
  draft.value = undefined;
  preview.value = undefined;
  if (value === expected || (value === current.value && expected === undefined))
    return;
  const previous = current.value,
    ticket = ++edit;
  expected = value;
  if (props.modelValue === undefined) local.value = value;
  emit("update:modelValue", value);
  emit("input", value);
  void nextTick(async () => {
    if (!live || ticket !== edit) return;
    expected = undefined;
    if (current.value !== value) return;
    if (previous !== value) emit("change", value);
    if (query && ticket !== noQueryEdit) {
      emit("search", value);
      pendingNavigation = undefined;
      if (!allowed(value)) {
        cancel();
        close();
        return;
      }
      if (isOpen.value) requestData(value);
      else await open();
    }
  });
}
function setValue(value: string | number | null) {
  const text = String(value ?? "");
  if (composing.value) {
    draft.value = text;
    return;
  }
  publish(text);
}
function clear() {
  if (!mutable.value) return;
  suppressFocus = true;
  cancel();
  draft.value = undefined;
  preview.value = undefined;
  publish("", false);
  noQueryEdit = edit;
  close();
  emit("clear");
  void nextTick(() => {
    suppressFocus = false;
  });
}
async function choose(row: HysAutocompleteRow | undefined, retainFocus = true) {
  if (!row || row.disabled || !mutable.value || busy.value || !live) return;
  const value = (props.append ? current.value : "") + row.value,
    target = props.clearAfterSelect ? "" : value;
  publish(target, false);
  const ticket = edit;
  await nextTick();
  if (!live || ticket !== edit || current.value !== target || !mutable.value)
    return;
  emit("select", row.item, value);
  close();
  if (props.blurAfterSelect) blur();
  else if (retainFocus) {
    suppressFocus = true;
    focus({ preventScroll: true });
    suppressFocus = false;
  }
}
async function select(item: HysAutocompleteItem) {
  await choose({
    key: "external",
    kind: "option",
    label:
      typeof item === "string"
        ? item
        : String(
            item.label ??
              autocompleteValue(item, props.valueKey, props.labelKey),
          ),
    value: autocompleteValue(item, props.valueKey, props.labelKey),
    disabled: typeof item !== "string" && !!item.disabled,
    item,
  });
}
function highlight(index: number) {
  const row = choices.value[Math.floor(index)];
  activate(row && !row.disabled ? row : undefined, true);
}
async function key(event: KeyboardEvent) {
  if (
    !mutable.value ||
    event.isComposing ||
    composing.value ||
    event.keyCode === 229
  )
    return;
  const target = event.target as Element;
  if (!target.matches("input,textarea")) return;
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    const positive = event.key === "ArrowDown" || event.key === "PageDown";
    if (!isOpen.value) {
      pendingNavigation = positive ? "first" : "last";
      await open();
      return;
    }
    const items = enabled.value;
    if (!items.length) {
      pendingNavigation = positive ? "first" : "last";
      return;
    }
    let index = items.findIndex((row) => row.key === active.value);
    if (index < 0) index = positive ? -1 : items.length;
    const step = event.key.startsWith("Page")
      ? Math.max(
          1,
          Math.floor(
            height.value /
              (size.value === "sm" ? 30 : size.value === "lg" ? 44 : 36),
          ),
        )
      : 1;
    let next = index + (positive ? step : -step);
    next = props.loopNavigation
      ? ((next % items.length) + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, next));
    activate(items[next], true);
  } else if ((event.key === "Home" || event.key === "End") && isOpen.value) {
    event.preventDefault();
    activate(
      event.key === "Home" ? enabled.value[0] : enabled.value.at(-1),
      true,
    );
  } else if (event.key === "Enter") {
    if (event.shiftKey && target.matches("textarea")) return;
    emit("pressEnter", event);
    if (isOpen.value && activeRow.value && !busy.value) {
      event.preventDefault();
      event.stopPropagation();
      await choose(activeRow.value);
    } else if (props.selectWhenUnmatched) {
      event.preventDefault();
      event.stopPropagation();
      await select({ [props.valueKey]: current.value });
    } else close();
  } else if (event.key === "Escape") {
    preview.value = undefined;
    close();
  } else if (event.key === "Tab") {
    if (!event.shiftKey && props.selectOnTab && activeRow.value && !busy.value)
      await choose(activeRow.value, false);
    else {
      const first =
        !event.shiftKey && isOpen.value ? panelControls()[0] : undefined;
      if (first) {
        event.preventDefault();
        first.focus();
      } else close();
    }
  }
}
const focusableSelector =
  'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])';
function panelControls() {
  return Array.from(
    panel.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
  ).filter(
    (el) =>
      el.tabIndex >= 0 && el.getClientRects().length && !el.closest("[inert]"),
  );
}
function panelKey(event: KeyboardEvent) {
  if (event.key !== "Tab") return;
  const items = panelControls(),
    focused = document.activeElement;
  if (focused !== (event.shiftKey ? items[0] : items.at(-1))) return;
  event.preventDefault();
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (el) =>
      !panel.value?.contains(el) &&
      el.tabIndex >= 0 &&
      el.getClientRects().length &&
      !el.closest("[inert]"),
  );
  const index = all.indexOf(control.value!);
  close();
  suppressFocus = true;
  (event.shiftKey ? control.value : all[index + 1])?.focus();
  suppressFocus = false;
}
function focusIn(event: FocusEvent) {
  focusGeneration++;
  if (!withinFocus) {
    withinFocus = true;
    emit("focus", event);
  }
  if (
    (event.target as Element).matches("input,textarea") &&
    props.triggerOnFocus &&
    !suppressFocus &&
    !floating.restoringFocus.value
  )
    void open();
}
function clickInput(event: MouseEvent) {
  if (
    props.triggerOnFocus &&
    (event.target as Element).matches("input,textarea") &&
    !isOpen.value
  )
    void open();
}
function focusOut(event: FocusEvent) {
  const generation = focusGeneration;
  queueMicrotask(() => {
    if (!live || generation !== focusGeneration) return;
    const next = document.activeElement;
    if (root.value?.contains(next) || panel.value?.contains(next)) return;
    if (withinFocus) {
      withinFocus = false;
      emit("blur", event);
    }
    close();
  });
}
function compositionStart() {
  composing.value = true;
  draft.value = undefined;
  cancel();
  close();
}
function compositionEnd() {
  composing.value = false;
  const value = draft.value;
  draft.value = undefined;
  if (value !== undefined) publish(value);
}
const inputOptions = computed(() => ({
  ...props.inputProps,
  ...Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  ),
  disabled: disabled.value,
  readonly: props.readonly,
  size: size.value,
  clearable: props.clearable || props.inputProps?.clearable,
  clearIcon: props.clearIcon ?? props.inputProps?.clearIcon,
  placeholder: props.placeholder ?? props.inputProps?.placeholder,
  label: props.label ?? props.inputProps?.label,
  name: props.name ?? props.inputProps?.name,
  status: props.status ?? props.inputProps?.status,
  error: props.error ?? props.inputProps?.error,
  bordered: props.bordered,
  id: (attrs.id as string) || field?.id.value || undefined,
  role: "combobox",
  autocomplete:
    props.inputProps?.autocomplete ?? (attrs.autocomplete as string) ?? "off",
  ariaLabel:
    props.ariaLabel ||
    (attrs["aria-label"] as string) ||
    props.inputProps?.ariaLabel ||
    props.label ||
    fieldLabel.value ||
    "自动补全",
  "aria-autocomplete": props.backfill ? "both" : "list",
  "aria-expanded": isOpen.value,
  "aria-controls": isOpen.value ? id : undefined,
  "aria-activedescendant":
    isOpen.value && activeRow.value
      ? id + "-option-" + activeRow.value.key
      : undefined,
  "aria-busy": busy.value || undefined,
}));
function cleanup() {
  live = false;
  edit++;
  focusGeneration++;
  expected = undefined;
  draft.value = undefined;
  preview.value = undefined;
  withinFocus = false;
  composing.value = false;
  cancel();
  close(true);
  resize?.disconnect();
  resize = undefined;
}
watch(isOpen, (value) => {
  if (value) {
    requestData(current.value, immediateOpen);
  } else {
    cancel();
    preview.value = undefined;
    active.value = undefined;
  }
  emit("visibleChange", value);
});
watch(
  () => props.open,
  (value) => {
    if (value === undefined) return;
    if (value && allowed()) void floating.show(true);
    else close(true);
  },
);
watch(
  () => props.modelValue,
  () => {
    if (expected !== undefined && current.value === expected) return;
    edit++;
    expected = undefined;
    draft.value = undefined;
    preview.value = undefined;
    cancel();
    if (isOpen.value && allowed()) requestData();
    else close();
  },
);
watch(
  () => [disabled.value, props.readonly, props.getShow, props.minQueryLength],
  () => {
    if (!allowed()) {
      cancel();
      close(true);
    }
  },
);
watch(isRemote, () => {
  remote.value = [];
  if (isOpen.value) requestData();
});
watch(rows, () => {
  if (active.value && !activeRow.value) active.value = undefined;
  if (
    isOpen.value &&
    !busy.value &&
    !active.value &&
    (props.highlightFirst || pendingNavigation)
  )
    initial();
  void nextTick(refreshPosition);
});
watch(
  () => form?.resetting.value,
  (value) => {
    if (value) {
      edit++;
      expected = undefined;
      draft.value = undefined;
      preview.value = undefined;
      cancel();
      close(true);
    }
  },
  { flush: "sync" },
);
onUpdated(syncControl);
function observe() {
  resize?.disconnect();
  resize = undefined;
  if (!live) return;
  if (typeof ResizeObserver !== "undefined" && root.value) {
    resize = new ResizeObserver(refreshPosition);
    resize.observe(root.value);
    if (panel.value) resize.observe(panel.value);
  }
}
watch(panel, observe, { flush: "post" });
watch([busy, hasError], () => void nextTick(refreshPosition));
onMounted(() => {
  syncControl();
  observe();
  if (props.autofocus) focus();
  if (props.open ?? props.defaultOpen) void open();
});
onActivated(() => {
  live = true;
  void nextTick(() => {
    syncControl();
    observe();
  });
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  input: control,
  isOpen,
  loading: busy,
  highlightedIndex,
  suggestions,
  focus,
  blur,
  open,
  close: () => close(),
  clear,
  getData,
  retry: getData,
  highlight,
  select,
});
</script>
<template>
  <div
    ref="root"
    v-bind="skin"
    class="hys-ui-autocomplete"
    :class="attrs.class"
    :style="attrs.style as CSSProperties"
    @keydown.capture="key"
    @focusin="focusIn"
    @focusout="focusOut"
    @click="clickInput"
    @compositionstart="compositionStart"
    @compositionend="compositionEnd"
  >
    <slot
      name="input"
      :value="display"
      :set-value="setValue"
      :input-props="inputOptions"
      :loading="busy"
      :clear="clear"
      ><HysInput
        v-bind="inputOptions"
        :model-value="display"
        @update:model-value="setValue"
        @clear="clear"
        ><template v-if="$slots.prefix" #prefix><slot name="prefix" /></template
        ><template v-if="$slots.suffix || (busy && !hideLoading)" #suffix
          ><slot name="suffix" :loading="busy"
            ><LoaderCircle
              v-if="busy && !hideLoading"
              :size="15"
              class="hys-ui-icon-spin" /></slot></template
        ><template v-if="$slots.prepend" #prepend
          ><slot name="prepend" /></template
        ><template v-if="$slots.append" #append><slot name="append" /></template
        ><template v-if="$slots['clear-icon']" #clear-icon
          ><slot name="clear-icon" /></template></HysInput
    ></slot>
  </div>
  <Teleport :to="appendTo || 'body'" :disabled="appendTo === false">
    <div
      v-if="isOpen"
      :id="id + '-panel'"
      ref="panel"
      v-bind="skin"
      class="hys-ui-autocomplete-popup"
      :class="['hys-ui-autocomplete-' + size, popupClass]"
      :style="popupStyle"
      @focusin="focusIn"
      @focusout="focusOut"
      @keydown="panelKey"
    >
      <div v-if="$slots.header" class="hys-ui-autocomplete-header">
        <slot
          name="header"
          :query="current"
          :loading="busy"
          :options="suggestions"
          :close="() => close()"
        />
      </div>
      <div
        :id="id"
        ref="list"
        role="listbox"
        class="hys-ui-autocomplete-list"
        :style="{ maxHeight: height + 'px' }"
        :aria-label="ariaLabel || fieldLabel || '输入建议'"
        :aria-busy="busy || undefined"
      >
        <div
          v-if="busy && !hideLoading"
          class="hys-ui-autocomplete-state"
          role="status"
        >
          <slot name="loading" :query="current"
            ><LoaderCircle :size="17" class="hys-ui-icon-spin" />{{
              loadingText
            }}</slot
          >
        </div>
        <div
          v-else-if="hasError"
          class="hys-ui-autocomplete-state hys-ui-autocomplete-error"
          role="status"
        >
          <slot name="error" :error="failure" :query="current" :retry="getData"
            ><span>{{ errorText }}</span
            ><button type="button" aria-label="重试加载建议" @click="getData">
              <RotateCw :size="14" />重试
            </button></slot
          >
        </div>
        <template v-else
          ><template v-for="row in rows" :key="row.key"
            ><div
              v-if="row.kind === 'group'"
              role="presentation"
              class="hys-ui-autocomplete-group"
            >
              <slot name="group" :label="row.label" :group="row.group">{{
                row.label
              }}</slot>
            </div>
            <div
              v-else
              :id="id + '-option-' + row.key"
              role="option"
              :aria-disabled="row.disabled || undefined"
              :aria-selected="active === row.key"
              class="hys-ui-autocomplete-option"
              :class="{
                'hys-ui-autocomplete-active': active === row.key,
                'hys-ui-autocomplete-disabled': row.disabled,
              }"
              @mousedown.prevent
              @mouseenter="!row.disabled && activate(row)"
              @click="choose(row)"
            >
              <slot
                name="option"
                :item="row.item"
                :option="row"
                :query="current"
                :active="active === row.key"
                ><slot
                  :item="row.item"
                  :option="row"
                  :query="current"
                  :active="active === row.key"
                  ><span class="hys-ui-autocomplete-label" :title="row.label">{{
                    row.label
                  }}</span></slot
                ></slot
              >
            </div></template
          >
          <div
            v-if="!choices.length && !busy"
            class="hys-ui-autocomplete-state"
            role="status"
          >
            <slot name="empty" :query="current">{{ emptyText }}</slot>
          </div></template
        >
      </div>
      <div v-if="$slots.footer" class="hys-ui-autocomplete-footer">
        <slot
          name="footer"
          :query="current"
          :loading="busy"
          :options="suggestions"
          :close="() => close()"
          :clear="clear"
        />
      </div>
    </div>
  </Teleport>
</template>
<style scoped>
.hys-ui-autocomplete {
  min-width: 0;
  width: 100%;
}
.hys-ui-autocomplete-popup {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 10px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: 0 12px 36px #17274420;
  box-sizing: border-box;
  font-size: 13px;
}
.hys-ui-autocomplete-list {
  min-height: 0;
  flex: 1 1 auto;
  position: relative;
  overflow: auto;
  padding: 6px;
  overscroll-behavior: contain;
  display: grid;
  gap: 4px;
}
.hys-ui-autocomplete-option {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  box-sizing: border-box;
  min-width: 0;
  transition: background-color 0.12s;
}
.hys-ui-autocomplete-option:hover:not(.hys-ui-autocomplete-disabled) {
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 6%,
    transparent
  );
}
.hys-ui-autocomplete-option.hys-ui-autocomplete-active {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-autocomplete-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-ui-autocomplete-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.hys-ui-autocomplete-group {
  padding: 8px 10px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-autocomplete-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 18px 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-autocomplete-error {
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-autocomplete-state button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  padding: 4px 6px;
  cursor: pointer;
  font: inherit;
}
.hys-ui-autocomplete-header,
.hys-ui-autocomplete-footer {
  flex: none;
  padding: 12px;
  font-size: 12px;
}
.hys-ui-autocomplete-header {
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-autocomplete-footer {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-autocomplete-sm .hys-ui-autocomplete-option {
  min-height: 30px;
  padding: 5px 8px;
  font-size: 12px;
}
.hys-ui-autocomplete-lg .hys-ui-autocomplete-option {
  min-height: 44px;
  padding: 10px 12px;
  font-size: 15px;
}
[data-hys-motion="off"] .hys-ui-autocomplete-option {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-autocomplete-option {
    transition: none;
  }
}
</style>
