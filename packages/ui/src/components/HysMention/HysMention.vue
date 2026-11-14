<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
  type FunctionalComponent,
  type StyleValue,
  type VNodeChild,
} from "vue";
import PopupMotion from "../../motion/PopupMotion";
import {
  useHysControlState,
  useHysFormItemContext,
} from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import { useFloating } from "../../composables/useFloating";
import { useMentionCaret } from "../../composables/useMentionCaret";
import {
  useMentionOptions,
  type MentionEntry,
} from "../../composables/useMentionOptions";
import { useMentionList } from "../../composables/useMentionList";
import {
  diffMentionEntities,
  useMentionModel,
} from "../../composables/useMentionModel";
import {
  deserializeMentionDocument,
  matchMention,
  mentionSegments,
  mentionTriggers,
  normalizeMentionEntities,
  rebaseMentionEntities,
  serializeMentionDocument,
} from "../../composables/mentionDocument";
import {
  isNativeMentionInput,
  readMentionSelection,
  writeMentionSelection,
  type MentionSelection,
} from "../../composables/mentionEditor";
import type {
  HysMentionAction,
  HysMentionContext,
  HysMentionDocument,
  HysMentionEntity,
  HysMentionInsertOptions,
  HysMentionLocale,
  HysMentionOpenOptions,
  HysMentionOption,
  HysMentionProps,
  HysMentionSlots,
  HysMentionUser,
} from "../../composables/mention";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysMentionProps>(), {
  defaultValue: "",
  split: " ",
  type: "textarea",
  maxOptions: 8,
  placement: "bottom-start",
  offset: 6,
  appendTo: "body",
  debounce: 180,
  minQueryLength: 0,
  restoreFocus: true,
  autoAdjustOverflow: true,
  invalidEntity: "mark",
  filterOption: undefined,
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:entities": [entities: HysMentionEntity[]];
  select: [user: HysMentionUser, prefix: string, option: HysMentionOption];
  search: [query: string, prefix: string, context: HysMentionContext];
  create: [option: HysMentionOption, context: HysMentionContext];
  loadError: [error: unknown, context: HysMentionContext];
  openChange: [open: boolean];
  change: [value: string];
  documentChange: [document: HysMentionDocument];
  entityAdd: [entity: HysMentionEntity];
  entityRemove: [entity: HysMentionEntity];
  wholeRemove: [value: string, prefix: string];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const attrs = useAttrs();
const slots = defineSlots<HysMentionSlots>();
const skin = useHysRootAttrs();
const { disabled, size, label } = useHysControlState(props);
const field = useHysFormItemContext();
const id = useId();
const words = computed<HysMentionLocale>(() => ({
  input: "提及输入",
  list: "提及候选成员",
  placeholder: "输入 @ 提及成员",
  loading: "正在加载候选…",
  empty: "没有匹配的候选",
  error: props.errorText ?? "候选加载失败",
  retry: "重试",
  more: "加载更多",
  recent: "最近使用",
  recommended: "常用推荐",
  clear: "清空输入",
  create: "创建 {value}",
  ...props.locale,
}));
const editor = useMentionModel(
  props,
  (document, _previous, changed) => {
    if (changed) emit("update:modelValue", document.text);
    emit("update:entities", document.entities);
    if (changed) emit("change", document.text);
  },
  (document, previous) => {
    const { added, removed } = diffMentionEntities(
      previous.entities,
      document.entities,
    );
    for (const entity of removed) emit("entityRemove", entity);
    for (const entity of added) emit("entityAdd", entity);
    emit("documentChange", document);
  },
);
const { value, entities } = editor;
const input = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const listbox = ref<HTMLElement>();
const highlightLayer = ref<HTMLElement>();
const arrowStyle = shallowRef<CSSProperties>({});
const caret = ref(value.value.length);
const focused = ref(false);
const touched = ref(false);
const mounted = ref(false);
const composing = ref(false);
const draft = ref("");
const dismissed = ref(false);
const active = ref(0);
const manual = shallowRef<HysMentionContext>();
const editable = computed(() => !disabled.value && !props.readonly);
const isRich = computed(() => props.type === "rich");
const limit = computed(() =>
  Number.isFinite(props.maxlength)
    ? Math.max(0, Math.floor(props.maxlength!))
    : undefined,
);
const minimumLength = computed(() =>
  Number.isFinite(props.minlength)
    ? Math.max(0, Math.floor(props.minlength!))
    : undefined,
);
const required = computed(() => props.required || field.required.value);
const invalid = computed(
  () =>
    props.status === "error" ||
    field.invalid.value ||
    (limit.value !== undefined && value.value.length > limit.value) ||
    (touched.value &&
      ((required.value && !value.value) ||
        (!!value.value &&
          minimumLength.value !== undefined &&
          value.value.length < minimumLength.value))),
);
const rules = computed(() => mentionTriggers(props));
const ruleFor = (prefix: string) =>
  rules.value.find((rule) => rule.prefix === prefix);
const splitFor = (prefix: string) => ruleFor(prefix)?.split ?? props.split;
const tokenAt = (text: string, end: number) =>
  matchMention(text, end, rules.value, props);
const token = computed(() => tokenAt(value.value, caret.value));
const searchable = computed(() => {
  if (!focused.value || !editable.value || composing.value) return;
  const recommendation =
    props.recommendOnFocus && rules.value.length
      ? {
          prefix: rules.value[0].prefix,
          query: "",
          start: caret.value,
          end: caret.value,
          manual: true,
        }
      : undefined;
  const context = manual.value ?? token.value ?? recommendation;
  if (!context) return;
  const rule = ruleFor(context.prefix);
  const minimum = rule?.minQueryLength ?? props.minQueryLength;
  if (
    (!context.manual &&
      Number.isFinite(minimum) &&
      Array.from(context.query).length < Math.max(0, minimum)) ||
    props.validateSearch?.(context.query, context) === false
  )
    return;
  return context;
});
const trigger = computed(
  () => searchable.value && ruleFor(searchable.value.prefix),
);
const {
  entries,
  choices,
  busy,
  loadingMore,
  hasMore,
  loadError,
  retry,
  loadMore,
  cancelLoad,
  remember,
} = useMentionOptions(
  props,
  searchable,
  trigger,
  dismissed,
  value,
  (error, context) => emit("loadError", error, context),
);
const {
  rows: listRows,
  enabled,
  visibleRows,
  topSpacer,
  bottomSpacer,
  rowHeight,
  onScroll,
  reset,
  ensureVisible,
} = useMentionList(props, choices, listbox, loadMore);
const current = computed(() => enabled.value[active.value]);
watch(
  [
    () => searchable.value?.query,
    () => searchable.value?.prefix,
    () => searchable.value?.start,
  ],
  () => {
    active.value = 0;
    dismissed.value = false;
    reset();
    const context = searchable.value;
    if (context) emit("search", context.query, context.prefix, context);
  },
);
watch(enabled, (next, previous) => {
  const key = previous[active.value]?.key;
  const retained =
    key === undefined ? -1 : next.findIndex((option) => option.key === key);
  active.value =
    retained >= 0
      ? retained
      : Math.min(active.value, Math.max(0, next.length - 1));
});
const showPanel = computed(
  () =>
    !!searchable.value &&
    !dismissed.value &&
    (choices.value.length > 0 ||
      busy.value ||
      !!loadError.value ||
      !!manual.value ||
      !!searchable.value.manual ||
      props.notFoundText !== undefined ||
      !!slots.empty),
);
const { anchor, removeMirror } = useMentionCaret(
  input,
  value,
  () => searchable.value?.start ?? token.value?.start ?? caret.value,
);
function length(value?: string | number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value) + "px"
    : typeof value === "string"
      ? value
      : undefined;
}
const { placement, open, style, show, close, update, schedule } = useFloating(
  anchor,
  panel,
  {
    placement: () => props.placement,
    get strategy() {
      return props.appendTo === "body" ? "fixed" : "absolute";
    },
    get gap() {
      return props.offset;
    },
    get autoAdjustOverflow() {
      return props.autoAdjustOverflow;
    },
    width: () => props.popupWidth,
    zIndex: () => props.zIndex,
    closeOnEscape: false,
    closeOnTab: false,
    onPosition({ anchor, placement, x, y, width, height }) {
      if (!props.showArrow) return;
      const align = (position: number, span: number) =>
        Math.max(8, Math.min(span - 8, position)) + "px";
      arrowStyle.value =
        placement.startsWith("top") || placement.startsWith("bottom")
          ? { left: align(anchor.left + anchor.width / 2 - x, width) }
          : { top: align(anchor.top + anchor.height / 2 - y, height) };
    },
  },
);
const popupMaxHeight = computed(() => {
  const size = length(props.popupMaxHeight);
  return size ? "min(" + size + ", calc(100dvh - 20px))" : undefined;
});
watch(
  [showPanel, choices],
  ([visible]) => {
    if (visible) void show();
    else close();
  },
  { flush: "post" },
);
watch(open, (visible) => {
  if (!visible) removeMirror();
  emit("openChange", visible);
});
watch(
  [open, input, panel],
  ([visible, control, popup], _old, cleanup) => {
    if (!visible || !control || !popup || typeof ResizeObserver === "undefined")
      return;
    const observer = new ResizeObserver(schedule);
    observer.observe(control);
    observer.observe(popup);
    cleanup(() => observer.disconnect());
  },
  { flush: "post" },
);
watch(
  [
    () => props.placement,
    () => props.offset,
    () => props.showArrow,
    () => props.popupWidth,
    popupMaxHeight,
  ],
  schedule,
  { flush: "post" },
);
onDeactivated(() => {
  focused.value = false;
  composing.value = false;
  manual.value = undefined;
});
function getSelection(): MentionSelection {
  return input.value
    ? readMentionSelection(input.value, caret.value)
    : { start: caret.value, end: caret.value };
}
function syncCursor() {
  caret.value = getSelection().start;
  if (open.value) schedule();
}
function setSelection(selection: MentionSelection) {
  if (
    input.value &&
    (!isRich.value ||
      focused.value ||
      input.value.ownerDocument.activeElement === input.value)
  )
    writeMentionSelection(input.value, selection);
  caret.value = selection.start;
  if (open.value) schedule();
}
function dismiss() {
  dismissed.value = true;
  cancelLoad();
  close();
}
function openManually(options?: HysMentionOpenOptions) {
  if (!editable.value || !input.value || composing.value) return false;
  input.value.focus();
  focused.value = true;
  if (
    !options?.prefix &&
    !options?.query &&
    options?.position === undefined &&
    token.value
  ) {
    dismissed.value = false;
    void nextTick(() => {
      if (showPanel.value) void show();
    });
    return true;
  }
  const position = Math.max(
    0,
    Math.min(value.value.length, options?.position ?? getSelection().start),
  );
  const prefix = options?.prefix ?? rules.value[0]?.prefix ?? "@";
  setSelection({ start: position, end: position });
  manual.value = {
    prefix,
    query: options?.query ?? "",
    start: position,
    end: position,
    manual: true,
  };
  dismissed.value = false;
  void nextTick(() => {
    if (showPanel.value) void show();
  });
  return true;
}
function readValue(element: HTMLElement) {
  return isNativeMentionInput(element)
    ? element.value
    : (element.textContent ?? "");
}
const segments = computed(() => mentionSegments(value.value, entities.value));
function entityClass(entity: HysMentionEntity) {
  return typeof props.entityClass === "function"
    ? props.entityClass(entity)
    : props.entityClass;
}
function invalidEntity(entity: HysMentionEntity) {
  return props.validateEntity?.(entity) === false;
}
function renderRich(selection?: MentionSelection) {
  const element = input.value;
  if (!isRich.value || !element || composing.value) return;
  const doc = element.ownerDocument;
  const fragment = doc.createDocumentFragment();
  for (const segment of segments.value) {
    if (!segment.entity) fragment.append(doc.createTextNode(segment.text));
    else {
      const node = doc.createElement("span");
      node.setAttribute("data-mention-entity", String(segment.entity.id));
      node.setAttribute("data-mention-start", String(segment.entity.start));
      node.setAttribute("contenteditable", "false");
      if (invalidEntity(segment.entity))
        node.setAttribute("aria-invalid", "true");
      node.className = ["hys-ui-mention-entity", entityClass(segment.entity)]
        .filter(Boolean)
        .join(" ");
      node.textContent = segment.text;
      fragment.append(node);
    }
  }
  element.replaceChildren(fragment);
  if (selection && focused.value) setSelection(selection);
}
watch(
  [
    segments,
    isRich,
    () => props.entityClass,
    () => props.validateEntity,
    input,
  ],
  () => {
    const selection = focused.value ? getSelection() : undefined;
    renderRich(selection);
  },
  { flush: "post" },
);
onMounted(() => {
  mounted.value = true;
  renderRich();
  if (props.autofocus) input.value?.focus();
});
function syncHighlightScroll() {
  if (input.value && highlightLayer.value) {
    highlightLayer.value.scrollTop = input.value.scrollTop;
    highlightLayer.value.scrollLeft = input.value.scrollLeft;
  }
}
function controlScroll() {
  syncHighlightScroll();
  if (open.value) update();
}
function applyAutosize() {
  const control = input.value;
  if (
    !control ||
    !props.autosize ||
    !(control instanceof HTMLTextAreaElement)
  ) {
    if (control instanceof HTMLTextAreaElement) {
      control.style.removeProperty("height");
      control.style.removeProperty("overflow-y");
    }
    return;
  }
  const range = typeof props.autosize === "object" ? props.autosize : {};
  const css = getComputedStyle(control);
  const line =
    parseFloat(css.lineHeight) || (parseFloat(css.fontSize) || 14) * 1.6;
  const borders =
    (parseFloat(css.borderTopWidth) || 0) +
    (parseFloat(css.borderBottomWidth) || 0);
  const padding =
    (parseFloat(css.paddingTop) || 0) + (parseFloat(css.paddingBottom) || 0);
  const min =
    Math.max(1, range.minRows ?? props.rows ?? 2) * line + padding + borders;
  const max =
    range.maxRows === undefined
      ? Infinity
      : Math.max(min, range.maxRows * line + padding + borders);
  const scroll = control.scrollTop;
  control.style.height = "auto";
  const content = control.scrollHeight + borders;
  control.style.height = Math.max(min, Math.min(max, content)) + "px";
  control.style.overflowY = content > max ? "auto" : "hidden";
  control.scrollTop = scroll;
  syncHighlightScroll();
  if (open.value) schedule();
}
watch([value, draft, () => props.autosize, input], applyAutosize, {
  flush: "post",
});
watch(
  [input, () => props.autosize],
  ([control, autosize], _old, cleanup) => {
    if (!control || !autosize || typeof ResizeObserver === "undefined") return;
    let width = control.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width === control.clientWidth) return;
      width = control.clientWidth;
      applyAutosize();
    });
    observer.observe(control);
    cleanup(() => observer.disconnect());
  },
  { flush: "post" },
);
onMounted(applyAutosize);
watch(segments, syncHighlightScroll, { flush: "post" });
const richSizing = computed<CSSProperties>(() => {
  if (!props.autosize) return {};
  const rows = typeof props.autosize === "object" ? props.autosize : {};
  return {
    minHeight: "calc(" + (rows.minRows ?? props.rows ?? 2) + "lh + 24px)",
    maxHeight: rows.maxRows ? "calc(" + rows.maxRows + "lh + 24px)" : undefined,
  };
});
const highlighting = computed(
  () =>
    !!props.highlightMentions &&
    !isRich.value &&
    !composing.value &&
    !!entities.value.length,
);
const editableTag = computed(() =>
  isRich.value ? "div" : props.type === "text" ? "input" : "textarea",
);

