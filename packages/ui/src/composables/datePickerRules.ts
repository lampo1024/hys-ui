import type { Ref } from "vue";
import { calendarISO } from "./calendar";
import {
  DATE_MIN,
  DATE_MAX,
  dateNative,
  datePeriod,
  dateShift,
  dateWeek,
  type HysDatePickerContext,
  type HysDatePickerProps,
  type HysDatePickerUnit,
  type HysDatePoint,
} from "./datePicker";

interface DatePickerRules {
  props: HysDatePickerProps;
  range: Readonly<Ref<boolean>>;
  multiple: Readonly<Ref<boolean>>;
  time: Readonly<Ref<boolean>>;
  unit: Readonly<Ref<HysDatePickerUnit>>;
  first: Readonly<Ref<number>>;
  weekContains: Readonly<Ref<number>>;
  selected: Readonly<Ref<readonly (HysDatePoint | null)[]>>;
  draft: Readonly<Ref<readonly (HysDatePoint | null)[]>>;
  stage: Readonly<Ref<"start" | "end">>;
  minPoint: Readonly<Ref<HysDatePoint | undefined>>;
  maxPoint: Readonly<Ref<HysDatePoint | undefined>>;
}

export function useDatePickerRules({
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
}: DatePickerRules) {
  function context(
    day: number,
    endpoint: number,
    from = draft.value[0],
  ): HysDatePickerContext {
    return {
      range: endpoint ? "end" : "start",
      from: range.value && from ? dateNative(from) : null,
      iso: calendarISO(day),
    };
  }
  function locked(endpoint: number) {
    return Array.isArray(props.disabled) && !!props.disabled[endpoint];
  }
  function available(
    day: number,
    endpoint = 0,
    rangeLimit = true,
    from = draft.value[0],
  ) {
    if (
      !Number.isFinite(day) ||
      day < DATE_MIN ||
      day > DATE_MAX ||
      (minPoint.value && day < minPoint.value.day) ||
      (maxPoint.value && day > maxPoint.value.day)
    )
      return false;
    if (
      props.disabledDate?.(
        new Date(day * 86400000),
        context(day, endpoint, from),
      )
    )
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
    fromPoint = draft.value[0],
  ) {
    if (unit.value === "week" && end - start <= 6) {
      if (
        props.disabledWeek?.(dateWeek(start, first.value, weekContains.value))
      )
        return false;
      if (props.weekValidation === "full") {
        if (end - start !== 6) return false;
        for (let day = start; day <= end; day++)
          if (!available(day, endpoint, rangeLimit, fromPoint)) return false;
        return true;
      }
    }
    const from = Math.max(start, minPoint.value?.day ?? DATE_MIN),
      to = Math.min(end, maxPoint.value?.day ?? DATE_MAX);
    for (let day = from; day <= to; day++)
      if (available(day, endpoint, rangeLimit, fromPoint)) return true;
    return false;
  }
  function timeDisabled(
    point: HysDatePoint,
    endpoint: number,
    from = draft.value[0],
  ) {
    const ctx = context(point.day, endpoint, from);
    const config = props.disabledTime?.(dateNative(point), ctx);
    const disabledHours = props.disabledHours?.(ctx.range, ctx.from);
    const namedHours = config?.disabledHours?.();
    const minimum =
      minPoint.value?.day === point.day ? minPoint.value.second : 0;
    const maximum = maxPoint.value?.day === point.day ? lastSecond() : 86399;
    function outside(start: number, duration: number) {
      return start + duration - 1 < minimum || start > maximum;
    }
    const hours = Array.from({ length: 24 }, (_, hour) => hour).filter((hour) =>
      outside(hour * 3600, 3600),
    );
    const clockValues = Array.from({ length: 60 }, (_, index) => index);
    return {
      hours: [
        ...hours,
        ...(config?.hours ?? []),
        ...(namedHours ?? []),
        ...(disabledHours ?? []),
      ],
      minutes: (hour: number) => [
        ...clockValues.filter((minute) =>
          outside(hour * 3600 + minute * 60, 60),
        ),
        ...(config?.minutes?.(hour) ?? []),
        ...(config?.disabledMinutes?.(hour) ?? []),
        ...(props.disabledMinutes?.(hour, ctx.range, ctx.from) ?? []),
      ],
      seconds: (hour: number, minute: number) => [
        ...clockValues.filter((second) =>
          outside(hour * 3600 + minute * 60 + second, 1),
        ),
        ...(config?.seconds?.(hour, minute) ?? []),
        ...(config?.disabledSeconds?.(hour, minute) ?? []),
        ...(props.disabledSeconds?.(hour, minute, ctx.range, ctx.from) ?? []),
      ],
    };
  }
  function lastSecond() {
    return typeof props.max === "string" && !/[T :]/.test(props.max)
      ? 86399
      : (maxPoint.value?.second ?? 0);
  }
  function validTime(
    point: HysDatePoint,
    endpoint: number,
    from = draft.value[0],
  ) {
    const config = timeDisabled(point, endpoint, from),
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
      maxSecond = lastSecond();
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
            if (!available(day, day === a.day ? 0 : 1, false, a)) return false;
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
          ? available(point.day, range.value ? i : 0, false, list[0] ?? null)
          : periodAvailable(
              ...datePeriod(point.day, unit.value, first.value),
              range.value ? i : 0,
              false,
              list[0] ?? null,
            )) &&
          (!time.value ||
            validTime(point, range.value ? i : 0, list[0] ?? null))),
    );
  }
  function samePoint(
    a: HysDatePoint | null | undefined,
    b: HysDatePoint | null | undefined,
  ) {
    return (
      (!a && !b) || (!!a && !!b && a.day === b.day && a.second === b.second)
    );
  }
  return {
    context,
    locked,
    available,
    periodAvailable,
    timeDisabled,
    validTime,
    valid,
    samePoint,
  };
}
