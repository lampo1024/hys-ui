import { computed, ref, type Ref } from "vue";
import { calendarParts, civilDay } from "./calendar";
import {
  DATE_MIN,
  DATE_MAX,
  dateNative,
  dateShift,
  type HysDatePickerProps,
  type HysDatePickerUnit,
  type HysDatePickerView,
  type HysDatePoint,
} from "./datePicker";

interface DatePickerPanels {
  props: HysDatePickerProps;
  unit: Readonly<Ref<HysDatePickerUnit>>;
  range: Readonly<Ref<boolean>>;
  time: Readonly<Ref<boolean>>;
  selected: Readonly<Ref<readonly (HysDatePoint | null)[]>>;
  minPoint: Readonly<Ref<HysDatePoint | undefined>>;
  maxPoint: Readonly<Ref<HysDatePoint | undefined>>;
  boundary: (value: unknown) => HysDatePoint | undefined;
  encodePoint: (point: HysDatePoint) => string | number | Date;
  emit: (name: string, ...args: any[]) => void;
}

export function useDatePickerPanels({
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
}: DatePickerPanels) {
  const view = ref<HysDatePickerView>(
      props.defaultMode ?? (unit.value === "week" ? "date" : unit.value),
    ),
    rightView = ref<HysDatePickerView>(view.value),
    ownPanel = ref(0),
    rightPanel = ref(0),
    panels = computed(() => {
      const left =
        boundary(props.panelValues?.[0] ?? props.panelValue)?.day ??
        ownPanel.value;
      const controlledRight = boundary(props.panelValues?.[1])?.day;
      return [
        left,
        controlledRight ??
          (props.panelValue !== undefined && !props.unlinkPanels
            ? linkedPanel(left, 1)
            : rightPanel.value),
      ];
    }),
    baseView = computed(() => (unit.value === "week" ? "date" : unit.value)),
    currentView = computed(() => {
      const mode = props.mode ?? view.value;
      return mode === "time" && !time.value ? baseView.value : mode;
    });
  function resetPanels(today: number) {
    const defaults = props.defaultPickerValue;
    const initial = Array.isArray(defaults) ? defaults[0] : defaults;
    const day = clampPanel(
      selected.value.find(Boolean)?.day ?? boundary(initial)?.day ?? today,
    );
    ownPanel.value = day;
    const end =
      selected.value[1]?.day ??
      (Array.isArray(defaults) ? boundary(defaults[1])?.day : undefined);
    rightPanel.value =
      (props.unlinkPanels ||
        (!selected.value.some(Boolean) && Array.isArray(defaults))) &&
      end !== undefined
        ? clampPanel(end)
        : linkedPanel(day, 1);
    view.value =
      props.defaultMode ?? (unit.value === "week" ? "date" : unit.value);
    rightView.value = view.value === "time" ? baseView.value : view.value;
  }
  function clampPanel(day: number) {
    return Math.max(
      minPoint.value?.day ?? DATE_MIN,
      Math.min(maxPoint.value?.day ?? DATE_MAX, day),
    );
  }
  function linkedPanel(day: number, direction: number) {
    const step =
      unit.value === "year"
        ? 144
        : unit.value === "month" || unit.value === "quarter"
          ? 12
          : 1;
    return dateShift(day, direction * step);
  }
  function setPanel(day: number, index = 0) {
    if (!Number.isFinite(day) || day < DATE_MIN || day > DATE_MAX) return false;
    const start = civilDay(
      calendarParts(day).year,
      calendarParts(day).month,
      1,
    );
    const next = [...panels.value];
    next[index] = start;
    if (!props.unlinkPanels)
      next[1 - index] = linkedPanel(start, index ? -1 : 1);
    if (!props.panelValues && index === 0) {
      if (props.panelValue === undefined) ownPanel.value = start;
      emit("update:panelValue", encodePoint({ day: start, second: 0 }));
      if (range.value && !props.unlinkPanels) rightPanel.value = next[1];
    } else if (!props.panelValues) {
      rightPanel.value = start;
      if (!props.unlinkPanels) {
        if (props.panelValue === undefined) ownPanel.value = next[0];
        emit("update:panelValue", encodePoint({ day: next[0], second: 0 }));
      }
    }
    if (range.value)
      emit(
        "update:panelValues",
        next.map((day) => dateNative({ day, second: 0 })),
      );
    emit(
      "panelChange",
      dateNative({ day: start, second: 0 }),
      index ? rightView.value : currentView.value,
      { index },
    );
    return true;
  }
  function setMode(mode: HysDatePickerView, index = 0) {
    if (
      !["date", "month", "quarter", "year", "decade", "time"].includes(mode) ||
      (mode === "time" && !time.value)
    )
      return false;
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
  return { currentView, rightView, panels, resetPanels, setPanel, setMode };
}