let editRevision = 0;
async function commit(
  next: HysMentionDocument,
  selection: MentionSelection,
  previous = getSelection(),
  notify?: () => void,
  force = false,
) {
  const version = ++editRevision;
  const allowed =
    editable.value &&
    (limit.value === undefined ||
      next.text.length <= limit.value ||
      next.text.length < value.value.length);
  const accepted =
    allowed && (await editor.commit(next, previous, notify, true, force));
  if (version !== editRevision || !input.value || composing.value)
    return accepted;
  if (isRich.value) renderRich();
  else if (
    isNativeMentionInput(input.value) &&
    input.value.value !== value.value
  )
    input.value.value = value.value;
  if (accepted) setSelection(selection);
  else setSelection(previous);
  return accepted;
}
function editText(
  text: string,
  start: number,
  end: number,
  inserted: readonly HysMentionEntity[] = [],
) {
  const next = value.value.slice(0, start) + text + value.value.slice(end);
  const entities = [
    ...rebaseMentionEntities(editor.document.value, next, { start, end }),
    ...inserted,
  ];
  return { text: next, entities: normalizeMentionEntities(next, entities) };
}
let beforeEdit: MentionSelection | undefined;
function editedRange(
  text: string,
  previous: MentionSelection | undefined,
  type: string | undefined,
) {
  if (!previous) return;
  let { start, end } = previous;
  if (start === end && text.length < value.value.length) {
    const removed = value.value.length - text.length;
    if (type?.endsWith("Backward")) start = Math.max(0, start - removed);
    if (type?.endsWith("Forward"))
      end = Math.min(value.value.length, end + removed);
  }
  if (
    text.startsWith(value.value.slice(0, start)) &&
    text.endsWith(value.value.slice(end)) &&
    text.length >= start + value.value.length - end
  )
    return { start, end };
}
function inputChanged(event: Event) {
  const element = event.target as HTMLElement;
  const text = readValue(element);
  if (composing.value) {
    draft.value = text;
    return;
  }
  const nextCaret = readMentionSelection(element, text.length);
  const previous = beforeEdit ?? { start: caret.value, end: caret.value };
  const range = editedRange(text, beforeEdit, (event as InputEvent).inputType);
  beforeEdit = undefined;
  if (text === value.value) return;
  dismissed.value = false;
  if (
    manual.value &&
    nextCaret.start >= manual.value.start &&
    text.startsWith(value.value.slice(0, manual.value.start)) &&
    !tokenAt(text, nextCaret.start)
  ) {
    manual.value = {
      ...manual.value,
      query: text.slice(manual.value.start, nextCaret.start),
      end: nextCaret.start,
    };
  } else manual.value = undefined;
  const entities = rebaseMentionEntities(editor.document.value, text, range);
  void commit({ text, entities }, nextCaret, previous);
}
function compositionStart() {
  beforeEdit = getSelection();
  draft.value = input.value ? readValue(input.value) : value.value;
  composing.value = true;
}
function compositionEnd(event: CompositionEvent) {
  if (!composing.value) return;
  composing.value = false;
  inputChanged(event);
}
async function history(direction: "undo" | "redo") {
  if (!editable.value || composing.value) return false;
  dismiss();
  const selection = await editor.history(direction, getSelection());
  if (!selection) return false;
  if (isRich.value) renderRich();
  setSelection(selection);
  return true;
}
function beforeInput(event: InputEvent) {
  if (composing.value || event.isComposing || !editable.value) return;
  beforeEdit = getSelection();
  if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
    if (!event.cancelable) return;
    event.preventDefault();
    void history(event.inputType === "historyUndo" ? "undo" : "redo");
  } else if (
    isRich.value &&
    (event.inputType === "insertParagraph" ||
      event.inputType === "insertLineBreak")
  ) {
    event.preventDefault();
    replaceSelection("\n");
  }
}
function replaceSelection(
  text: string,
  incoming: readonly HysMentionEntity[] = [],
) {
  const { start, end } = getSelection();
  if (limit.value !== undefined) {
    const length = Math.max(
      0,
      limit.value - (value.value.length - (end - start)),
    );
    text = text.slice(0, length).replace(/[\uD800-\uDBFF]$/, "");
  }
  const inserted = normalizeMentionEntities(text, incoming).map((entity) => ({
    ...entity,
    start: start + entity.start,
    end: start + entity.end,
  }));
  const next = editText(text, start, end, inserted);
  dismissed.value = false;
  manual.value = undefined;
  const caret = start + text.length;
  void commit(next, { start: caret, end: caret }, { start, end });
}
const clipboardType = "application/x-hys-mention+json";
function copy(event: ClipboardEvent, cut = false) {
  if (!event.clipboardData || (cut && !editable.value)) return;
  const { start, end } = getSelection();
  if (start === end) return;
  const text = value.value.slice(start, end);
  const selected = entities.value.filter(
    (entity) => entity.start >= start && entity.end <= end,
  );
  if (!isRich.value && !selected.length) return;
  event.preventDefault();
  event.clipboardData.setData("text/plain", text);
  try {
    event.clipboardData.setData(
      clipboardType,
      serializeMentionDocument({
        text,
        entities: selected.map((entity) => ({
          ...entity,
          start: entity.start - start,
          end: entity.end - start,
        })),
      }),
    );
  } catch {
    /* Plain text is still available when custom clipboard types are unsupported. */
  }
  if (cut) replaceSelection("");
}
function paste(event: ClipboardEvent) {
  if (!editable.value || !event.clipboardData) return;
  const data = event.clipboardData.getData(clipboardType);
  if (!data && !isRich.value) return;
  event.preventDefault();
  try {
    const document = deserializeMentionDocument(data);
    replaceSelection(document.text, document.entities);
  } catch {
    replaceSelection(event.clipboardData.getData("text/plain"));
  }
}
function drop(event: DragEvent) {
  if (!isRich.value || !editable.value) return;
  event.preventDefault();
  if (event.dataTransfer)
    replaceSelection(event.dataTransfer.getData("text/plain"));
}

