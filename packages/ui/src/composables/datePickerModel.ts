import { computed, ref, watch, type ComputedRef } from "vue";
import { useChoiceModel } from "./choiceModel";
import {
  dateClone,
  dateEqual,
  dateFormat,
  dateMultiple,
  dateNative,
  datePattern,
  datePeriod,
  datePickerWords,
  datePickerEnglish,
  datePoint,
  dateUnit,
  type HysDateDisplayFormat,
  type HysDatePickerProps,
  type HysDatePickerValue,
  type HysDatePoint,
} from "./datePicker";

export function useDatePickerModel(
  props: HysDatePickerProps,
  range: ComputedRef<boolean>,
) {
  const rememberedType = ref<"string" | "date" | "timestamp">("string");
  const time = computed(
      () =>
        props.type === "datetime" ||
        props.type === "datetimerange" ||
        (!!props.showTime && (props.picker ?? dateUnit(props.type)) === "date"),
    ),
    unit = computed(() => props.picker ?? dateUnit(props.type)),
    rangeDefaultTime = computed(
      () =>
        range.value && unit.value === "date" && props.defaultTime !== undefined,
    ),
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
      () => props.valueFormat ?? datePattern(unit.value, time.value),
    ),
    displayPattern = computed<HysDateDisplayFormat>(() => {
      const format = props.format;
      const primary =
        typeof format === "string" || typeof format === "function"
          ? format
          : format?.[0];
      return (
        primary ??
        (unit.value === "week"
          ? "GGGG-[W]WW"
          : datePattern(unit.value, time.value))
      );
    }),
    words = computed(() => ({
      ...datePickerWords,
      ...(props.locale?.startsWith("en") ? datePickerEnglish : {}),
      ...props.messages,
    })),
    model = useChoiceModel<HysDatePickerValue>(
      {
        get modelValue() {
          return props.modelValue === undefined
            ? props.value
            : props.modelValue;
        },
      },
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
        (isEmpty(current.value)
          ? rememberedType.value
          : current.value instanceof Date ||
              (Array.isArray(current.value) &&
                current.value.some((v) => v instanceof Date))
            ? "date"
            : typeof current.value === "number" ||
                (Array.isArray(current.value) &&
                  current.value.some((v) => typeof v === "number"))
              ? "timestamp"
              : rememberedType.value),
    );
  function parse(value: unknown) {
    return datePoint(
      value,
      pattern.value,
      first.value,
      weekContains.value,
      props.locale,
    );
  }
  function boundary(value: unknown) {
    return (
      parse(value) ??
      datePoint(value, "YYYY-MM-DD") ??
      datePoint(value, "YYYY-MM-DD HH:mm:ss") ??
      datePoint(value, "YYYY-MM-DD[T]HH:mm:ss")
    );
  }
  function normalize(point: HysDatePoint) {
    return {
      day: datePeriod(point.day, unit.value, first.value)[0],
      second: time.value || rangeDefaultTime.value ? point.second : 0,
    };
  }
  let resolvedClear: HysDatePickerValue | undefined;
  function isEmpty(value: HysDatePickerValue | undefined) {
    return (
      value == null ||
      value === "" ||
      props.emptyValues?.some((entry) => dateEqual(value, entry)) ||
      (props.clearValue !== undefined && dateEqual(value, props.clearValue)) ||
      (typeof props.valueOnClear !== "function" &&
        props.valueOnClear !== undefined &&
        dateEqual(value, props.valueOnClear)) ||
      (resolvedClear !== undefined && dateEqual(value, resolvedClear))
    );
  }
  function points(
    value: HysDatePickerValue | undefined = current.value,
  ): (HysDatePoint | null)[] {
    if (isEmpty(value)) return range.value ? [null, null] : [];
    if (range.value)
      return Array.from({ length: 2 }, (_, i) => {
        const point =
          Array.isArray(value) && !isEmpty(value[i])
            ? parse(value[i])
            : undefined;
        return point ? normalize(point) : null;
      });
    if (multiple.value) {
      const seen = new Set<number>();
      return (Array.isArray(value) ? value : []).flatMap((v) => {
        const point = isEmpty(v) ? undefined : parse(v);
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
            : dateFormat(
                point,
                pattern.value,
                first.value,
                weekContains.value,
                props.locale,
              );
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
    if (props.valueOnClear !== undefined) {
      const value =
        typeof props.valueOnClear === "function"
          ? props.valueOnClear()
          : props.valueOnClear;
      return dateClone(value);
    }
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
        ? typeof displayPattern.value === "function"
          ? displayPattern.value(dateNative(point))
          : dateFormat(
              point,
              displayPattern.value,
              first.value,
              weekContains.value,
              props.locale,
            )
        : "",
    );
  }
  watch(
    current,
    (value) => {
      if (isEmpty(value)) return;
      const values = Array.isArray(value) ? value : [value],
        sample = values.find((v) => !isEmpty(v));
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
  function markClear(value: HysDatePickerValue) {
    resolvedClear = dateClone(value);
  }
  return {
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
  };
}
