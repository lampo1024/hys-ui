<script setup lang="ts" generic="T extends HysSelectModelValue = string">
import type { HysPopupMotionProps } from "../../motion/popup";

import PopupMotion from "../../motion/PopupMotion";

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
import { Check, ChevronDown, LoaderCircle, Plus, X } from "lucide-vue-next";
import {
  fieldKey,
  formValue,
  useHysControlState,
} from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import { useFloating, type Placement } from "../../composables/useFloating";
import {
  normalizeSelectOptions,
  selectKeyFactory,
  type HysSelectDataOption,
  type HysSelectFieldNames,
  type HysSelectModelValue,
  type HysSelectOption,
  isSelectLabeledValue,
  type HysSelectLabeledValue,
  type HysSelectRow,
  type HysSelectSearchContext,
  type HysSelectValue,
} from "../../composables/selectOptions";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<
    HysPopupMotionProps & {
      modelValue?: T;
      defaultValue?: T;
      options?: HysSelectDataOption[];
      fieldNames?: HysSelectFieldNames;
      valueKey?: string;
      disabled?: boolean;
      readonly?: boolean;
      ariaLabel?: string;
      placeholder?: string;
      multiple?: boolean;
      showSelectAll?: boolean;
      selectAllScope?: "filtered" | "all";
      selectAllText?: string;
      deselectAllText?: string;
      filterable?: boolean;
      clearable?: boolean;
      emptyValues?: readonly unknown[];
      /** 单选清空后的值，也可由函数计算。 */
      clearValue?: HysSelectValue | null | (() => HysSelectValue | null);
      /** 模型以 { value, label } 保存选中项，可在远程选项尚未加载时回显。 */
      labelInValue?: boolean;
      fallbackOption?: false | ((value: HysSelectValue) => HysSelectOption);
      multipleLimit?: number;
      maxTagCount?: number;
      maxTagTextLength?: number;
      removable?: boolean;
      clearSearchAfterSelect?: boolean;
      allowCreate?: boolean;
      createOption?: (label: string) => HysSelectOption | false | null;
      tokenSeparators?: string[];
      clearCreatedOnClear?: boolean;
      loading?: boolean;
      remote?: boolean;
      remoteMethod?: (
        query: string,
        context: HysSelectSearchContext,
      ) => void | HysSelectDataOption[] | Promise<void | HysSelectDataOption[]>;
      debounce?: number;
      searchValue?: string;
      filterMethod?: (query: string, option: HysSelectOption) => boolean;
      filterSort?: (a: HysSelectOption, b: HysSelectOption) => number;
      open?: boolean;
      defaultOpen?: boolean;
      showOnFocus?: boolean;
      retainSearch?: boolean;
      defaultActiveFirst?: boolean;
      /** 无已选项时优先高亮的可选值。 */
      firstActiveValue?: HysSelectValue;
      keyboard?: boolean;
      popupMatchWidth?: boolean;
      popupWidth?: number | string;
      placement?: Placement;
      appendTo?: string | HTMLElement | false;
      popupClass?: string;
      popupStyle?: CSSProperties;
      listHeight?: number;
      virtual?: boolean;
      itemHeight?: number;
      overscan?: number;
      emptyText?: string;
      noMatchText?: string;
      loadingText?: string;
      size?: "sm" | "md" | "lg";
      status?: "error" | "warning" | "success";
      showArrow?: boolean;
      showCheckmark?: boolean;
      bordered?: boolean;
      autofocus?: boolean;
      name?: string;
    }
  >(),
  {
    options: () => [],
    fieldNames: () => ({}),
    valueKey: "value",
    placeholder: "请选择",
    emptyValues: () => ["", null, undefined],
    clearValue: "",
    multipleLimit: 0,
    maxTagCount: 3,
    showSelectAll: true,
    selectAllScope: "filtered",
    selectAllText: "全选",
    deselectAllText: "全不选",
    removable: true,
    clearSearchAfterSelect: false,
    clearCreatedOnClear: true,
    debounce: 0,
    open: undefined,
    defaultActiveFirst: true,
    keyboard: true,
    placement: "bottom-start",
    appendTo: "body",
    listHeight: 240,
    virtual: true,
    overscan: 4,
    emptyText: "暂无选项",
    noMatchText: "没有匹配选项",
    loadingText: "加载中…",
    showArrow: true,
    showCheckmark: true,
    bordered: true,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T, options: HysSelectOption | HysSelectOption[] | undefined];
  clear: [];
  selectAll: [value: T, added: HysSelectOption[]];
  deselectAll: [value: T, removed: HysSelectOption[]];
  "update:open": [open: boolean];
  visibleChange: [open: boolean];
  "update:searchValue": [query: string];
  search: [query: string];
  select: [value: HysSelectValue, option: HysSelectOption];
  deselect: [value: HysSelectValue, option: HysSelectOption];
  removeTag: [value: HysSelectValue, option: HysSelectOption];
  create: [option: HysSelectOption];
  reject: [value: HysSelectValue, reason: "limit" | "create"];
  searchError: [error: unknown, query: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  popupScroll: [event: Event];
  reachEnd: [];
}>();
const attrs = useAttrs(),
  hysRootAttrs = useHysRootAttrs(),
  field = inject(fieldKey, undefined);
const {
  disabled: controlDisabled,
  size: controlSize,
  label: fieldLabel,
} = useHysControlState(props);
const trigger = ref<HTMLElement>(),
  panel = ref<HTMLElement>(),
  viewport = ref<HTMLElement>(),
  searchInput = ref<HTMLInputElement>(),
  id = useId();