function selectionEnd(context: HysMentionContext) {
  const existing = entities.value.find(
    (entity) =>
      entity.start === context.start &&
      entity.prefix === context.prefix &&
      context.end <= entity.end,
  );
  if (existing) return existing.end;
  if (!props.replaceRest || context.manual) return context.end;
  let index = context.end;
  const split = splitFor(context.prefix);
  while (
    index < value.value.length &&
    !/\s/.test(value.value[index]) &&
    !(split && value.value.startsWith(split, index)) &&
    !rules.value.some(({ prefix }) => value.value.startsWith(prefix, index))
  )
    index++;
  return index;
}
async function insertAt(
  option: HysMentionOption,
  context: HysMentionContext,
  end: number,
  focus: boolean,
  selected?: () => void,
) {
  if (
    !editable.value ||
    composing.value ||
    option.disabled ||
    props.canSelect?.(option, context) === false
  )
    return false;
  const rule = ruleFor(context.prefix);
  const formatter = rule?.formatMention ?? props.formatMention;
  const mention =
    formatter?.(option, context) ?? context.prefix + String(option.value);
  if (!mention) return false;
  const split = splitFor(context.prefix);
  const following = value.value.slice(end);
  const remove = split && following.startsWith(split) ? split.length : 0;
  const entity: HysMentionEntity = {
    id: option.id ?? option.value,
    value: option.value,
    label:
      typeof option.label === "string" ? option.label : String(option.value),
    type: option.type ?? rule?.type ?? context.prefix,
    prefix: context.prefix,
    text: mention,
    start: context.start,
    end: context.start + mention.length,
    payload: option.payload,
  };
  const next = editText(mention + split, context.start, end + remove, [entity]);
  if (limit.value !== undefined && next.text.length > limit.value) return false;
  dismiss();
  const caret = entity.end + split.length;
  const accepted = await commit(
    next,
    { start: caret, end: caret },
    getSelection(),
    selected,
  );
  if (accepted) {
    remember(option, context.prefix);
    if (
      focus &&
      props.restoreFocus &&
      input.value?.isConnected &&
      input.value.ownerDocument.activeElement !== input.value
    ) {
      input.value.focus();
      setSelection({ start: caret, end: caret });
    }
  }
  dismiss();
  return accepted;
}
function choose(entry: MentionEntry | undefined, restore = true) {
  const context = searchable.value;
  if (
    !entry ||
    !context ||
    entry.user.disabled ||
    busy.value ||
    dismissed.value
  )
    return;
  void insertAt(entry.option, context, selectionEnd(context), restore, () => {
    emit("select", entry.user, context.prefix, entry.option);
    if (entry.created) emit("create", entry.option, context);
  });
}
function insertMention(
  option: HysMentionOption,
  options?: HysMentionInsertOptions,
) {
  const selection = getSelection();
  const prefix =
    options?.prefix ?? option.prefix ?? rules.value[0]?.prefix ?? "@";
  const start = Math.max(
    0,
    Math.min(value.value.length, Math.trunc(options?.start ?? selection.start)),
  );
  const end = Math.max(
    start,
    Math.min(value.value.length, Math.trunc(options?.end ?? selection.end)),
  );
  return insertAt(
    option,
    { prefix, query: "", start, end, manual: true },
    end,
    options?.focus !== false,
  );
}
function removeEntity(
  entity: HysMentionEntity,
  consumeSeparator = true,
  whole = false,
) {
  const split = splitFor(entity.prefix);
  const end =
    consumeSeparator && split && value.value.startsWith(split, entity.end)
      ? entity.end + split.length
      : entity.end;
  dismiss();
  return commit(
    editText("", entity.start, end),
    { start: entity.start, end: entity.start },
    getSelection(),
    whole
      ? () => emit("wholeRemove", String(entity.value), entity.prefix)
      : undefined,
  );
}
function removeMention(target: HysMentionEntity | string | number) {
  const entity = entities.value.find((entry) =>
    typeof target === "object"
      ? entry.id === target.id &&
        entry.start === target.start &&
        entry.end === target.end
      : entry.id === target,
  );
  return entity ? removeEntity(entity) : Promise.resolve(false);
}
function removeWhole(event: KeyboardEvent) {
  if (!editable.value || (!props.whole && !props.checkIsWhole && !isRich.value))
    return;
  const { start, end } = getSelection();
  if (start !== end) return;
  const backward = event.key === "Backspace";
  const entity = entities.value.find((entity) =>
    backward
      ? entity.end === start ||
        (entity.end + splitFor(entity.prefix).length === start &&
          value.value.startsWith(splitFor(entity.prefix), entity.end))
      : entity.start === start,
  );
  if (
    entity &&
    (props.checkIsWhole?.(String(entity.value), entity.prefix) ??
      (props.whole || isRich.value))
  ) {
    event.preventDefault();
    void removeEntity(entity, true, true);
    return;
  }
  if (!backward) return;
  const before = value.value.slice(0, start);
  const separator =
    rules.value
      .map(({ prefix }) => splitFor(prefix))
      .filter((split) => split && before.endsWith(split))
      .sort((a, b) => b.length - a.length)[0] ?? "";
  const context = tokenAt(value.value, start - separator.length);
  if (!context?.query) return;
  const known = entries.value.some(
    ({ option }) =>
      String(option.value) === context.query &&
      (!option.prefix || option.prefix === context.prefix),
  );
  if (!(
    props.checkIsWhole?.(context.query, context.prefix) ??
    (props.whole && known)
  ))
    return;
  event.preventDefault();
  dismiss();
  void commit(
    editText("", context.start, start),
    { start: context.start, end: context.start },
    getSelection(),
    () => emit("wholeRemove", context.query, context.prefix),
  );
}
const invalidEntities = computed(() =>
  mounted.value &&
  props.invalidEntity === "remove" &&
  editable.value &&
  props.validateEntity
    ? entities.value.filter((entity) => !props.validateEntity!(entity))
    : [],
);
watch(
  invalidEntities,
  async (removed) => {
    if (!removed.length) return;
    let document = editor.document.value;
    for (const entity of [...removed].reverse()) {
      const text =
        document.text.slice(0, entity.start) + document.text.slice(entity.end);
      document = {
        text,
        entities: rebaseMentionEntities(document, text, entity),
      };
    }
    const selection = getSelection();
    const caret = Math.min(document.text.length, selection.start);
    await commit(
      document,
      { start: caret, end: caret },
      selection,
      undefined,
      true,
    );
  },
  { immediate: true, flush: "post" },
);

