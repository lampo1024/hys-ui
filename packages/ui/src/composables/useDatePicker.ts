import { computed, ref, shallowRef, watch, type ComputedRef } from "vue";
import { useDatePickerRules } from "./datePickerRules";
import { useDatePickerModel } from "./datePickerModel";
import { useDatePickerPanels } from "./datePickerPanels";
import {
  dateClone,
  dateEqual,
  dateWeek,
  dateNative,
  datePeriod,
  datePoint,
  dateTimeSeconds,
  dateClockPoint,
  type HysDatePoint,
  type HysDatePickerProps,
  type HysDatePickerValue,
  type HysDatePickerChange,
} from "./datePicker";
export function useDatePicker(
  props: HysDatePickerProps,
  range: ComputedRef<boolean>,
  blocked: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
) {
  const {
    time,
    rangeDefaultTime,
    unit,
    multiple,
    first,
    weekContains,
    pattern,
    displayPattern,
    words,
    model,
    current,
    outputType,
    parse,
    boundary,
    normalize,
    isEmpty,
    points,
    selected,
    minPoint,
    maxPoint,
    encodePoint,
    encode,
    empty,
    describe,
    markClear,
  } = useDatePickerModel(props, range);
  const draft = shallowRef<(HysDatePoint | null)[]>([]),
    stage = ref<"start" | "end">("start"),
    preview = ref<number>(),
    error = ref(""),
    today = shallowRef(datePoint(new Date())!),
    needsConfirm = computed(
      () =>
        props.showConfirm ??
        (time.value ||
          multiple.value ||
          (range.value && !!props.allowEmpty?.some(Boolean))),
    );
  const { currentView, rightView, panels, resetPanels, setPanel, setMode } =
    useDatePickerPanels({
      props,
      unit,
      range,
      time,
      selected,
      minPoint,
      maxPoint,
      boundary,
      encodePoint,
      emit,
    });
  const {
    context,
    locked,
    available,
    periodAvailable,
    timeDisabled,
    validTime,
    valid,
    samePoint,
  } = useDatePickerRules({
    props,
    range,
    multiple,
    time,
    unit,
    first,
    weekContains,
    selected,
    draft,
    stage,
    minPoint,
    maxPoint,
  });
  function invalid(reason: string) {
    error.value =
      reason === "limit"
        ? words.value.limit.replace("{count}", String(props.maxDates))
        : words.value.invalid;
    emit("invalid", {
      reason,
      dates: draft.value.map((p) => (p ? dateNative(p) : null)),
    });
    return false;
  }
  function emitDraft(endpoint: number) {
    emit("calendarChange", encode(draft.value), {
      range: endpoint ? "end" : "start",
      dates: draft.value.map((point) => (point ? dateNative(point) : null)),
      formatted: describe(draft.value),
    });
  }
  async function request(
    value: HysDatePickerValue,
    source: HysDatePickerChange["source"],
    allowClear = false,
  ) {
    if (blocked.value || !model.isLive()) return false;
    if (!allowClear) {
      if (
        (range.value || multiple.value) &&
        (!Array.isArray(value) || (range.value && value.length !== 2))
      )
        return invalid("shape");
      const raw = Array.isArray(value) ? value : [value];
      if (raw.some((v) => !isEmpty(v) && !parse(v))) return invalid("format");
    }
    const list = points(value);
    if (!allowClear && !valid(list)) return invalid("date");
    if (
      !allowClear &&
      outputType.value !== "string" &&
      list.some((p) => p && !samePoint(datePoint(dateNative(p)), p))
    )
      return invalid("time");
    error.value = "";
    const info: HysDatePickerChange = {
      source,
      dates: list.map((p) => (p ? dateNative(p) : null)),
      formatted: describe(list),
      ...(unit.value === "week"
        ? {
            weeks: list.map((p) =>
              p ? dateWeek(p.day, first.value, weekContains.value) : null,
            ),
          }
        : {}),
    };
    const ok = await model.commit(
      dateClone(unit.value === "week" && !allowClear ? encode(list) : value),
      (next) => {
        emit("update:modelValue", next);
        emit("update:value", next);
      },
      (next) => emit("change", next, info),
      true,
    );
    if (ok) {
      emit("value-change", dateClone(current.value), info);
      validate();
    }
    return ok;
  }
  function begin() {
    today.value = datePoint(new Date())!;
    error.value = "";
    draft.value = points();
    if (range.value && draft.value.length !== 2) draft.value = [null, null];
    stage.value = range.value && locked(0) && !locked(1) ? "end" : "start";
    preview.value = undefined;
    resetPanels(today.value.day);
  }
  function defaultSecond(index: number) {
    const defaults =
      props.defaultTime ??
      (typeof props.showTime === "object"
        ? props.showTime.defaultValue
        : undefined);
    return dateTimeSeconds(
      Array.isArray(defaults)
        ? defaults[index]
        : (defaults as string | Date | undefined),
    );
  }
  async function choose(day: number) {
    if (blocked.value) return false;
    const endpoint = range.value && stage.value === "end" ? 1 : 0;
    if (
      locked(endpoint) ||
      !(unit.value === "date"
        ? available(day, endpoint)
        : periodAvailable(
            ...datePeriod(day, unit.value, first.value),
            endpoint,
          ))
    )
      return false;
    const point = normalize({
      day,
      second: time.value
        ? (draft.value[endpoint]?.second ?? defaultSecond(endpoint))
        : rangeDefaultTime.value
          ? defaultSecond(endpoint)
          : 0,
    });
    if (multiple.value) {
      const values = draft.value.filter((p): p is HysDatePoint => !!p),
        index = values.findIndex((p) => p.day === point.day);
      if (index >= 0) values.splice(index, 1);
      else {
        if (props.maxDates && values.length >= props.maxDates)
          return invalid("limit");
        values.push(point);
      }
      draft.value = values.sort((a, b) => a.day - b.day);
    } else if (range.value) {
      if (endpoint === 0) {
        draft.value = [point, locked(1) ? (selected.value[1] ?? null) : null];
        stage.value = locked(1) ? "start" : "end";
      } else {
        let a = draft.value[0],
          b = point;
        if (a && a.day > b.day) {
          if (locked(0)) return invalid("order");
          [a, b] = [b, a];
        }
        if (rangeDefaultTime.value && !time.value) {
          if (a && !locked(0)) a = { ...a, second: defaultSecond(0) };
          b = { ...b, second: defaultSecond(1) };
        }
        draft.value = [a ?? null, b];
        stage.value = locked(0) ? "end" : "start";
      }
      preview.value = undefined;
    } else draft.value = [point];
    error.value = "";
    emitDraft(endpoint);
    if (!needsConfirm.value && (!range.value || draft.value.every(Boolean))) {
      const value = encode(draft.value);
      return (await request(value, "date")) || dateEqual(value, current.value);
    }
    return false;
  }
  async function clear() {
    const list = points(),
      next = range.value ? list.map((p, i) => (locked(i) ? p : null)) : [];
    const value = range.value && next.some(Boolean) ? encode(next) : empty();
    if (!next.some(Boolean)) markClear(value);
    const accepted = await request(value, "clear", true);
    if (accepted) {
      draft.value = points();
      error.value = "";
      emit("clear");
    }
    return accepted;
  }
  async function confirm() {
    if (!valid(draft.value)) return invalid("draft");
    const value = encode(draft.value),
      ok = await request(value, "confirm");
    if (ok || dateEqual(value, current.value)) {
      emit("ok", dateClone(current.value));
      return true;
    }
    return false;
  }
  async function setValue(value: HysDatePickerValue) {
    const emptyValue =
      isEmpty(value) || (Array.isArray(value) && value.every(isEmpty));
    return emptyValue ? clear() : request(value, "api");
  }
  function setTime(index: number, second: number) {
    if (
      blocked.value ||
      locked(index) ||
      !draft.value[index] ||
      !Number.isInteger(second) ||
      second < 0 ||
      second > 86399
    )
      return false;
    draft.value = draft.value.map((p, i) =>
      i === index && p ? { ...p, second } : p,
    );
    error.value = "";
    emitDraft(index);
    return true;
  }
  function editDraft(
    index: number,
    text: string,
    format: string,
    part: "date" | "time",
  ) {
    if (blocked.value || locked(index)) return false;
    const existing = draft.value[index];
    const parsed =
      part === "date"
        ? datePoint(text, format, first.value, weekContains.value, props.locale)
        : dateClockPoint(text, format);
    if (!parsed || (part === "time" && !existing)) return invalid("format");
    const next =
      part === "date"
        ? { day: parsed.day, second: existing?.second ?? defaultSecond(index) }
        : { day: existing!.day, second: parsed.second };
    if (
      !available(next.day, index, false) ||
      (part === "time" && !validTime(next, index))
    )
      return invalid("draft");
    const values = [...draft.value];
    values[index] = next;
    draft.value = values;
    error.value = "";
    if (part === "date") {
      setPanel(next.day, index);
      if (range.value)
        stage.value = index === 0 && !locked(1) ? "end" : "start";
    }
    emitDraft(index);
    if (!needsConfirm.value && valid(values))
      void request(encode(values), "time");
    return true;
  }
  async function input(value: string, index = 0) {
    if (blocked.value || locked(index)) return false;
    if (!value.trim()) {
      if (range.value && props.allowEmpty?.[index]) {
        const next = [...draft.value];
        next[index] = null;
        draft.value = next;
        error.value = "";
        emitDraft(index);
        if (needsConfirm.value || !valid(next)) return true;
        return request(encode(next), "input");
      }
      return clear();
    }
    const formats = [
        ...(Array.isArray(props.format)
          ? props.format
          : [displayPattern.value]),
        ...(props.inputFormats ?? []),
        pattern.value,
      ].filter((format): format is string => typeof format === "string"),
      point = formats
        .map((f) =>
          datePoint(value, f, first.value, weekContains.value, props.locale),
        )
        .find(Boolean);
    if (!point) return invalid("format");
    const list = range.value ? [...draft.value] : [];
    if (range.value) {
      if (rangeDefaultTime.value && !time.value)
        point.second = defaultSecond(index);
      if (
        !(unit.value === "date"
          ? available(point.day, index, false)
          : periodAvailable(
              ...datePeriod(point.day, unit.value, first.value),
              index,
              false,
            )) ||
        (time.value && !validTime(point, index))
      )
        return invalid("date");
      list[index] = normalize(point);
    } else if (multiple.value) return invalid("multiple-input");
    else list.push(normalize(point));
    draft.value = list;
    if (range.value) {
      error.value = "";
      stage.value = index === 0 && !locked(1) ? "end" : "start";
      if (!list.every(Boolean) && !valid(list)) {
        emitDraft(index);
        return true;
      }
      if (!valid(list)) return invalid("date");
      emitDraft(index);
      if (needsConfirm.value) return true;
    } else if (needsConfirm.value) {
      if (!valid(list)) return invalid("date");
      error.value = "";
      emitDraft(0);
      return true;
    }
    return request(encode(list), "input");
  }
  function pickShortcut(index: number) {
    if (blocked.value) return false;
    const shortcut = shortcuts.value[index];
    if (!shortcut || shortcut.disabled) return false;
    try {
      const value =
        typeof shortcut.value === "function"
          ? shortcut.value()
          : shortcut.value;
      const next = points(value);
      if (!valid(next)) return invalid("shortcut");
      draft.value = next;
      stage.value = "start";
      preview.value = undefined;
      emitDraft(0);
      return true;
    } catch (e) {
      emit("invalid", { reason: "shortcut", error: e });
      return false;
    }
  }
  const shortcuts = computed(() => [
    ...(props.shortcuts ?? []),
    ...(props.presets ?? []),
    ...Object.entries(props.ranges ?? {}).map(([label, value]) => ({
      label,
      value,
      disabled: false,
    })),
  ]);
  watch(
    [
      () => props.type,
      () => props.picker,
      () => props.showTime,
      () => props.valueFormat,
      range,
    ],
    begin,
  );
  return {
    current,
    selected,
    draft,
    stage,
    preview,
    error,
    view: currentView,
    rightView,
    panels,
    first,
    weekContains,
    time,
    unit,
    multiple,
    pattern,
    displayPattern,
    words,
    needsConfirm,
    today,
    model,
    outputType,
    parse,
    boundary,
    points,
    available,
    periodAvailable,
    validTime,
    valid,
    timeDisabled,
    encode,
    describe,
    empty,
    request,
    begin,
    setPanel,
    setMode,
    choose,
    clear,
    confirm,
    setValue,
    setTime,
    editDraft,
    emitDraft,
    input,
    pickShortcut,
    shortcuts,
    context,
    defaultSecond,
    locked,
  };
}