const wrappingLabel = ref("");
function syncWrappingLabel() {
  const label = trigger.value?.closest("label");
  if (!label) {
    wrappingLabel.value = "";
    return;
  }
  const copy = label.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll(".hys-ui-select-wrap")
    .forEach((element) => element.remove());
  wrappingLabel.value = (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}
const localValue = shallowRef<HysSelectModelValue>(props.defaultValue ?? null),
  current = computed(() =>
    props.modelValue !== undefined ? props.modelValue : localValue.value,
  );
const multiple = computed(() => props.multiple || Array.isArray(current.value)),
  keyOf = selectKeyFactory(() => props.valueKey);
function modelList(value: HysSelectModelValue): HysSelectValue[] {
  if (Array.isArray(value)) return value.filter((item) => item != null);
  if (value == null || props.emptyValues.some((empty) => Object.is(empty, value))) return [];
  return [value];
}
const modelItems = computed(() => modelList(current.value));
const values = computed<HysSelectValue[]>(() => {
  const list = props.labelInValue
    ? modelItems.value.map((item) => isSelectLabeledValue(item) ? item.value : item)
    : modelItems.value;
  const keys = new Set<string>();
  return list.filter((value) => {
    const key = keyOf(value);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
});
const modelLabels = computed(() => {
  const labels = new Map<string, string>();
  if (props.labelInValue) {
    for (const item of modelItems.value) {
      if (isSelectLabeledValue(item)) labels.set(keyOf(item.value), item.label);
    }
  }
  return labels;
});
const selectedKeys = computed(() => new Set(values.value.map(keyOf))),
  created = shallowRef<HysSelectOption[]>([]),
  optionCache = shallowRef(new Map<string, HysSelectOption>());
const remoteOptions = shallowRef<HysSelectDataOption[] | undefined>(),
  remotePending = ref(false),
  remoteError = shallowRef<unknown>(),
  searchLocal = ref(""),
  draft = ref(props.searchValue ?? ""),
  composing = ref(false);
const query = computed(() => props.searchValue ?? searchLocal.value),
  searchable = computed(() => props.filterable || props.allowCreate);
const normalized = computed(() =>
    normalizeSelectOptions(
      remoteOptions.value ?? props.options,
      props.fieldNames,
      keyOf,
    ),
  ),
  sourceOptions = computed(() =>
    normalized.value.flatMap((row) => (row.option ? [row.option] : [])),
  );
watch(
  [sourceOptions, values, created],
  () => {
    const previous = optionCache.value,
      next = new Map<string, HysSelectOption>();
    for (const option of [...created.value, ...sourceOptions.value])
      next.set(keyOf(option.value), option);
    for (const value of values.value) {
      const key = keyOf(value);
      if (!next.has(key) && previous.has(key))
        next.set(key, previous.get(key)!);
    }
    optionCache.value = next;
  },
  { immediate: true },
);
function fallback(value: HysSelectValue): HysSelectOption | undefined {
  if (props.fallbackOption === false) return;
  return typeof props.fallbackOption === "function"
    ? props.fallbackOption(value)
    : {
        value,
        label:
          typeof value === "object"
            ? String(
                value.label ??
                  value.name ??
                  value[props.valueKey] ??
                  "未命名选项",
              )
            : String(value),
      };
}
function resolveOption(value: HysSelectValue) {
  const key = keyOf(value);
  const label = modelLabels.value.get(key);
  return optionCache.value.get(key) ?? (label === undefined ? fallback(value) : { value, label });
}
const selected = computed(() =>
  values.value.flatMap((value) => {
    const option = resolveOption(value);
    return option ? [option] : [];
  }),
);
const displayedTags = computed(() =>
    selected.value.slice(
      0,
      props.maxTagCount === undefined
        ? undefined
        : Math.max(0, props.maxTagCount),
    ),
  ),
  omittedTags = computed(() =>
    selected.value.slice(displayedTags.value.length),
  );
const busy = computed(() => props.loading || remotePending.value),
  atLimit = computed(
    () =>
      multiple.value &&
      props.multipleLimit > 0 &&
      values.value.length >= props.multipleLimit,
  );
const status = computed(
    () =>
      props.status ?? (field?.invalid?.value ? "error" : field?.status?.value),
  ),
  iconSize = computed(() =>
    controlSize.value === "sm" ? 14 : controlSize.value === "lg" ? 18 : 16,
  );
const rowStride = computed(() =>
  Math.max(
    24,
    props.itemHeight ??
      (controlSize.value === "sm" ? 34 : controlSize.value === "lg" ? 50 : 42),
  ),
);
const candidate = computed(() => {
  const text = query.value.trim();
  if (
    !props.allowCreate ||
    !text ||
    [...sourceOptions.value, ...created.value].some(
      (option) => option.label === text || keyOf(option.value) === keyOf(text),
    )
  )
    return;
  return { value: text, label: text } as HysSelectOption;
});
const filteredRows = computed<HysSelectRow[]>(() => {
  let options: HysSelectRow[] = normalized.value
    .filter((row) => row.option)
    .concat(
      created.value
        .filter(
          (option) =>
            !sourceOptions.value.some(
              (item) => keyOf(item.value) === keyOf(option.value),
            ),
        )
        .map((option) => ({ key: keyOf(option.value), option, index: -1 })),
    );
  if (!props.remote && !props.remoteMethod)
    options = options.filter(
      (row) =>
        !query.value ||
        (props.filterMethod
          ? props.filterMethod(query.value, row.option!)
          : row
              .option!.label.toLocaleLowerCase()
              .includes(query.value.toLocaleLowerCase())),
    );
  if (props.filterSort)
    options = [...options].sort((a, b) =>
      props.filterSort!(a.option!, b.option!),
    );
  if (candidate.value)
    options = [
      {
        key: "create:" + keyOf(candidate.value.value),
        option: candidate.value,
        created: true,
        index: -1,
      },
      ...options,
    ];
  const rows: HysSelectRow[] = [];
  let group: string | undefined,
    index = 0;
  for (const row of options) {
    if (row.group !== group) {
      group = row.group;
      if (group)
        rows.push({ key: "group:" + group + ":" + index, index: -1, group });
    }
    rows.push({ ...row, index: index++ });
  }
  return rows;
});
const bulkShown = computed(() => multiple.value && props.showSelectAll);
const bulkOptions = computed(() => {
  const options =
    props.selectAllScope === "all"
      ? [...sourceOptions.value, ...created.value]
      : filteredRows.value.flatMap((row) =>
          row.option && !row.created ? [row.option] : [],
        );
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = keyOf(option.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return !option.disabled;
  });
});
const bulkBlocked = computed(
    () =>
      controlDisabled.value ||
      props.readonly ||
      busy.value ||
      !!remoteError.value,
  ),
  bulkMissing = computed(() =>
    bulkOptions.value.some(
      (option) => !selectedKeys.value.has(keyOf(option.value)),
    ),
  ),
  bulkSelected = computed(() => {
    const keys = new Set(
      bulkOptions.value.map((option) => keyOf(option.value)),
    );
    return values.value.filter((value) => {
      const option = optionCache.value.get(keyOf(value));
      return (
        !option?.disabled &&
        (props.selectAllScope === "all" || keys.has(keyOf(value)))
      );
    });
  });
const optionCount = computed(
    () => filteredRows.value.filter((row) => row.option).length,
  ),
  activeKey = ref<string>(),
  scrollTop = ref(0),
  triggerWidth = ref(0),
  effectiveVirtual = computed(
    () => props.virtual && filteredRows.value.length > 100,
  );
const safeHeight = computed(() =>
    Math.min(
      800,
      Math.max(80, Number.isFinite(props.listHeight) ? props.listHeight : 240),
    ),
  ),
  safeOverscan = computed(() => Math.max(1, Math.min(30, props.overscan)));
const start = computed(() =>
  effectiveVirtual.value
    ? Math.max(
        0,
        Math.min(
          Math.max(0, filteredRows.value.length - 1),
          Math.floor(scrollTop.value / rowStride.value) - safeOverscan.value,
        ),
      )
    : 0,
);
const visibleRows = computed(() =>
  effectiveVirtual.value
    ? filteredRows.value.slice(
        start.value,
        start.value +
          Math.ceil(safeHeight.value / rowStride.value) +
          safeOverscan.value * 2,
      )
    : filteredRows.value,
);
const activeRow = computed(() =>
    filteredRows.value.find((row) => row.key === activeKey.value),
  ),
  activeId = computed(() =>
    !busy.value &&
    activeRow.value?.option &&
    (!effectiveVirtual.value ||
      visibleRows.value.some((row) => row.key === activeKey.value))
      ? id + "-" + activeRow.value.index
      : undefined,
  );
const virtualWidth = computed(() => {
  if (
    !effectiveVirtual.value ||
    props.popupMatchWidth ||
    props.popupWidth !== undefined
  )
    return props.popupWidth;
  const unit =
    controlSize.value === "sm" ? 12 : controlSize.value === "lg" ? 15 : 14;
  let width = 0;
  for (const row of filteredRows.value) {
    const text = row.option?.label ?? row.group ?? "";
    let length = 0;
    for (const char of text) length += char.charCodeAt(0) > 255 ? 1 : 0.58;
    width = Math.max(width, length * unit);
  }
  return Math.max(triggerWidth.value, width + 52);
});
let live = true,
  logicalFocus = false,
  remoteTicket = 0,
  remoteController: AbortController | undefined,
  remoteTimer: ReturnType<typeof setTimeout> | undefined,
  resizeObserver: ResizeObserver | undefined,
  resizeFrame = 0,
  typeTimer: ReturnType<typeof setTimeout> | undefined,
  typeQuery = "";
const {
  open: dropdownOpen,
  style,
  placement: actualPlacement,
  show,
  close,
  update: updatePosition,
  restoringFocus,
} = useFloating(trigger, panel, {
  get placement() {
    return props.placement;
  },
  get closeOnTab() {
    return !bulkShown.value;
  },
  matchWidth: () => (props.popupMatchWidth ? true : "min"),
  width: () => virtualWidth.value,
  requestOpen: (next) => {
    emit("update:open", next);
    return props.open === undefined ? undefined : false;
  },
});
const panelStyle = computed<CSSProperties>(() => ({
  ...props.popupStyle,
  ...style.value,
  maxHeight: "min(60dvh, calc(100dvh - 20px))",
  overflowY: "hidden",
  "--hys-ui-select-stride": rowStride.value + "px",
  "--hys-ui-select-list-height": safeHeight.value + "px",
}));
const controlAttrs = () =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !["class", "style"].includes(key)),
  );