function move(direction: HysMentionAction) {
  const count = enabled.value.length;
  if (!count) return;
  active.value =
    direction === "first"
      ? 0
      : direction === "last"
        ? count - 1
        : (active.value + (direction === "next" ? 1 : -1) + count) % count;
  void nextTick(() => {
    if (current.value) ensureVisible(current.value.key);
  });
}
function action(event: KeyboardEvent, command: HysMentionAction) {
  if (command === "open") {
    event.preventDefault();
    openManually();
  } else if (open.value) {
    if (command === "close") {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    } else if (
      command === "retry" ||
      (command === "select" && loadError.value && !current.value)
    ) {
      if (loadError.value && !busy.value) {
        event.preventDefault();
        retry();
      }
    } else if (command === "select") {
      if (current.value) {
        event.preventDefault();
        choose(current.value);
      }
    } else if (enabled.value.length) {
      event.preventDefault();
      move(command);
    }
  } else if (command === "next" && dismissed.value && searchable.value) {
    event.preventDefault();
    dismissed.value = false;
  }
}
const defaultKeys: Partial<Record<string, HysMentionAction>> = {
  ArrowDown: "next",
  ArrowUp: "previous",
  Enter: "select",
  Escape: "close",
};
function key(event: KeyboardEvent) {
  if (event.isComposing || composing.value || event.keyCode === 229) return;
  const combo = [
    event.ctrlKey && "Ctrl",
    event.metaKey && "Meta",
    event.altKey && "Alt",
    event.shiftKey && "Shift",
    event.key,
  ]
    .filter(Boolean)
    .join("+");
  const custom = props.shortcuts?.[combo];
  if (custom) action(event, custom);
  else if (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    ["z", "y"].includes(event.key.toLowerCase())
  ) {
    event.preventDefault();
    void history(
      event.shiftKey || event.key.toLowerCase() === "y" ? "redo" : "undo",
    );
  } else if (event.key === "Backspace" || event.key === "Delete")
    removeWhole(event);
  else if (event.key === "Tab") {
    if (props.selectOnTab && open.value && current.value)
      choose(current.value, false);
    else dismiss();
  } else if (event.key === "PageDown" && open.value && hasMore.value) {
    event.preventDefault();
    void loadMore();
  } else if (
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    defaultKeys[event.key]
  )
    action(event, defaultKeys[event.key]!);
}
function focus(event: FocusEvent) {
  focused.value = true;
  dismissed.value = false;
  syncCursor();
  emit("focus", event);
}
function blur(event: FocusEvent) {
  if (
    event.relatedTarget instanceof Node &&
    panel.value?.contains(event.relatedTarget)
  )
    return;
  focused.value = false;
  touched.value = true;
  manual.value = undefined;
  cancelLoad();
  close();
  emit("blur", event);
}
function focusInput() {
  input.value?.focus();
}
function editRichEntity(event: MouseEvent) {
  if (!isRich.value || !editable.value || !(event.target instanceof Element))
    return;
  const node = event.target.closest<HTMLElement>("[data-mention-start]");
  if (!node) return;
  const entity = entities.value.find(
    ({ start }) => start === Number(node.dataset.mentionStart),
  );
  if (!entity) return;
  event.preventDefault();
  focusInput();
  setSelection({ start: entity.start, end: entity.end });
  manual.value = {
    prefix: entity.prefix,
    query: "",
    start: entity.start,
    end: entity.end,
    manual: true,
  };
  dismissed.value = false;
}
async function clear() {
  if (!editable.value) return false;
  dismiss();
  const accepted = await commit(
    { text: "", entities: [] },
    { start: 0, end: 0 },
    getSelection(),
    () => emit("clear"),
  );
  if (accepted && props.restoreFocus) focusInput();
  return accepted;
}
async function setDocument(document: HysMentionDocument | string) {
  let next: HysMentionDocument;
  try {
    next =
      typeof document === "string"
        ? deserializeMentionDocument(document)
        : document;
  } catch {
    return false;
  }
  if (!next || typeof next.text !== "string" || !Array.isArray(next.entities))
    return false;
  dismiss();
  return commit(next, { start: next.text.length, end: next.text.length });
}
function nativeAttrs() {
  const { class: _class, style: _style, ...native } = attrs;
  return native;
}
const accessibility = computed(() => ({
  id: String(attrs.id ?? field.id.value ?? "") || undefined,
  role: "combobox",
  "aria-label":
    props.ariaLabel ??
    (attrs["aria-label"] as string | undefined) ??
    label.value ??
    words.value.input,
  "aria-invalid": invalid.value || undefined,
  "aria-required": required.value || undefined,
  "aria-disabled": disabled.value || undefined,
  "aria-readonly": props.readonly || undefined,
  "aria-describedby":
    field.describedBy.value ??
    (attrs["aria-describedby"] as string | undefined),
  "aria-controls": open.value ? id : undefined,
  "aria-expanded": open.value,
  "aria-activedescendant": activeId.value,
  "aria-autocomplete": "list" as const,
}));
const optionId = (key: string) => id + "-option-" + encodeURIComponent(key);
const activeId = computed(() =>
  open.value &&
  current.value &&
  visibleRows.value.some((row) => row.key === current.value?.key)
    ? optionId(current.value.key)
    : undefined,
);
function optionLabel(entry: MentionEntry) {
  return entry.option.group
    ? entry.option.group + "，" + entry.user.name
    : entry.user.name;
}
function hover(entry: MentionEntry) {
  const index = enabled.value.findIndex(({ key }) => key === entry.key);
  if (index >= 0) active.value = index;
}
function optionPointerDown(event: PointerEvent) {
  if (event.pointerType === "touch" && event.cancelable) event.preventDefault();
}
const controlEvents = {
  keydown: key,
  keyup: syncCursor,
  click: () => {
    dismissed.value = false;
    syncCursor();
  },
  focus,
  blur,
  input: inputChanged,
  beforeinput: beforeInput,
  compositionstart: compositionStart,
  compositionend: compositionEnd,
  scroll: controlScroll,
  paste,
  copy,
  cut: (event: ClipboardEvent) => copy(event, true),
  drop,
  dblclick: editRichEntity,
};
watch(value, syncCursor, { flush: "post" });
const MentionLabel: FunctionalComponent<{ name: string }> = ({ name }) => {
  const query = searchable.value?.query.trim() ?? "";
  const index =
    props.highlightMatch && query
      ? name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase())
      : -1;
  return h(
    "span",
    index < 0
      ? name
      : [
          name.slice(0, index),
          h(
            "mark",
            { class: "hys-ui-mention-match" },
            name.slice(index, index + query.length),
          ),
          name.slice(index + query.length),
        ],
  );
};
const RenderContent: FunctionalComponent<{ value: VNodeChild }> = ({ value }) =>
  value;
