import { computed, ref, shallowRef, watch, type ComputedRef } from "vue";
import { useChoiceModel } from "./choiceModel";
import { calendarDate, calendarISO, calendarParts, civilDay } from "./calendar";
import {
  DATE_MIN,
  DATE_MAX,
  dateClone,
  dateEqual,
  dateFormat,
  dateWeek,
  dateMultiple,
  dateNative,
  datePattern,
  datePeriod,
  datePickerWords,
  datePickerEnglish,
  datePoint,
  dateShift,
  dateTimeSeconds,
  dateUnit,
  type HysDatePoint,
  type HysDatePickerProps,
  type HysDatePickerValue,
  type HysDatePickerView,
  type HysDatePickerContext,
  type HysDatePickerChange,
} from "./datePicker";
export function useDatePicker(
  props: HysDatePickerProps,
  range: ComputedRef<boolean>,
  blocked: ComputedRef<boolean>,
  emit: (name: string, ...args: any[]) => void,
  validate: () => void,
) {
  const rememberedType = ref<"string" | "date" | "timestamp">("string");
  const time = computed(
      () =>
        props.type === "datetime" ||
        (!!props.showTime && dateUnit(props.type) === "date"),
    ),
    unit = computed(() => dateUnit(props.type)),
    multiple = computed(() => !range.value && dateMultiple(props.type)),
    first = computed(() =>
      Number.isFinite(props.firstDayOfWeek)
        ? ((Math.trunc(props.firstDayOfWeek!) % 7) + 7) % 7
        : 1,
    ),
    weekContains = computed(() =>
      Number.isFinite(props.firstWeekContainsDate)
        ? Math.max(1, Math.min(7, Math.trunc(props.firstWeekContainsDate!)))
        : 4,
    ),
    pattern = computed(
      () => props.valueFormat ?? datePattern(props.type, time.value),
    ),
    displayPattern = computed(
      () =>
        props.format ??
        (unit.value === "week"
          ? "GGGG-[W]WW"
          : datePattern(props.type, time.value)),
    ),
    words = computed(() => ({
      ...datePickerWords,
      ...(props.locale?.startsWith("en") ? datePickerEnglish : {}),
      ...props.messages,
    })),
    model = useChoiceModel<HysDatePickerValue>(
      props,
      () =>
        dateClone(
          props.defaultValue ??
            (range.value ? ["", ""] : multiple.value ? [] : ""),
        ),
      dateEqual,
    ),
    current = model.current,
    outputType = computed(
      () =>
        props.valueType ??
        (current.value instanceof Date ||
        (Array.isArray(current.value) &&
          current.value.some((v) => v instanceof Date))
          ? "date"
          : typeof current.value === "number" ||
              (Array.isArray(current.value) &&
                current.value.some((v) => typeof v === "number"))
            ? "timestamp"
            : rememberedType.value),
    ),
    draft = shallowRef<(HysDatePoint | null)[]>([]),
    stage = ref<"start" | "end">("start"),
    preview = ref<number>(),
    error = ref(""),
    view = ref<HysDatePickerView>(
      props.defaultMode ?? (unit.value === "week" ? "date" : unit.value),
    ),
    rightView = ref<HysDatePickerView>(view.value),
    ownPanel = ref(0),
    rightPanel = ref(0),
    today = computed(() => datePoint(new Date())!),
    panels = computed(() => [
      props.panelValue === undefined
        ? ownPanel.value
        : (boundary(props.panelValue)?.day ?? ownPanel.value),
      rightPanel.value,
    ]),
    currentView = computed(() => props.mode ?? view.value),
    needsConfirm = computed(
      () =>
        props.showConfirm ??
        (time.value ||
          multiple.value ||
          (range.value && !!props.allowEmpty?.some(Boolean))),
    );
  function parse(value: unknown) {
    return datePoint(value, pattern.value, first.value, weekContains.value);
  }
  function boundary(value: unknown) {
    return (
      parse(value) ??
      datePoint(value, "YYYY-MM-DD") ??
      datePoint(value, "YYYY-MM-DD HH:mm:ss")
    );
  }
  function normalize(point: HysDatePoint) {
    return {
      day: datePeriod(point.day, unit.value, first.value)[0],
      second: time.value ? point.second : 0,
    };
  }
  function points(
    value: HysDatePickerValue | undefined = current.value,
  ): (HysDatePoint | null)[] {
    if (
      value == null ||
      value === "" ||
      (props.clearValue !== undefined && dateEqual(value, props.clearValue))
    )
      return range.value ? [null, null] : [];
    if (range.value)
      return Array.from({ length: 2 }, (_, i) => {
        const point = Array.isArray(value) ? parse(value[i]) : undefined;
        return point ? normalize(point) : null;
      });
    if (multiple.value) {
      const seen = new Set<number>();
      return (Array.isArray(value) ? value : []).flatMap((v) => {
        const point = parse(v);
        if (!point) return [];
        const normalized = normalize(point);
        if (unit.value === "week" && seen.has(normalized.day)) return [];
        seen.add(normalized.day);
        return [normalized];
      });
    }
    const point = parse(value);
    return point ? [normalize(point)] : [];
  }
  const selected = computed(() => points()),
    minPoint = computed(() => boundary(props.min)),
    maxPoint = computed(() => boundary(props.max));
  function context(day: number, endpoint: number): HysDatePickerContext {
    return {
      range: endpoint ? "end" : "start",
      from: draft.value[0] ? new Date(draft.value[0].day * 86400000) : null,
      iso: calendarISO(day),
    };
  }
  function locked(endpoint: number) {
    return Array.isArray(props.disabled) && !!props.disabled[endpoint];
  }
  function available(day: number, endpoint = 0, rangeLimit = true) {
    if (
      !Number.isFinite(day) ||
      day < DATE_MIN ||
      day > DATE_MAX ||
      (minPoint.value && day < minPoint.value.day) ||
      (maxPoint.value && day > maxPoint.value.day)
    )
      return false;
    if (props.disabledDate?.(new Date(day * 86400000), context(day, endpoint)))
      return false;
    if (range.value && rangeLimit && endpoint === 1 && draft.value[0]) {
      const days =
        unit.value === "week"
          ? Math.abs(
              datePeriod(day, "week", first.value)[0] -
                datePeriod(draft.value[0].day, "week", first.value)[0],
            ) + 7
          : Math.abs(day - draft.value[0].day) + 1;
      if (
        (props.minRangeDays && days < props.minRangeDays) ||
        (props.maxRangeDays && days > props.maxRangeDays)
      )
        return false;
    }
    return true;
  }
  function periodAvailable(
    start: number,
    end: number,
    endpoint = stage.value === "end" ? 1 : 0,
    rangeLimit = true,
  ) {
    if (unit.value === "week" && end - start <= 6) {
      if (
        props.disabledWeek?.(dateWeek(start, first.value, weekContains.value))
      )
        return false;
      if (props.weekValidation === "full") {
        if (end - start !== 6) return false;
        for (let day = start; day <= end; day++)
          if (!available(day, endpoint, rangeLimit)) return false;
        return true;
      }
    }
    const from = Math.max(start, minPoint.value?.day ?? DATE_MIN),
      to = Math.min(end, maxPoint.value?.day ?? DATE_MAX);
    for (let day = from; day <= to; day++)
      if (available(day, endpoint, rangeLimit)) return true;
    return false;
  }
  function timeDisabled(point: HysDatePoint, endpoint: number) {
    return (
      props.disabledTime?.(dateNative(point), context(point.day, endpoint)) ??
      {}
    );
  }
  function validTime(point: HysDatePoint, endpoint: number) {
    const config = timeDisabled(point, endpoint),
      h = Math.floor(point.second / 3600),
      m = Math.floor(point.second / 60) % 60,
      s = point.second % 60;
    if (
      config.hours?.includes(h) ||
      config.minutes?.(h).includes(m) ||
      config.seconds?.(h, m).includes(s)
    )
      return false;
    const value = point.day * 86400 + point.second,
      min = minPoint.value,
      max = maxPoint.value,
      maxSecond =
        typeof props.max === "string" && !/[T :]/.test(props.max)
          ? 86399
          : (max?.second ?? 0);
    return !(
      (min && value < min.day * 86400 + min.second) ||
      (max && value > max.day * 86400 + maxSecond)
    );
  }
  function valid(list: readonly (HysDatePoint | null)[], enforceLocks = true) {
    if (range.value) {
      if (list.length !== 2) return false;
      if (list.some((p, i) => !p && !props.allowEmpty?.[i])) return false;
      const [a, b] = list;
      if (a && b && a.day * 86400 + a.second > b.day * 86400 + b.second)
        return false;
      if (a && b) {
        const end =
            unit.value === "week"
              ? datePeriod(b.day, "week", first.value)[1]
              : b.day,
          days = end - a.day + 1;
        if (
          (props.minRangeDays && days < props.minRangeDays) ||
          (props.maxRangeDays && days > props.maxRangeDays)
        )
          return false;
        if (props.rangeValidation === "continuous") {
          if (b.day > dateShift(a.day, 1200)) return false;
          for (let day = a.day; day <= end; day++) {
            if (!available(day, day === a.day ? 0 : 1, false)) return false;
            if (
              unit.value === "week" &&
              (day - a.day) % 7 === 0 &&
              props.disabledWeek?.(
                dateWeek(day, first.value, weekContains.value),
              )
            )
              return false;
          }
        }
      }
      if (
        enforceLocks &&
        list.some((p, i) => locked(i) && !samePoint(p, selected.value[i]))
      )
        return false;
    } else if (
      !list.length ||
      (!multiple.value && list.length !== 1) ||
      (props.maxDates && list.length > props.maxDates)
    )
      return false;
    return list.every(
      (point, i) =>
        !point ||
        ((unit.value === "date"
          ? available(point.day, range.value ? i : 0, false)
          : periodAvailable(
              ...datePeriod(point.day, unit.value, first.value),
              range.value ? i : 0,
              false,
            )) &&
          (!time.value || validTime(point, range.value ? i : 0))),
    );
  }
  function encodePoint(point: HysDatePoint): string | number | Date {
    const date = dateNative(point);
    return outputType.value === "date"
      ? date
      : outputType.value === "timestamp"
        ? date.getTime()
        : pattern.value === "x"
          ? String(date.getTime())
          : pattern.value === "X"
            ? String(Math.floor(date.getTime() / 1000))
            : dateFormat(point, pattern.value, first.value, weekContains.value);
  }
  function encode(list: readonly (HysDatePoint | null)[]): HysDatePickerValue {
    return range.value || multiple.value
      ? list.map((p) =>
          p ? encodePoint(p) : outputType.value === "string" ? "" : null,
        )
      : list[0]
        ? encodePoint(list[0])
        : empty();
  }
  function empty(): HysDatePickerValue {
    return props.clearValue !== undefined
      ? dateClone(props.clearValue)
      : range.value
        ? outputType.value === "string"
          ? ["", ""]
          : [null, null]
        : multiple.value
          ? []
          : outputType.value === "string"
            ? ""
            : null;
  }
  function describe(list = selected.value) {
    return list.map((point) =>
      point
        ? dateFormat(
            point,
            displayPattern.value,
            first.value,
            weekContains.value,
          )
        : "",
    );
  }
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
      if (raw.some((v) => v !== null && v !== "" && !parse(v)))
        return invalid("format");
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
      (next) => emit("update:modelValue", next),
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
    error.value = "";
    draft.value = points();
    if (range.value && draft.value.length !== 2) draft.value = [null, null];
    stage.value = range.value && locked(0) && !locked(1) ? "end" : "start";
    preview.value = undefined;
    let day =
      selected.value.find(Boolean)?.day ??
      boundary(props.defaultPickerValue)?.day ??
      today.value.day;
    day = Math.max(
      minPoint.value?.day ?? DATE_MIN,
      Math.min(maxPoint.value?.day ?? DATE_MAX, day),
    );
    ownPanel.value = day;
    rightPanel.value = dateShift(day, 1);
    view.value =
      props.defaultMode ?? (unit.value === "week" ? "date" : unit.value);
    rightView.value = view.value;
  }
  function setPanel(day: number, index = 0) {
    if (!Number.isFinite(day) || day < DATE_MIN || day > DATE_MAX) return false;
    const start = civilDay(
      calendarParts(day).year,
      calendarParts(day).month,
      1,
    );
    if (index === 0) {
      if (props.panelValue === undefined) ownPanel.value = start;
      emit("update:panelValue", encodePoint({ day: start, second: 0 }));
      if (range.value && !props.unlinkPanels)
        rightPanel.value = dateShift(start, 1);
    } else {
      rightPanel.value = start;
      if (!props.unlinkPanels) {
        if (props.panelValue === undefined)
          ownPanel.value = dateShift(start, -1);
        emit(
          "update:panelValue",
          encodePoint({ day: dateShift(start, -1), second: 0 }),
        );
      }
    }
    emit(
      "panelChange",
      dateNative({ day: start, second: 0 }),
      index ? rightView.value : currentView.value,
      { index },
    );
    return true;
  }
  function setMode(mode: HysDatePickerView, index = 0) {
    if (!["date", "month", "quarter", "year"].includes(mode)) return false;
    if (index) rightView.value = mode;
    else {
      if (props.mode === undefined) view.value = mode;
      emit("update:mode", mode);
    }
    emit(
      "panelChange",
      dateNative({ day: panels.value[index], second: 0 }),
      mode,
      { index },
    );
    return index ? true : currentView.value === mode;
  }
  function defaultSecond(index: number) {
    const value = Array.isArray(props.defaultTime)
      ? props.defaultTime[index]
      : props.defaultTime;
    return dateTimeSeconds(value as string | undefined);
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
        draft.value = [a ?? null, b];
        stage.value = locked(0) ? "end" : "start";
      }
      preview.value = undefined;
    } else draft.value = [point];
    error.value = "";
    emit("calendarChange", encode(draft.value), {
      range: endpoint ? "end" : "start",
      dates: draft.value.map((p) => (p ? dateNative(p) : null)),
    });
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
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.every((v) => v == null || v === "")) ||
      dateEqual(value, empty());
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
    emit("calendarChange", encode(draft.value), {
      range: index ? "end" : "start",
      dates: draft.value.map((p) => (p ? dateNative(p) : null)),
    });
    return true;
  }
  async function input(value: string, index = 0) {
    if (blocked.value || locked(index)) return false;
    if (!value.trim()) {
      if (range.value && props.allowEmpty?.[index]) {
        const next = points();
        next[index] = null;
        draft.value = next;
        return request(encode(next), "input");
      }
      return clear();
    }
    const formats = [displayPattern.value, ...(props.inputFormats ?? [])],
      point = formats
        .map((f) => datePoint(value, f, first.value, weekContains.value))
        .find(Boolean);
    if (!point) return invalid("format");
    const list = range.value ? points() : [];
    if (range.value) list[index] = normalize(point);
    else if (multiple.value) return invalid("multiple-input");
    else list.push(normalize(point));
    draft.value = list;
    return request(encode(list), "input");
  }
  function pickShortcut(index: number) {
    if (blocked.value) return false;
    const shortcut = props.shortcuts?.[index];
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
      emit("calendarChange", encode(next), {
        range: "start",
        dates: next.map((p) => (p ? dateNative(p) : null)),
      });
      return true;
    } catch (e) {
      emit("invalid", { reason: "shortcut", error: e });
      return false;
    }
  }
  function samePoint(
    a: HysDatePoint | null | undefined,
    b: HysDatePoint | null | undefined,
  ) {
    return (
      (!a && !b) || (!!a && !!b && a.day === b.day && a.second === b.second)
    );
  }
  watch(
    [() => props.type, () => props.showTime, () => props.valueFormat],
    begin,
  );
  watch(
    current,
    (value) => {
      if (props.clearValue !== undefined && dateEqual(value, props.clearValue))
        return;
      const values = Array.isArray(value) ? value : [value],
        sample = values.find((v) => v !== null && v !== undefined && v !== "");
      if (sample !== undefined)
        rememberedType.value =
          sample instanceof Date
            ? "date"
            : typeof sample === "number"
              ? "timestamp"
              : "string";
    },
    { immediate: true, flush: "sync" },
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
    input,
    pickShortcut,
    locked,
  };
}