const blocked = (option: HysSelectOption) =>
  !!option.disabled ||
  props.readonly ||
  busy.value ||
  controlDisabled.value ||
  (atLimit.value && !selectedKeys.value.has(keyOf(option.value)));
function availableRows() {
  return filteredRows.value.filter((row) => row.option && !blocked(row.option));
}
function initialActive(last = false) {
  const rows = availableRows(),
    chosen = rows.find((row) =>
      selectedKeys.value.has(keyOf(row.option!.value)),
    );
  const preferred = !last && props.firstActiveValue !== undefined
    ? rows.find((row) => keyOf(row.option!.value) === keyOf(props.firstActiveValue!))
    : undefined;
  activeKey.value = (
    chosen ??
    preferred ??
    (props.defaultActiveFirst ? (last ? rows.at(-1) : rows[0]) : undefined)
  )?.key;
}
async function revealActive() {
  const index = filteredRows.value.findIndex(
    (row) => row.key === activeKey.value,
  );
  if (index < 0) return;
  if (effectiveVirtual.value && viewport.value) {
    const top = index * rowStride.value,
      bottom = top + rowStride.value,
      height = viewport.value.clientHeight || safeHeight.value;
    if (top < viewport.value.scrollTop) viewport.value.scrollTop = top;
    else if (bottom > viewport.value.scrollTop + height)
      viewport.value.scrollTop = bottom - height;
    scrollTop.value = viewport.value.scrollTop;
  }
  await nextTick();
  if (!effectiveVirtual.value)
    panel.value
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
}
function update(value: HysSelectModelValue) {
  const list = modelList(value);
  if (
    list.length === values.value.length &&
    list.every((item, index) => keyOf(item) === keyOf(values.value[index]))
  )
    return current.value as T;
  let model = value;
  if (props.labelInValue && (Array.isArray(value) || list.length)) {
    const labeled = list.map((item): HysSelectLabeledValue => ({
      value: item, label: resolveOption(item)?.label ?? String(item),
    }));
    model = Array.isArray(value) ? labeled : labeled[0];
  }
  if (props.modelValue === undefined) localValue.value = model;
  const options = list.flatMap((item) => {
    const option = resolveOption(item);
    return option ? [option] : [];
  });
  emit("update:modelValue", model as T);
  emit("change", model as T, multiple.value ? options : options[0]);
  return model as T;
}
function settleBulkFocus() {
  const focused = document.activeElement as HTMLButtonElement | null;
  void nextTick(() => {
    if (focused && panel.value?.contains(focused) && focused.disabled)
      (panelControls()[0] ?? trigger.value)?.focus();
  });
}
function selectAll() {
  if (!multiple.value || bulkBlocked.value) return 0;
  const next = [...values.value],
    added: HysSelectOption[] = [],
    keys = new Set(selectedKeys.value),
    limit = props.multipleLimit > 0 ? props.multipleLimit : Infinity;
  for (const option of bulkOptions.value) {
    const key = keyOf(option.value);
    if (keys.has(key)) continue;
    if (next.length >= limit) break;
    keys.add(key);
    next.push(option.value);
    added.push(option);
  }
  if (!added.length) return 0;
  const model = update(next);
  settleBulkFocus();
  emit("selectAll", model, added);
  return added.length;
}
function deselectAll() {
  if (!multiple.value || bulkBlocked.value) return 0;
  const keys = new Set(bulkSelected.value.map(keyOf));
  if (!keys.size) return 0;
  const next = values.value.filter((value) => !keys.has(keyOf(value))),
    removed = values.value
      .filter((value) => keys.has(keyOf(value)))
      .map(
        (value) =>
          resolveOption(value) ?? { value, label: String(value) },
      );
  const model = update(next);
  settleBulkFocus();
  emit("deselectAll", model, removed);
  return keys.size;
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
function bulkTab(event: KeyboardEvent) {
  const controls = panelControls(),
    focused = document.activeElement,
    index = controls.indexOf(focused as HTMLElement);
  const next =
    focused === trigger.value
      ? !event.shiftKey
        ? controls[0]
        : undefined
      : controls[index + (event.shiftKey ? -1 : 1)];
  if (next) {
    event.preventDefault();
    next.focus();
    return;
  }
  if (panel.value?.contains(focused)) {
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
    const origin = all.indexOf(trigger.value!),
      outside = all
        .slice(origin + 1)
        .find((el) => !trigger.value?.parentElement?.contains(el));
    close();
    (event.shiftKey ? trigger.value : (outside ?? trigger.value))?.focus();
  } else close();
}
function setQuery(text: string) {
  draft.value = text;
  if (props.searchValue === undefined) searchLocal.value = text;
  emit("update:searchValue", text);
}
function storeCreated(option: HysSelectOption) {
  if (!optionCache.value.has(keyOf(option.value))) {
    created.value = [...created.value, option];
    optionCache.value = new Map(optionCache.value).set(
      keyOf(option.value),
      option,
    );
    emit("create", option);
  }
}
function makeOption(text: string): HysSelectOption | undefined {
  try {
    const option = props.createOption
      ? props.createOption(text)
      : { label: text, value: text };
    if (!option) return;
    return { ...option, label: String(option.label) };
  } catch {
    emit("reject", text, "create");
    return;
  }
}
async function choose(row: HysSelectRow | undefined) {
  if (!row?.option || blocked(row.option)) return;
  let option = row.option;
  if (row.created) {
    const made = makeOption(option.label);
    if (!made) return;
    option = optionCache.value.get(keyOf(made.value)) ?? made;
    if (atLimit.value && !selectedKeys.value.has(keyOf(option.value))) {
      emit("reject", option.value, "limit");
      return;
    }
    storeCreated(option);
  }
  const key = keyOf(option.value),
    exists = selectedKeys.value.has(key);
  if (multiple.value) {
    if (exists) {
      update(values.value.filter((value) => keyOf(value) !== key));
      emit("deselect", option.value, option);
    } else {
      if (atLimit.value) {
        emit("reject", option.value, "limit");
        return;
      }
      update([...values.value, option.value]);
      emit("select", option.value, option);
    }
    if (props.clearSearchAfterSelect) setQuery("");
    await nextTick();
    if (dropdownOpen.value && searchable.value) searchInput.value?.focus();
  } else {
    update(option.value);
    emit("select", option.value, option);
    close(true);
  }
}
function remove(option: HysSelectOption) {
  if (
    controlDisabled.value ||
    props.readonly ||
    option.disabled ||
    !props.removable
  )
    return;
  update(values.value.filter((value) => keyOf(value) !== keyOf(option.value)));
  emit("removeTag", option.value, option);
  emit("deselect", option.value, option);
  trigger.value?.focus();
}
function clear() {
  if (controlDisabled.value || props.readonly) return;
  cancelRemote();
  update(multiple.value ? [] : typeof props.clearValue === "function" ? props.clearValue() : props.clearValue);
  if (props.clearCreatedOnClear) created.value = [];
  setQuery("");
  emit("clear");
  if (dropdownOpen.value && searchable.value) searchInput.value?.focus();
  else trigger.value?.focus();
}
async function openDropdown(last = false, force = false) {
  if (!live || controlDisabled.value) return;
  if (!props.retainSearch && !props.searchValue) setQuery("");
  initialActive(last);
  await show(force);
  await nextTick();
  if (dropdownOpen.value) {
    if (searchable.value) searchInput.value?.focus();
    await revealActive();
  }
}
function expand() {
  if (dropdownOpen.value) close();
  else void openDropdown();
}
function cancelRemote() {
  remoteTicket++;
  clearTimeout(remoteTimer);
  remoteTimer = undefined;
  remoteController?.abort();
  remoteController = undefined;
  remotePending.value = false;
}
function requestRemote(text: string, immediate = false) {
  cancelRemote();
  if (
    !props.remoteMethod ||
    !dropdownOpen.value ||
    !live ||
    controlDisabled.value
  )
    return;
  const ticket = remoteTicket,
    controller = new AbortController();
  remoteController = controller;
  remotePending.value = true;
  remoteError.value = undefined;
  const run = async () => {
    try {
      const options = await props.remoteMethod!(text, {
        signal: controller.signal,
      });
      if (
        !live ||
        controller.signal.aborted ||
        ticket !== remoteTicket ||
        !dropdownOpen.value
      )
        return;
      if (Array.isArray(options)) remoteOptions.value = options;
    } catch (error) {
      if (controller.signal.aborted || ticket !== remoteTicket || !live) return;
      remoteError.value = error;
      remoteOptions.value = [];
      emit("searchError", error, text);
    } finally {
      if (ticket === remoteTicket) {
        remotePending.value = false;
        remoteController = undefined;
        await nextTick();
        if (dropdownOpen.value) {
          initialActive();
          updatePosition();
          void revealActive();
        }
      }
    }
  };
  if (immediate || props.debounce <= 0) void run();
  else remoteTimer = setTimeout(run, props.debounce);
}
function retry() {
  requestRemote(query.value, true);
}
function tokenize(text: string) {
  if (
    controlDisabled.value ||
    props.readonly ||
    busy.value ||
    !multiple.value ||
    !props.allowCreate ||
    !props.tokenSeparators?.length
  )
    return false;
  let pieces = [text],
    found = false;
  for (const separator of props.tokenSeparators) {
    if (!separator) continue;
    if (pieces.some((piece) => piece.includes(separator))) found = true;
    pieces = pieces.flatMap((piece) => piece.split(separator));
  }
  if (!found) return false;
  const remainder = pieces.pop() ?? "",
    next = [...values.value],
    keys = new Set(next.map(keyOf));
  let changed = false;
  for (const label of pieces.map((piece) => piece.trim()).filter(Boolean)) {
    const existing = [...sourceOptions.value, ...created.value].find(
        (option) =>
          option.label === label || keyOf(option.value) === keyOf(label),
      ),
      option = existing ?? makeOption(label);
    if (!option) continue;
    const key = keyOf(option.value);
    if (keys.has(key) || option.disabled) continue;
    if (props.multipleLimit > 0 && next.length >= props.multipleLimit) {
      emit("reject", option.value, "limit");
      continue;
    }
    if (!existing) storeCreated(option);
    keys.add(key);
    next.push(option.value);
    changed = true;
    emit("select", option.value, option);
  }
  if (changed) update(next);
  setQuery(remainder);
  return true;
}
function searchEvent(event: Event) {
  if (controlDisabled.value) return;
  const text = (event.target as HTMLInputElement).value;
  draft.value = text;
  if (composing.value) return;
  if (!tokenize(text)) setQuery(text);
}
function compositionEnd(event: CompositionEvent) {
  composing.value = false;
  searchEvent(event);
}
async function keyboard(event: KeyboardEvent) {
  if (
    controlDisabled.value ||
    !props.keyboard ||
    event.isComposing ||
    composing.value ||
    event.keyCode === 229
  )
    return;
  if (event.key === "Tab" && dropdownOpen.value && bulkShown.value) {
    bulkTab(event);
    return;
  }
  if (
    (event.target as HTMLElement).closest(
      ".hys-ui-select-tag button,.hys-ui-select-clear",
    )
  )
    return;
  const inSearch = event.target === searchInput.value;
  const target = event.target as HTMLElement;
  if (
    target !== trigger.value &&
    !inSearch &&
    !target.matches('[role="option"]') &&
    target.closest(
      'button,input,textarea,select,a,[role="button"],[contenteditable="true"]',
    )
  )
    return;
  if (
    ["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(
      event.key,
    )
  ) {
    event.preventDefault();
    if (!dropdownOpen.value)
      await openDropdown(event.key === "ArrowUp" || event.key === "End");
    else {
      const rows = filteredRows.value,
        direction = ["ArrowUp", "End", "PageUp"].includes(event.key) ? -1 : 1;
      let index =
        event.key === "Home"
          ? -1
          : event.key === "End"
            ? rows.length
            : rows.findIndex((row) => row.key === activeKey.value);
      if (event.key.startsWith("Page"))
        index = Math.max(
          -1,
          Math.min(
            rows.length,
            index +
              direction *
                (Math.max(1, Math.floor(safeHeight.value / rowStride.value)) -
                  1),
          ),
        );
      for (let count = 0; count < rows.length; count++) {
        index = (index + direction + rows.length) % rows.length;
        if (rows[index].option && !blocked(rows[index].option!)) {
          activeKey.value = rows[index].key;
          break;
        }
      }
    }
    await revealActive();
  } else if (event.key === "Enter" || (event.key === " " && !inSearch)) {
    event.preventDefault();
    if (dropdownOpen.value) await choose(activeRow.value);
    else await openDropdown();
  } else if (event.key === "Tab")
    close(!!panel.value?.contains(document.activeElement));
  else if (event.key === "Backspace" && multiple.value && !query.value) {
    const option = [...selected.value]
      .reverse()
      .find((option) => !option.disabled);
    if (option && props.removable) {
      event.preventDefault();
      remove(option);
      if (inSearch) {
        await nextTick();
        searchInput.value?.focus();
      }
    }
  } else if (
    !searchable.value &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    typeQuery += event.key.toLocaleLowerCase();
    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => {
      typeQuery = "";
    }, 600);
    if (!dropdownOpen.value) await openDropdown();
    const row = availableRows().find((row) =>
      row.option!.label.toLocaleLowerCase().startsWith(typeQuery),
    );
    if (row) {
      activeKey.value = row.key;
      await revealActive();
    }
  }
}
function focused(event: FocusEvent) {
  if (!logicalFocus) {
    logicalFocus = true;
    emit("focus", event);
  }
  if (
    props.showOnFocus &&
    !dropdownOpen.value &&
    !restoringFocus.value &&
    event.target === trigger.value
  )
    void openDropdown();
}
function blurred(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (next && (trigger.value?.contains(next) || panel.value?.contains(next)))
    return;
  void nextTick(() => {
    const target = document.activeElement;
    if (
      logicalFocus &&
      !trigger.value?.contains(target) &&
      !panel.value?.contains(target)
    ) {
      logicalFocus = false;
      if (bulkShown.value) close();
      emit("blur", event);
    }
  });
}
function scrolled(event: Event) {
  const element = event.target as HTMLElement;
  scrollTop.value = element.scrollTop;
  emit("popupScroll", event);
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 2)
    emit("reachEnd");
}
function stopObserver() {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  cancelAnimationFrame(resizeFrame);
}
function observe() {
  stopObserver();
  if (!dropdownOpen.value || !live) return;
  const update = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      triggerWidth.value = trigger.value?.clientWidth ?? 0;
      updatePosition();
    });
  };
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(update);
    if (trigger.value) resizeObserver.observe(trigger.value);
    if (panel.value) resizeObserver.observe(panel.value);
  }
}
watch(query, (value) => {
  draft.value = value;
  activeKey.value = undefined;
  scrollTop.value = 0;
  if (viewport.value) viewport.value.scrollTop = 0;
  initialActive();
  emit("search", value);
  requestRemote(value);
  if (dropdownOpen.value) void nextTick(revealActive);
});
watch(filteredRows, () => {
  const reset = !activeRow.value?.option || blocked(activeRow.value.option);
  if (reset) initialActive();
  if (dropdownOpen.value)
    void nextTick(() => {
      updatePosition();
      if (reset) void revealActive();
    });
});
watch(
  [
    values,
    controlSize,
    () => props.popupMatchWidth,
    () => props.popupWidth,
    () => props.placement,
  ],
  () => {
    if (dropdownOpen.value) void nextTick(updatePosition);
  },
);
watch(dropdownOpen, (value) => {
  emit("visibleChange", value);
  if (value) {
    triggerWidth.value = trigger.value?.clientWidth ?? 0;
    void nextTick(observe);
    requestRemote(query.value);
  } else {
    stopObserver();
    cancelRemote();
    clearTimeout(typeTimer);
    typeQuery = "";
  }
});
watch(
  () => props.open,
  (value) => {
    if (!live) return;
    if (value) void openDropdown(false, true);
    else if (value === false) close(false, true);
  },
);
watch(
  controlDisabled,
  (value) => {
    if (value) {
      close(false, true);
      cancelRemote();
      emit("update:open", false);
    }
  },
  { flush: "sync" },
);
watch(
  () => props.remoteMethod,
  () => {
    remoteOptions.value = undefined;
    remoteError.value = undefined;
    if (dropdownOpen.value) requestRemote(query.value);
  },
);
function cleanup() {
  live = false;
  close(false, true);
  stopObserver();
  cancelRemote();
  clearTimeout(typeTimer);
  logicalFocus = false;
}
onMounted(() => {
  syncWrappingLabel();
  if (props.autofocus && !controlDisabled.value) trigger.value?.focus();
  if (props.open ?? props.defaultOpen) void openDropdown(false, true);
});
onUpdated(syncWrappingLabel);
onActivated(() => {
  live = true;
  if (props.open) void openDropdown(false, true);
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  focus: () => {
    if (!controlDisabled.value) trigger.value?.focus();
  },
  blur: () => {
    const focused = document.activeElement as HTMLElement | null;
    if (
      focused &&
      (trigger.value?.contains(focused) || panel.value?.contains(focused))
    )
      focused.blur();
    close();
  },
  open: () => openDropdown(),
  close: () => close(),
  scrollTo: (value: HysSelectValue) => {
    activeKey.value = keyOf(value);
    void revealActive();
  },
  retry,
  selectAll,
  deselectAll,
  selected,
  query,
  isOpen: dropdownOpen,
});
</script>
<template>
  <div
    v-bind="hysRootAttrs"
    class="hys-ui-select-wrap"
    :class="[$attrs.class, 'hys-ui-select-' + controlSize]"
    :style="$attrs.style as CSSProperties"
  >
    <!-- A wrapping label activates this proxy instead of clear/remove actions. -->
    <button
      hidden
      type="button"
      tabindex="-1"
      aria-hidden="true"
      :disabled="controlDisabled"
      @click.prevent="
        trigger?.focus();
        expand();
      "
    />
    <div
      ref="trigger"
      v-bind="controlAttrs()"
      class="hys-ui-select"
      :class="{
        'hys-ui-select-disabled': controlDisabled,
        'hys-ui-select-borderless': !bordered,
        'hys-ui-select-error': status === 'error',
        'hys-ui-select-warning': status === 'warning',
        'hys-ui-select-success': status === 'success',
      }"
      :id="($attrs.id as string) || field?.id.value || undefined"
      data-hys-ui-field-managed
      role="combobox"
      :tabindex="controlDisabled ? -1 : 0"
      :aria-label="
        ariaLabel ||
        fieldLabel ||
        wrappingLabel ||
        selected.map((option) => option.label).join('、') ||
        placeholder
      "
      aria-haspopup="listbox"
      :aria-expanded="dropdownOpen"
      :aria-disabled="controlDisabled || undefined"
      :aria-readonly="readonly || undefined"
      :aria-required="field?.required.value || undefined"
      :aria-invalid="status === 'error' || false"
      :aria-describedby="
        [$attrs['aria-describedby'], field?.describedBy.value]
          .filter(Boolean)
          .join(' ') || undefined
      "
      :aria-controls="dropdownOpen ? id : undefined"
      :aria-activedescendant="dropdownOpen ? activeId : undefined"
      @click.prevent="
        !($event.target as HTMLElement).closest('button') && expand()
      "
      @keydown="keyboard"
      @focusin="focused"
      @focusout="blurred"
    >
      <span class="hys-ui-select-label"
        ><slot name="label" :selected="selected"
          ><template v-if="multiple && selected.length"
            ><span
              v-for="option in displayedTags"
              :key="keyOf(option.value)"
              class="hys-ui-select-tag"
              ><slot
                name="tag"
                :option="option"
                :remove="() => remove(option)"
                :disabled="controlDisabled || readonly || option.disabled"
                ><span class="hys-ui-select-tag-text" :title="option.label">{{
                  maxTagTextLength && option.label.length > maxTagTextLength
                    ? option.label.slice(0, maxTagTextLength) + "…"
                    : option.label
                }}</span
                ><button
                  v-if="removable && !readonly && !option.disabled"
                  type="button"
                  :disabled="controlDisabled"
                  :aria-label="'移除 ' + option.label"
                  @click.stop="remove(option)"
                >
                  <slot name="remove-icon"
                    ><X :size="iconSize - 3"
                  /></slot></button></slot></span
            ><span
              v-if="omittedTags.length"
              class="hys-ui-select-tag hys-ui-select-more"
              :title="omittedTags.map((option) => option.label).join('、')"
              ><slot name="max-tag" :omitted="omittedTags"
                >+{{ omittedTags.length }}</slot
              ></span
            ></template
          ><span
            v-else
            class="hys-ui-select-single-label"
            :class="{ 'hys-ui-select-placeholder': !selected.length }"
            :title="selected[0]?.label"
            >{{ selected[0]?.label ?? placeholder }}</span
          ></slot
        ></span
      >
      <span v-if="showArrow || busy" class="hys-ui-select-suffix"
        ><slot name="suffix" :open="dropdownOpen" :loading="busy"
          ><LoaderCircle
            v-if="busy"
            class="hys-ui-icon-spin"
            :size="iconSize" /><ChevronDown
            v-else
            class="hys-ui-select-chevron"
            :size="iconSize"
            aria-hidden="true" /></slot
      ></span>
    </div>
    <button
      v-if="clearable && values.length && !controlDisabled && !readonly"
      type="button"
      class="hys-ui-select-clear"
      aria-label="清空选择"
      @click.stop="clear"
    >
      <slot name="clear-icon"><X :size="iconSize - 2" /></slot>
    </button>
    <template v-if="name"
      ><input
        v-for="(value, index) in values"
        :key="index"
        type="hidden"
        :name="name"
        :value="
          typeof value === 'object'
            ? String(formValue(value, valueKey) ?? '')
            : String(value)
        "
        :disabled="controlDisabled"
    /></template>
    <Teleport
      :to="appendTo === false ? 'body' : appendTo"
      :disabled="appendTo === false"
    >
      <PopupMotion
        :popup-transition="props.popupTransition"
        :popup-transition-duration="props.popupTransitionDuration"
        :placement="actualPlacement"
        ><div
          v-if="dropdownOpen"
          ref="panel"
          v-bind="hysRootAttrs"
          class="hys-ui-select-options hys-ui-floating-surface"
          :class="['hys-ui-select-popup-' + controlSize, popupClass]"
          :data-size="controlSize"
          :data-placement="actualPlacement"
          :style="panelStyle"
          @keydown="keyboard"
          @focusin="focused"
          @focusout="blurred"
        >
          <div v-if="$slots.header" class="hys-ui-select-header">
            <slot
              name="header"
              :query="query"
              :selected="selected"
              :close="() => close()"
            />
          </div>
          <input
            v-if="searchable"
            ref="searchInput"
            :value="draft"
            class="hys-ui-select-search"
            placeholder="搜索选项…"
            aria-label="搜索选项"
            :aria-controls="id"
            :aria-activedescendant="activeId"
            aria-autocomplete="list"
            @input="searchEvent"
            @compositionstart="composing = true"
            @compositionend="compositionEnd"
          />
          <div
            v-if="bulkShown"
            class="hys-ui-select-bulk"
            role="group"
            aria-label="批量选择"
          >
            <span
              class="hys-ui-select-bulk-count"
              aria-live="polite"
              :title="
                selectAllScope === 'filtered'
                  ? '批量操作仅作用于当前结果；禁用项保持不变'
                  : '批量操作所有已加载选项；禁用项保持不变'
              "
              >{{
                selectAllScope === "filtered" && query ? "当前结果 · " : ""
              }}已选 {{ values.length
              }}{{ multipleLimit > 0 ? " / " + multipleLimit : "" }}</span
            >
            <button
              type="button"
              class="hys-ui-select-bulk-action"
              :disabled="bulkBlocked || !bulkMissing || atLimit"
              :aria-label="
                selectAllText +
                (selectAllScope === 'filtered' ? '当前结果' : '全部选项')
              "
              @click="selectAll"
            >
              {{ selectAllText }}
            </button>
            <button
              type="button"
              class="hys-ui-select-bulk-action"
              :disabled="bulkBlocked || !bulkSelected.length"
              :aria-label="
                deselectAllText +
                (selectAllScope === 'filtered' ? '当前结果' : '全部选项')
              "
              @click="deselectAll"
            >
              {{ deselectAllText }}
            </button>
          </div>
          <div
            :id="id"
            ref="viewport"
            role="listbox"
            :aria-label="ariaLabel || fieldLabel || '可选项'"
            :aria-multiselectable="multiple || undefined"
            :aria-busy="busy || undefined"
            class="hys-ui-select-list"
            :style="{
              maxHeight: 'min(' + safeHeight + 'px, 45dvh)',
            }"
            @scroll="scrolled"
          >
            <p v-if="busy" class="hys-ui-floating-empty" role="status">
              <slot name="loading">{{ loadingText }}</slot>
            </p>
            <div
              v-else-if="remoteError"
              class="hys-ui-floating-empty"
              role="status"
            >
              <slot name="error" :error="remoteError" :retry="retry"
                >加载失败，<button
                  type="button"
                  class="hys-ui-select-retry"
                  @click="retry"
                >
                  重试
                </button></slot
              >
            </div>
            <template v-else-if="filteredRows.length"
              ><div
                :style="
                  effectiveVirtual
                    ? {
                        height: filteredRows.length * rowStride + 'px',
                        position: 'relative',
                      }
                    : undefined
                "
                role="presentation"
              >
                <div
                  :style="
                    effectiveVirtual
                      ? {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          transform: 'translateY(' + start * rowStride + 'px)',
                        }
                      : undefined
                  "
                  role="presentation"
                >
                  <template v-for="row in visibleRows" :key="row.key"
                    ><div
                      v-if="!row.option"
                      class="hys-ui-select-group"
                      :style="
                        effectiveVirtual
                          ? { height: rowStride + 'px' }
                          : undefined
                      "
                      role="presentation"
                    >
                      <slot name="group" :label="row.group">{{
                        row.group
                      }}</slot>
                    </div>
                    <button
                      v-else
                      :id="id + '-' + row.index"
                      type="button"
                      role="option"
                      tabindex="-1"
                      class="hys-ui-select-option"
                      :class="{
                        'hys-ui-selected': selectedKeys.has(
                          keyOf(row.option.value),
                        ),
                        'hys-ui-active':
                          activeKey === row.key && !blocked(row.option),
                        'hys-ui-select-created': row.created,
                      }"
                      :style="
                        effectiveVirtual
                          ? {
                              height:
                                'calc(var(--hys-ui-select-stride) - var(--hys-ui-select-option-gap))',
                              minHeight: 0,
                            }
                          : undefined
                      "
                      :data-active="activeKey === row.key"
                      :aria-label="
                        row.created
                          ? '创建 ' + row.option.label
                          : row.option.label
                      "
                      :aria-description="row.group"
                      :aria-selected="selectedKeys.has(keyOf(row.option.value))"
                      :aria-setsize="optionCount"
                      :aria-posinset="row.index + 1"
                      :disabled="blocked(row.option)"
                      @pointerenter="
                        !blocked(row.option) && (activeKey = row.key)
                      "
                      @click="choose(row)"
                    >
                      <span
                        class="hys-ui-select-option-label"
                        :title="row.option.label"
                        ><slot
                          name="option"
                          :option="row.option"
                          :selected="selectedKeys.has(keyOf(row.option.value))"
                          :created="!!row.created"
                          ><span
                            v-if="row.created"
                            class="hys-ui-select-create-label"
                            ><Plus :size="iconSize" />创建
                            {{ row.option.label }}</span
                          ><template v-else>{{
                            row.option.label
                          }}</template></slot
                        ></span
                      ><slot
                        v-if="
                          showCheckmark &&
                          selectedKeys.has(keyOf(row.option.value))
                        "
                        name="selected-icon"
                        :option="row.option"
                        ><Check :size="iconSize - 1" aria-hidden="true"
                      /></slot>
                    </button>
                  </template>
                </div></div
            ></template>
            <p v-else class="hys-ui-floating-empty">
              <slot name="empty" :query="query">{{
                query ? noMatchText : emptyText
              }}</slot>
            </p>
          </div>
          <div v-if="$slots.footer" class="hys-ui-select-footer">
            <slot
              name="footer"
              :query="query"
              :selected="selected"
              :close="() => close()"
            />
          </div></div
      ></PopupMotion>
    </Teleport>
  </div>