defineExpose({
  input,
  dropdownVisible: open,
  focus: focusInput,
  blur: () => input.value?.blur(),
  open: openManually,
  close: dismiss,
  update,
  retry,
  loadMore,
  insertMention,
  removeMention,
  getEntities: () => entities.value.map((entity) => ({ ...entity })),
  getDocument: () => ({
    text: value.value,
    entities: entities.value.map((entity) => ({ ...entity })),
  }),
  setDocument,
  serialize: () => serializeMentionDocument(editor.document.value),
  clear,
  undo: () => history("undo"),
  redo: () => history("redo"),
});
</script>

<template>
  <div
    v-bind="skin"
    class="hys-ui-ent-mention"
    :class="attrs.class"
    :style="attrs.style as StyleValue"
    :data-size="size"
    :data-status="invalid ? 'error' : status"
  >
    <div class="hys-ui-mention-input-row">
      <div v-if="slots.prefix" class="hys-ui-mention-affix">
        <slot name="prefix" />
      </div>
      <div
        class="hys-ui-mention-editor"
        :class="{
          'hys-ui-mention-highlighted': highlighting,
          'hys-ui-mention-autosize': autosize,
        }"
      >
        <div
          v-if="highlighting"
          ref="highlightLayer"
          class="hys-ui-mention-highlight-layer"
          :class="{ 'hys-ui-mention-single': type === 'text' }"
          aria-hidden="true"
        >
          <template v-for="segment in segments" :key="segment.start">
            <span
              v-if="segment.entity"
              class="hys-ui-mention-entity"
              :class="entityClass(segment.entity)"
              :data-invalid="invalidEntity(segment.entity) || undefined"
              >{{ segment.text }}</span
            >
            <template v-else>{{ segment.text }}</template>
          </template>
        </div>
        <div
          v-if="isRich"
          ref="input"
          v-bind="{ ...nativeAttrs(), ...accessibility }"
          v-on="controlEvents"
          v-text="value"
          class="hys-ui-mention-rich hys-ui-scrollbar"
          :style="richSizing"
          :contenteditable="editable ? 'true' : 'false'"
          :tabindex="disabled ? -1 : 0"
          :data-placeholder="placeholder ?? words.placeholder"
        />
        <component
          v-else
          :is="editableTag"
          ref="input"
          v-bind="{ ...nativeAttrs(), ...accessibility }"
          v-on="controlEvents"
          :value="composing ? draft : value"
          :type="type === 'text' ? 'text' : undefined"
          :rows="type === 'textarea' ? rows : undefined"
          :name="name"
          :autofocus="autofocus"
          :placeholder="placeholder ?? words.placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :maxlength="limit"
          :minlength="minimumLength"
          @select="syncCursor"
        />
        <input
          v-if="isRich && name"
          type="hidden"
          :name="name"
          :value="value"
          :disabled="disabled"
        />
      </div>
      <div
        v-if="slots.suffix || (clearable && editable && value)"
        class="hys-ui-mention-affix"
      >
        <slot name="suffix" />
        <button
          v-if="clearable && editable && value"
          class="hys-ui-mention-clear"
          type="button"
          :aria-label="words.clear"
          @mousedown.prevent
          @click="clear"
        >
          <slot name="clear-icon"><span aria-hidden="true">×</span></slot>
        </button>
      </div>
    </div>
    <div v-if="showCount" class="hys-ui-mention-count">
      <slot name="count" :count="value.length" :max="limit">
        {{ value.length
        }}<template v-if="limit !== undefined"> / {{ limit }}</template>
      </slot>
    </div>
    <Teleport :to="appendTo || 'body'" :disabled="appendTo === false">
      <PopupMotion
        :popup-transition="popupTransition"
        :popup-transition-duration="popupTransitionDuration"
        :placement="placement"
      >
        <div
          v-if="open && showPanel"
          ref="panel"
          v-bind="skin"
          class="hys-ui-mention-list hys-ui-floating-surface"
          :class="[popupClass, { 'hys-ui-mention-virtual': virtual }]"
          :style="[
            style,
            { maxHeight: popupMaxHeight, overflowY: 'visible' },
            popupStyle,
          ]"
          :data-placement="placement"
        >
          <span
            v-if="showArrow"
            class="hys-ui-mention-arrow"
            :style="arrowStyle"
            aria-hidden="true"
          />
          <slot name="header" :context="searchable" />
          <div v-if="busy" class="hys-ui-mention-message" role="status">
            <slot name="loading">{{ words.loading }}</slot>
          </div>
          <div
            v-else-if="!choices.length && !loadError"
            class="hys-ui-mention-message"
            role="status"
          >
            <slot name="empty">{{ notFoundText ?? words.empty }}</slot>
          </div>
          <div
            :id="id"
            ref="listbox"
            class="hys-ui-mention-options hys-ui-scrollbar"
            role="listbox"
            :aria-label="words.list"
            :aria-busy="busy || loadingMore || undefined"
            @scroll="onScroll"
          >
            <div
              v-if="topSpacer"
              :style="{ height: topSpacer + 'px' }"
              role="presentation"
            />
            <template v-for="row in visibleRows" :key="row.key">
              <div
                v-if="'group' in row"
                class="hys-ui-mention-group"
                role="presentation"
                :style="virtual ? { height: rowHeight + 'px' } : undefined"
              >
                <slot name="group" :label="row.group" :context="searchable">{{
                  row.group
                }}</slot>
              </div>
              <button
                v-else
                :id="optionId(row.key)"
                type="button"
                role="option"
                tabindex="-1"
                :aria-label="optionLabel(row.entry)"
                :aria-posinset="row.index + 1"
                :aria-setsize="choices.length"
                :disabled="row.entry.user.disabled"
                :aria-selected="current?.key === row.key"
                :data-active="current?.key === row.key"
                :class="[
                  row.entry.option.class,
                  { 'hys-ui-mention-active': current?.key === row.key },
                ]"
                :style="[
                  row.entry.option.style,
                  virtual ? { height: rowHeight + 'px' } : undefined,
                ]"
                :data-create="row.entry.created || undefined"
                @mousedown.prevent
                @pointerdown="optionPointerDown"
                @pointerenter="hover(row.entry)"
                @click="choose(row.entry)"
              >
                <slot
                  name="option"
                  :user="row.entry.user"
                  :option="row.entry.option"
                  :context="searchable"
                  :created="!!row.entry.created"
                >
                  <slot name="avatar" :option="row.entry.option">
                    <img
                      v-if="row.entry.option.avatar"
                      class="hys-ui-mention-avatar"
                      :src="row.entry.option.avatar"
                      alt=""
                    />
                    <span
                      v-else
                      class="hys-ui-mention-avatar"
                      aria-hidden="true"
                      >{{ Array.from(row.entry.user.name)[0] }}</span
                    >
                  </slot>
                  <span class="hys-ui-mention-label">
                    <RenderContent
                      v-if="typeof row.entry.option.label === 'function'"
                      :value="row.entry.option.label(row.entry.option)"
                    />
                    <MentionLabel v-else :name="row.entry.user.name" />
                    <small v-if="row.entry.option.description">{{
                      row.entry.option.description
                    }}</small>
                  </span>
                </slot>
              </button>
            </template>
            <div
              v-if="bottomSpacer"
              :style="{ height: bottomSpacer + 'px' }"
              role="presentation"
            />
          </div>
          <div
            v-if="!busy && loadError"
            class="hys-ui-mention-message"
            role="status"
          >
            <slot
              name="error"
              :error="loadError.reason"
              :retry="retry"
              :context="searchable"
            >
              {{ words.error }}
              <button
                type="button"
                class="hys-ui-mention-retry"
                tabindex="-1"
                @mousedown.prevent
                @click="retry"
              >
                {{ words.retry }}
              </button>
            </slot>
          </div>
          <button
            v-else-if="hasMore || loadingMore"
            class="hys-ui-mention-more"
            type="button"
            tabindex="-1"
            :disabled="loadingMore"
            @mousedown.prevent
            @click="loadMore"
          >
            {{ loadingMore ? words.loading : words.more }}
          </button>
          <slot
            name="footer"
            :context="searchable"
            :has-more="hasMore"
            :load-more="loadMore"
          />
        </div>
      </PopupMotion>
    </Teleport>
  </div>