</template>

<style scoped>
.hys-ui-select-bulk {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 4px 2px 7px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  font-size: 0.85em;
  line-height: 1.4;
  min-width: 0;
  white-space: nowrap;
}
.hys-ui-select-bulk-count {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-select-bulk-action {
  flex: none;
  height: 26px;
  min-width: 0;
  padding: 0 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  font: inherit;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  white-space: nowrap;
  cursor: pointer;
}
.hys-ui-select-bulk-action:hover:not(:disabled) {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-select-bulk-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-select-bulk-action:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}

.hys-ui-select-wrap {
  position: relative;
  min-width: 0;
}
.hys-ui-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  text-align: left;
  font: inherit;
}
.hys-ui-select:focus-visible {
  outline: none;
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 10%,
      transparent
    );
}
.hys-ui-select-label {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}
.hys-ui-select-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-size: 12px;
}
.hys-ui-select-options {
  padding: 6px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 9px;
}
.hys-ui-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  min-height: 36px;
  width: 100%;
  padding: 8px 10px;
  margin: 3px 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
}
.hys-ui-select-option:not(:disabled):hover {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-select-option.hys-ui-active {
  outline: 1px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 50%,
      transparent
    );
  outline-offset: -1px;
}
.hys-ui-select-option.hys-ui-selected {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-weight: 550;
}
.hys-ui-select-option:disabled {
  opacity: 0.45;
}
.hys-ui-select-chevron {
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  transition: transform 0.15s;
}
.hys-ui-select[aria-expanded="true"] .hys-ui-select-chevron {
  transform: rotate(180deg);
}
.hys-ui-select-clear {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  padding: 2px;
  border: 0;
  border-radius: 4px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-select-search {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 5px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 6px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  font: inherit;
  color: inherit;
}
.hys-ui-select-sm .hys-ui-select {
  min-height: 30px;
  padding: 5px 10px;
  font-size: 12px;
}
.hys-ui-select-lg .hys-ui-select {
  min-height: 44px;
  padding: 11px 14px;
  font-size: 15px;
}
.hys-ui-select-option {
  white-space: nowrap;
  min-width: 0;
}
.hys-ui-select-option-label {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-select-option > svg {
  flex: none;
}
.hys-ui-select-label {
  flex: 1;
}
.hys-ui-select-single-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-select-options {
  --hys-ui-select-option-height: 36px;
  --hys-ui-select-option-padding: 7px 10px;
  --hys-ui-select-option-margin: 3px 0;
  --hys-ui-select-search-padding: 6px 10px;
  font-size: 14px;
  line-height: 1.5;
}
.hys-ui-select-popup-sm {
  --hys-ui-select-option-height: 30px;
  --hys-ui-select-option-padding: 5px 8px;
  --hys-ui-select-option-margin: 2px 0;
  --hys-ui-select-search-padding: 5px 8px;
  font-size: 12px;
  padding: 4px;
}
.hys-ui-select-popup-lg {
  --hys-ui-select-option-height: 42px;
  --hys-ui-select-option-padding: 9px 12px;
  --hys-ui-select-option-margin: 4px 0;
  --hys-ui-select-search-padding: 8px 12px;
  font-size: 15px;
  padding: 8px;
}
.hys-ui-select-options .hys-ui-select-option {
  min-height: var(--hys-ui-select-option-height);
  padding: var(--hys-ui-select-option-padding);
  margin: var(--hys-ui-select-option-margin);
  font: inherit;
  line-height: 1.5;
}
.hys-ui-select-options .hys-ui-select-search {
  min-height: var(--hys-ui-select-option-height);
  padding: var(--hys-ui-select-search-padding);
  font: inherit;
  line-height: 1.5;
}
.hys-ui-select-options .hys-ui-floating-empty {
  padding: var(--hys-ui-select-option-padding);
  font-size: inherit;
  line-height: 1.5;
}
.hys-ui-select-sm .hys-ui-select-tag {
  font-size: 11px;
}
.hys-ui-select-lg .hys-ui-select-tag {
  font-size: 13px;
}
</style>
<style scoped>
.hys-ui-select {
  box-sizing: border-box;
  cursor: pointer;
}
.hys-ui-select-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-select-borderless {
  border-color: transparent;
  background: transparent;
}
.hys-ui-select-error {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-select-warning {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-select-success {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
.hys-ui-select-placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-select-suffix {
  display: flex;
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  line-height: 1.6;
}
.hys-ui-select-tag-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-select-tag button {
  display: grid;
  place-items: center;
  flex: none;
  padding: 1px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.hys-ui-select-tag button:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.hys-ui-select-tag button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.hys-ui-select:has(+ .hys-ui-select-clear) .hys-ui-select-label {
  padding-right: 16px;
}
.hys-ui-select-clear {
  cursor: pointer;
}
.hys-ui-select-options {
  --hys-ui-select-option-gap: 6px;
}
.hys-ui-select-popup-sm {
  --hys-ui-select-option-gap: 4px;
}
.hys-ui-select-popup-lg {
  --hys-ui-select-option-gap: 8px;
}
.hys-ui-select-list {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  min-width: 0;
}
.hys-ui-select-options {
  display: flex;
  flex-direction: column;
}
.hys-ui-select-header,
.hys-ui-select-footer,
.hys-ui-select-search {
  flex-shrink: 0;
}
.hys-ui-select-option {
  box-sizing: border-box;
  cursor: pointer;
}
.hys-ui-select-option:disabled {
  cursor: not-allowed;
}
.hys-ui-select-search {
  box-sizing: border-box;
  outline: none;
}
.hys-ui-select-search:focus {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-select-group {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  font-size: 0.86em;
  font-weight: 600;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-select-create-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hys-ui-select-header,
.hys-ui-select-footer {
  padding: 6px 4px;
}
.hys-ui-select-header {
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  margin-bottom: 5px;
}
.hys-ui-select-footer {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  margin-top: 5px;
}
.hys-ui-select-retry {
  border: 0;
  background: transparent;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font: inherit;
  cursor: pointer;
}
</style>