</template>

<style scoped>
.hys-ui-mention-input-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--hys-ui-mention-affix-gap, 6px);
}
.hys-ui-mention-editor {
  position: relative;
  flex: 1;
  min-width: 0;
}
.hys-ui-mention-affix {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.hys-ui-mention-clear,
.hys-ui-mention-more {
  border: 0;
  border-radius: var(--hys-ui-mention-radius, 8px);
  background: none;
  color: var(
    --hys-ui-mention-color,
    var(--hys-ui-primary, var(--hys-ui-theme-primary))
  );
  cursor: pointer;
  font: inherit;
}
.hys-ui-mention-clear {
  min-width: 28px;
  min-height: 28px;
}
.hys-ui-mention-more {
  padding: 7px;
}
.hys-ui-mention-clear:focus-visible,
.hys-ui-mention-more:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.hys-ui-mention-count {
  text-align: end;
  margin-top: 4px;
  font-size: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-mention-rich,
.hys-ui-mention-highlight-layer {
  display: block;
  box-sizing: border-box;
  padding: var(--hys-ui-mention-padding, 11px 13px);
  border: 1px solid
    var(
      --hys-ui-mention-border,
      var(--hys-ui-border, var(--hys-ui-theme-border))
    );
  border-radius: var(--hys-ui-mention-radius, 8px);
  color: var(--hys-ui-mention-text, inherit);
  font: inherit;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.hys-ui-mention-rich {
  min-height: 94px;
  overflow: auto;
  background: var(
    --hys-ui-mention-background,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-mention-rich:empty::before {
  content: attr(data-placeholder);
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  pointer-events: none;
}
.hys-ui-mention-rich[aria-disabled="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-mention-highlight-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  border-color: transparent;
}
.hys-ui-mention-highlight-layer.hys-ui-mention-single {
  white-space: pre;
}
.hys-ui-mention-highlighted :is(input, textarea) {
  color: transparent !important;
  caret-color: var(
    --hys-ui-mention-text,
    var(--hys-ui-text, var(--hys-ui-theme-text))
  );
}
.hys-ui-ent-mention :deep(.hys-ui-mention-entity),
.hys-ui-mention-entity {
  color: var(
    --hys-ui-mention-entity-color,
    var(--hys-ui-primary, var(--hys-ui-theme-primary))
  );
  background: var(
    --hys-ui-mention-entity-background,
    var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft))
  );
  border-radius: var(--hys-ui-mention-entity-radius, 3px);
}
.hys-ui-ent-mention :deep(.hys-ui-mention-entity[aria-invalid="true"]),
.hys-ui-mention-entity[data-invalid="true"] {
  color: var(--hys-ui-danger, var(--hys-ui-theme-danger));
  text-decoration: line-through;
}
.hys-ui-mention-autosize textarea {
  min-height: 0 !important;
  resize: none;
}
.hys-ui-mention-group {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  box-sizing: border-box;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
  font-weight: 600;
}
.hys-ui-mention-virtual button[role="option"] {
  margin: 0 !important;
  min-height: 0 !important;
  box-sizing: border-box;
  overflow: hidden;
}
.hys-ui-mention-label {
  display: grid;
  min-width: 0;
  gap: 2px;
  overflow-wrap: anywhere;
}
.hys-ui-mention-label small {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 11px;
}
.hys-ui-mention-avatar {
  object-fit: cover;
}
.hys-ui-ent-mention {
  width: 100%;
  min-width: 0;
}
.hys-ui-ent-mention :is(textarea, input) {
  display: block;
  width: 100%;
  min-width: 0;
  padding: var(--hys-ui-mention-padding, 11px 13px);
  border: 1px solid
    var(
      --hys-ui-mention-border,
      var(--hys-ui-border, var(--hys-ui-theme-border))
    );
  border-radius: var(--hys-ui-mention-radius, 8px);
  background: var(
    --hys-ui-mention-background,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  font: inherit;
  line-height: 1.6;
  color: var(--hys-ui-mention-text, inherit);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-ent-mention textarea {
  min-height: 94px;
  resize: vertical;
}
.hys-ui-ent-mention[data-size="sm"] {
  --hys-ui-mention-padding: 6px 9px;
}
.hys-ui-ent-mention[data-size="lg"] {
  --hys-ui-mention-padding: 13px 15px;
}
.hys-ui-ent-mention :is(textarea, input, .hys-ui-mention-rich):focus {
  outline: none;
  border-color: var(
    --hys-ui-mention-color,
    var(--hys-ui-primary, var(--hys-ui-theme-primary))
  );
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 10%,
      transparent
    );
}
.hys-ui-ent-mention[data-status="error"]
  :is(textarea, input, .hys-ui-mention-rich) {
  border-color: var(--hys-ui-danger, var(--hys-ui-theme-danger));
}
.hys-ui-ent-mention[data-status="warning"]
  :is(textarea, input, .hys-ui-mention-rich) {
  border-color: var(--hys-ui-warning, var(--hys-ui-theme-warning));
}
.hys-ui-ent-mention :is(textarea, input)::placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-ent-mention :is(textarea, input):disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-mention-list {
  display: flex;
  flex-direction: column;
  width: var(--hys-ui-mention-popup-width, 260px);
  max-width: calc(100vw - 20px);
  padding: 6px;
  max-height: min(240px, calc(100vh - 20px));
  background: var(
    --hys-ui-mention-popup-background,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  border: 1px solid
    var(
      --hys-ui-mention-popup-border,
      var(--hys-ui-border, var(--hys-ui-theme-border))
    );
  border-radius: var(--hys-ui-mention-popup-radius, 9px);
  box-shadow: var(--hys-ui-mention-popup-shadow, 0 10px 30px #17274415);
}
.hys-ui-mention-options {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.hys-ui-mention-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  border: solid var(--hys-ui-border, var(--hys-ui-theme-border));
  pointer-events: none;
}
.hys-ui-mention-list[data-placement^="bottom"] .hys-ui-mention-arrow {
  top: 0;
  transform: translate(-50%, -50%) rotate(45deg);
  border-width: 1px 0 0 1px;
}
.hys-ui-mention-list[data-placement^="top"] .hys-ui-mention-arrow {
  bottom: 0;
  transform: translate(-50%, 50%) rotate(45deg);
  border-width: 0 1px 1px 0;
}
.hys-ui-mention-list[data-placement^="right"] .hys-ui-mention-arrow {
  left: 0;
  transform: translate(-50%, -50%) rotate(45deg);
  border-width: 0 0 1px 1px;
}
.hys-ui-mention-list[data-placement^="left"] .hys-ui-mention-arrow {
  right: 0;
  transform: translate(50%, -50%) rotate(45deg);
  border-width: 1px 1px 0 0;
}
.hys-ui-mention-match {
  background: transparent;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-weight: 650;
}
.hys-ui-mention-list button[role="option"] {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 7px 10px;
  margin: 3px 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font: inherit;
  text-align: start;
  cursor: pointer;
  outline: none;
}
.hys-ui-mention-list button[role="option"]:not(:disabled):hover {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-mention-list button.hys-ui-mention-active {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline: 1px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 20%,
      transparent
    );
  outline-offset: -1px;
}
.hys-ui-mention-list button[role="option"]:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-ui-mention-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-size: 11px;
}
.hys-ui-mention-message {
  padding: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  text-align: center;
}
.hys-ui-mention-retry {
  border: 0;
  background: none;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font: inherit;
  cursor: pointer;
}
</style>
