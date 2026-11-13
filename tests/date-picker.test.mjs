import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Document",
  "ShadowRoot",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLButtonElement",
  "HTMLSelectElement",
  "HTMLFormElement",
  "Event",
  "FocusEvent",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 20,
    y: 20,
    left: 20,
    top: 20,
    right: 320,
    bottom: 60,
    width: 300,
    height: 40,
    toJSON() {
      return {};
    },
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
HTMLElement.prototype.scrollIntoView = function () {};
if (!("inert" in HTMLElement.prototype))
  Object.defineProperty(HTMLElement.prototype, "inert", {
    configurable: true,
    get() {
      return this.hasAttribute("inert");
    },
    set(value) {
      this.toggleAttribute("inert", !!value);
    },
  });
const { createApp, h, reactive, ref, nextTick, KeepAlive, defineComponent } =
  await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const mounts = new Set();
async function mount(Component, values = {}, slots = {}) {
  const props = reactive(values),
    events = {},
    element = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Array.isArray(Component.emits)
      ? Component.emits
      : Object.keys(Component.emits || {})
    ).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        (events[name] ??= []).push(args);
        if (name.startsWith("update:")) props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(
          Component,
          { ...props, ...listeners, ref: element },
          typeof slots === "string" ? { default: () => slots } : slots,
        );
    },
  });
  app.mount(host);
  const item = {
    props,
    events,
    host,
    get vm() {
      return element.value;
    },
    find: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
    unmount() {
      app.unmount();
      host.remove();
      mounts.delete(item);
    },
  };
  mounts.add(item);
  await nextTick();
  return item;
}
const fire = async (element, type, options = {}) => {
  assert(element, "Missing target for " + type);
  const EventClass = type.startsWith("key")
    ? KeyboardEvent
    : type === "click" || type === "contextmenu"
      ? MouseEvent
      : Event;
  element.dispatchEvent(
    new EventClass(type, { bubbles: true, cancelable: true, ...options }),
  );
  await nextTick();
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
afterEach(async () => {
  for (const item of [...mounts]) item.unmount();
  await nextTick();
  document.body.innerHTML = "";
  document.body.style.cssText = "";
});

const popup = () =>
  document.querySelector(".hys-ui-date-popup:not(.hys-ui-date-inline)");
const date = (value) => popup()?.querySelector('[data-date="' + value + '"]');
const button = (text, within = popup()) =>
  [...within.querySelectorAll("button")].find(
    (el) =>
      el.textContent.trim() === text || el.getAttribute("aria-label") === text,
  );
const settle = async () => {
  await nextTick();
  await nextTick();
  await pause(2);
};
test("DatePicker accepts alternate locale formats and clears to a custom value through v-model:value", async () => {
  let clears = 0;
  const a = await mount(ui.HysDatePicker, {
    value: "2026-11-06",
    locale: "en",
    format: [(date) => "Day " + date.getDate(), "MMM D, YYYY ddd", "M-D-YYYY"],
    editable: true,
    allowClear: true,
    valueOnClear: () => {
      clears++;
      return "pending";
    },
    emptyValues: ["pending"],
  });
  const input = a.find(".hys-ui-date-input");
  assert.equal(input.value, "Day 6");
  for (const [entry, expected] of [
    ["Nov 9, 2026 Tue", "2026-11-06"],
    ["Nov 9, 2026 Mon", "2026-11-09"],
    ["11-10-2026", "2026-11-10"],
  ]) {
    input.value = entry;
    await fire(input, "input");
    await fire(input, "keydown", { key: "Enter" });
    await settle();
    assert.equal(a.props.value, expected);
  }
  await fire(a.find(".hys-ui-date-clear"), "click");
  await settle();
  assert.equal(a.props.value, "pending");
  assert.equal(input.value, "");
  assert.equal(clears, 1);
});

test("DatePicker range alias supports separate input IDs and stages the first typed endpoint", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: null,
    type: "daterange",
    id: ["begin-date", "finish-date"],
    placeholder: ["Begin", "Finish"],
    editable: true,
    separator: "→",
  });
  const begin = a.find("#begin-date"),
    finish = a.find("#finish-date");
  assert.equal(begin.placeholder, "Begin");
  assert.equal(finish.placeholder, "Finish");
  assert.equal(a.find(".hys-ui-date-separator").textContent, "→");
  for (const [input, value] of [
    [begin, "2026-11-06"],
    [finish, "2026-11-09"],
  ]) {
    input.value = value;
    await fire(input, "input");
    await fire(input, "keydown", { key: "Enter" });
    await settle();
    if (input === begin) assert.equal(a.props.modelValue, null);
  }
  assert.deepEqual(a.props.modelValue, ["2026-11-06", "2026-11-09"]);
  assert.deepEqual(
    a.events.calendarChange.at(-1)[1].formatted,
    a.props.modelValue,
  );
});

test("Date-only ranges apply each default time after ordering the endpoints", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "daterange",
    valueType: "date",
    defaultPickerValue: "2026-11-06",
    defaultTime: ["09:30", new Date(2000, 0, 1, 17, 45)],
  });
  await a.vm.show();
  assert.equal(popup().querySelector(".hys-ui-date-time-area"), null);
  await fire(date("2026-11-09"), "click");
  await fire(date("2026-11-06"), "click");
  await settle();
  assert.deepEqual(
    a.vm.value.map((value) => [
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
    ]),
    [
      [6, 9, 30],
      [9, 17, 45],
    ],
  );
});

test("DateRangePicker seeds both panels, reports independent navigation and validates lazy presets", async () => {
  let uses = 0;
  const a = await mount(
    ui.HysDateRangePicker,
    {
      modelValue: null,
      defaultPickerValue: [new Date(2026, 9, 1), new Date(2026, 11, 1)],
      singlePanel: false,
      unlinkPanels: true,
      showConfirm: true,
      shortcutPlacement: "start",
      presets: [
        {
          label: "End of year",
          value: () => {
            uses++;
            return ["2026-12-21", "2026-12-31"];
          },
        },
      ],
    },
    { "extra-footer": ({ view }) => view },
  );
  await a.vm.show();
  const panels = [...popup().querySelectorAll(".hys-ui-date-panel")];
  assert.deepEqual(
    panels.map((panel) => panel.ariaLabel),
    ["2026-10", "2026-12"],
  );
  assert.equal(
    popup().querySelector(".hys-ui-date-extra-footer").textContent,
    "date",
  );
  await fire(panels[1].querySelector('[aria-label="下个月"]'), "click");
  assert.deepEqual(
    a.events["update:panelValues"]
      .at(-1)[0]
      .map((date) => [date.getFullYear(), date.getMonth()]),
    [
      [2026, 9],
      [2027, 0],
    ],
  );
  assert.equal(uses, 0);
  await fire(button("End of year"), "click");
  assert.equal(uses, 1);
  assert.equal(a.props.modelValue, null);
  assert(await a.vm.confirm());
  await settle();
  assert.deepEqual(a.props.modelValue, ["2026-12-21", "2026-12-31"]);
  assert.deepEqual(
    a.events.openChange.map(([open]) => open),
    [true, false],
  );
});

test("DatePicker datetime fields validate 12-hour input, boundaries and hidden time options", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "",
    type: "datetime",
    defaultPickerValue: "2026-11-06",
    dateFormat: "MMM DD, YYYY",
    locale: "en",
    timeFormat: "hh:mm A",
    showTime: {
      defaultValue: new Date(2000, 0, 1, 14),
      hideDisabledOptions: true,
      minuteStep: 15,
    },
    min: "2026-11-06 13:00:00",
    disabledHours: () => [15],
    arrowControl: true,
    defaultMode: "time",
  });
  await a.vm.show();
  assert.equal(popup().querySelector(".hys-ui-date-panels"), null);
  const [dateInput, timeInput] = popup().querySelectorAll(
    ".hys-ui-date-time-fields input",
  );
  dateInput.value = "Nov 06, 2026";
  await fire(dateInput, "change");
  assert.equal(timeInput.value, "02:00 PM");
  await fire(button("Hour +"), "click");
  assert.equal(timeInput.value, "04:00 PM");
  timeInput.value = "12:30 PM";
  await fire(timeInput, "change");
  assert(button("OK").disabled);
  timeInput.value = "01:30 PM";
  await fire(timeInput, "change");
  assert.equal(a.props.modelValue, "");
  await fire(button("OK"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11-06 13:30:00");
});

test("DatePicker decade browsing and custom popup host keep selection and visibility separate", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const a = await mount(
    ui.HysDatePicker,
    {
      picker: "month",
      defaultPickerValue: "2026-11",
      defaultMode: "decade",
      getPopupContainer: () => host,
      popperClass: "custom-date-popup",
      popperStyle: "--custom-date: 1",
    },
    { "month-cell-render": ({ text }) => "Month " + text },
  );
  await a.vm.show();
  assert(host.contains(popup()));
  assert(popup().classList.contains("custom-date-popup"));
  assert.equal(popup().style.getPropertyValue("--custom-date"), "1");
  await fire(popup().querySelector("[data-date='2020-01-01']"), "click");
  await settle();
  await fire(popup().querySelector("[data-date='2024-01-01']"), "click");
  await settle();
  assert(popup().textContent.includes("Month "));
  await fire(popup().querySelector("[data-date='2024-02-01']"), "click");
  await settle();
  assert.equal(a.vm.value, "2024-02");
  assert.equal(a.vm.open, false);
});

test("DatePicker preserves string values, Monday-first grids and original excluded-day callbacks", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026-11-07",
    min: "2026-11-01",
    max: "2026-11-30",
    disabledDate: (date) => date.getUTCDay() === 0,
  });
  await a.vm.show();
  assert.equal(
    new Date(
      popup().querySelector("[data-date]").dataset.date + "T00:00:00Z",
    ).getUTCDay(),
    1,
  );
  assert(date("2026-11-01").disabled);
  assert(!date("2026-11-09").disabled);
  await fire(date("2026-11-09"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11-09");
  assert.equal(a.events["value-change"].length, 1);
  assert(!popup());
});
test("DatePicker defaults are uncontrolled and clearable with named native values", async () => {
  const a = await mount(ui.HysDatePicker, {
    defaultValue: "2026-11-03",
    clearable: true,
    name: "day",
  });
  await a.vm.show();
  await fire(date("2026-11-05"), "click");
  await settle();
  assert.equal(a.vm.value, "2026-11-05");
  assert.equal(a.find("input[type=hidden]").value, "2026-11-05");
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.vm.value, "");
});
test("DatePicker Date and timestamp outputs retain the selected civil date and numeric zero", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: new Date(2026, 10, 3),
    valueType: "date",
  });
  await a.vm.show();
  await fire(date("2026-11-04"), "click");
  await settle();
  assert(a.props.modelValue instanceof Date);
  assert.equal(a.props.modelValue.getDate(), 4);
  const b = await mount(ui.HysDatePicker, {
    modelValue: 0,
    valueType: "timestamp",
  });
  assert.equal(b.vm.value, 0);
  assert.equal(
    b
      .find(".hys-ui-date-display")
      .textContent.includes(String(new Date(0).getFullYear())),
    true,
  );
  await b.vm.show();
  const next = new Date(0);
  next.setDate(next.getDate() + 1);
  const localDay = [next.getFullYear(), next.getMonth() + 1, next.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
  await fire(date(localDay), "click");
  await settle();
  assert.equal(typeof b.props.modelValue, "number");
});
test("DatePicker custom value and display formats parse strictly without overflow", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026/11/06",
    valueFormat: "YYYY/MM/DD",
    format: "DD.MM.YYYY",
    editable: true,
  });
  const input = a.find(".hys-ui-date-input");
  assert.equal(input.value, "06.11.2026");
  input.value = "31.02.2026";
  await fire(input, "input");
  await fire(input, "keydown", { key: "Enter" });
  await settle();
  assert.equal(a.props.modelValue, "2026/11/06");
  assert(a.find("[role=alert]"));
  input.value = "09.11.2026";
  await fire(input, "input");
  await fire(input, "keydown", { key: "Enter" });
  await settle();
  assert.equal(a.props.modelValue, "2026/11/09");
  assert(!a.find("[role=alert]"));
});
test("DatePicker year, month and quarter units select periods and keep bounded dates", async () => {
  for (const [type, value, next] of [
    ["year", "2026", "2027-01-01"],
    ["month", "2026-11", "2026-12-01"],
    ["quarter", "2026-Q3", "2026-10-01"],
  ]) {
    const a = await mount(ui.HysDatePicker, { type, modelValue: value });
    await a.vm.show();
    const cell = popup().querySelector('[data-period="' + next + '"]');
    assert(cell);
    await fire(cell, "click");
    await settle();
    assert.equal(
      a.props.modelValue,
      type === "year" ? "2027" : type === "month" ? "2026-12" : "2026-Q4",
    );
    a.unmount();
  }
});
test("DatePicker multiple dates stage, toggle, limit and confirm as one accepted change", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "dates",
    modelValue: ["2026-11-03"],
    maxDates: 2,
  });
  await a.vm.show();
  await fire(date("2026-11-04"), "click");
  assert.deepEqual(a.props.modelValue, ["2026-11-03"]);
  assert.equal(await a.vm.confirm(), true);
  assert.deepEqual(a.props.modelValue, ["2026-11-03", "2026-11-04"]);
  await a.vm.show();
  await fire(date("2026-11-05"), "click");
  assert.equal(a.events.invalid.at(-1)[0].reason, "limit");
  assert.deepEqual(a.props.modelValue, ["2026-11-03", "2026-11-04"]);
  a.vm.cancel();
  await settle();
  assert(!popup());
});
test("DatePicker week mode selects a week-start value and displays week numbers", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "week",
    modelValue: "2026-11-03",
  });
  await a.vm.show();
  assert(popup().querySelector(".hys-ui-date-week-number"));
  await fire(date("2026-11-12"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11-09");
  assert(a.find(".hys-ui-date-display").textContent.includes("W46"));
});
test("DateRangePicker uses one trigger, stages the first endpoint and normalizes a reversed selection", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["2026-11-01", "2026-11-05"],
  });
  assert.equal(a.all(".hys-ui-date-trigger").length, 1);
  await a.vm.show();
  await fire(date("2026-11-15"), "click");
  assert.deepEqual(a.props.modelValue, ["2026-11-01", "2026-11-05"]);
  await fire(date("2026-11-10"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, ["2026-11-10", "2026-11-15"]);
  assert(!popup());
});
test("DateRangePicker cancel and outside closing discard unfinished drafts", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["2026-11-01", "2026-11-05"],
    showConfirm: true,
  });
  await a.vm.show();
  await fire(date("2026-11-12"), "click");
  a.vm.cancel();
  assert.deepEqual(a.props.modelValue, ["2026-11-01", "2026-11-05"]);
  await a.vm.show();
  assert.equal(a.vm.draft[0].getDate(), 1);
  assert.equal(a.vm.draft[1].getDate(), 5);
  a.vm.hide();
  assert(!popup());
});
test("DateRangePicker validates length and continuous disabled-day boundaries", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["2026-11-02", "2026-11-04"],
    minRangeDays: 2,
    maxRangeDays: 5,
    rangeValidation: "continuous",
    disabledDate: (d) => d.getUTCDate() === 7,
  });
  assert.equal(await a.vm.setValue(["2026-11-06", "2026-11-09"]), false);
  assert.equal(await a.vm.setValue(["2026-11-01", "2026-11-20"]), false);
  assert.equal(await a.vm.setValue(["2026-11-03", "2026-11-05"]), true);
});
test("DateRangePicker supports open-ended ranges and protects locked endpoints from clear", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["2026-11-02", "2026-11-09"],
    disabled: [true, false],
    allowEmpty: [false, true],
    clearable: true,
  });
  await a.vm.show();
  assert.equal(
    popup().querySelector(".hys-ui-date-range-status button").disabled,
    true,
  );
  assert.equal(await a.vm.clear(), true);
  assert.deepEqual(a.props.modelValue, ["2026-11-02", ""]);
  assert.equal(await a.vm.setValue(["2026-11-03", "2026-11-10"]), false);
});
test("DatePicker datetime defaults, disabled time and confirmation preserve seconds", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026-11-03 08:15:00",
    showTime: true,
    disabledTime: () => ({ hours: [9] }),
  });
  await a.vm.show();
  await fire(date("2026-11-04"), "click");
  assert.equal(a.props.modelValue, "2026-11-03 08:15:00");
  assert.equal(await a.vm.confirm(), true);
  assert.equal(a.props.modelValue, "2026-11-04 08:15:00");
  assert.equal(await a.vm.setValue("2026-11-05 09:15:00"), false);
});
test("DatePicker controlled value and open requests may be refused without false acceptance", async () => {
  const api = ref(),
    events = [];
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysDatePicker, {
          ref: api,
          modelValue: "2026-11-03",
          open: false,
          "onUpdate:open": (v) => events.push(v),
        }),
    }),
  );
  assert.equal(await api.value.show(), false);
  assert(!popup());
  assert.deepEqual(events, [true]);
  assert.equal(await api.value.setValue("2026-11-04"), false);
  assert.equal(api.value.value, "2026-11-03");
});
test("DatePicker keyboard skips excluded days and crosses month boundaries", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026-11-30",
    disabledDate: (d) => d.getUTCDate() === 1,
  });
  await a.vm.show();
  await fire(date("2026-11-30"), "keydown", { key: "ArrowRight" });
  await settle();
  assert.equal(document.activeElement.dataset.date, "2026-12-02");
  await fire(document.activeElement, "keydown", { key: "Enter" });
  await settle();
  assert.equal(a.props.modelValue, "2026-12-02");
});
test("DatePicker quick year/month browsing can return through the heading without an extra button", async () => {
  const a = await mount(ui.HysDatePicker, { modelValue: "2026-11-03" });
  await a.vm.show();
  await fire(button("选择年份"), "click");
  assert(popup().querySelector(".hys-ui-date-view-year"));
  await fire(button("返回日期"), "click");
  assert(popup().querySelector(".hys-ui-date-view-date"));
  assert.equal(a.props.modelValue, "2026-11-03");
});
test("DatePicker shortcuts validate rules and custom cells receive original day metadata", async () => {
  const a = await mount(
    ui.HysDatePicker,
    {
      modelValue: "2026-11-03",
      shortcuts: [{ label: "Next", value: () => "2026-11-09" }],
      min: "2026-11-01",
    },
    { cell: (cell) => h("span", { class: "custom-day" }, cell.iso) },
  );
  await a.vm.show();
  assert(date("2026-11-03").textContent.includes("2026-11-03"));
  await fire(button("Next"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11-09");
});
test("DatePicker form inheritance, native names, accepted validation and disabled state remain linked", async () => {
  const model = reactive({ date: "" }),
    api = ref(),
    form = ref(),
    disabled = ref(false);
  let changed = 0;
  const a = await mount(
    defineComponent({
      setup: () => () =>
        h(
          ui.HysForm,
          { ref: form, model, size: "sm", disabled: disabled.value },
          () =>
            h(
              ui.HysFormItem,
              { label: "Date", prop: "date", rules: { required: true } },
              () =>
                h(ui.HysDatePicker, {
                  ref: api,
                  modelValue: model.date,
                  name: "date",
                  "onUpdate:modelValue": (v) => (model.date = v),
                  "onValue-change": () => changed++,
                }),
            ),
        ),
    }),
  );
  assert.equal(a.find("label").htmlFor, a.find(".hys-ui-date-trigger").id);
  assert.equal(await form.value.validate(), false);
  form.value.focusField("date");
  await settle();
  assert.equal(document.activeElement, a.find(".hys-ui-date-trigger"));
  assert.equal(
    a.find(".hys-ui-date-trigger").getAttribute("aria-required"),
    "true",
  );
  await api.value.show();
  await fire(
    date("2026-11-09") ?? popup().querySelector("[data-date]:not(:disabled)"),
    "click",
  );
  await settle();
  assert.equal(changed, 1);
  assert.equal(await form.value.validate(), true);
  assert(a.find(".hys-ui-date-picker-sm"));
  disabled.value = true;
  await settle();
  assert.equal(await api.value.show(), false);
  assert.equal(a.find(".hys-ui-date-trigger").disabled, true);
});
test("DatePicker cached-page leave clears portals and ignores inactive commands", async () => {
  const visible = ref(true),
    api = ref();
  const Cached = defineComponent({
    setup: () => () =>
      h(ui.HysDatePicker, { ref: api, defaultValue: "2026-11-03" }),
  });
  await mount(
    defineComponent({
      setup: () => () =>
        h(KeepAlive, null, {
          default: () => (visible.value ? h(Cached) : h("p", "Away")),
        }),
    }),
  );
  await api.value.show();
  visible.value = false;
  await settle();
  assert(!popup());
  assert.equal(await api.value.setValue("2026-11-04"), false);
  assert.equal(api.value.setMode("year"), false);
  visible.value = true;
  await settle();
  assert.equal(api.value.value, "2026-11-03");
  assert.equal(await api.value.show(), true);
});

test("DatePicker retains an inferred Date type after clearing to null", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: new Date(2026, 10, 3),
    clearable: true,
  });
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.props.modelValue, null);
  await a.vm.showMonth("2026-11-01");
  await fire(date("2026-11-09"), "click");
  await settle();
  assert(a.props.modelValue instanceof Date);
  assert.equal(a.props.modelValue.getDate(), 9);
});
test("DatePicker native form reset restores an uncontrolled default without a change event", async () => {
  const api = ref(),
    form = ref();
  await mount(
    defineComponent({
      setup: () => () =>
        h(
          "form",
          { ref: form },
          h(ui.HysDatePicker, {
            ref: api,
            defaultValue: "2026-11-03",
            name: "day",
          }),
        ),
    }),
  );
  assert.equal(await api.value.setValue("2026-11-09"), true);
  form.value.reset();
  await settle();
  assert.equal(api.value.value, "2026-11-03");
});
test("DatePicker periods remain selectable when a boundary falls inside the period", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "",
    type: "year",
    min: "2026-11-01",
    max: "2026-11-30",
    defaultPickerValue: "2026-11-01",
  });
  await a.vm.show();
  const cell = popup().querySelector('[data-period="2026-01-01"]');
  assert(!cell.disabled);
  await fire(cell, "click");
  await settle();
  assert.equal(a.props.modelValue, "2026");
});
test("DatePicker rejects malformed range and multi-value requests atomically", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["2026-11-03", "2026-11-09"],
  });
  assert.equal(
    await a.vm.setValue(["2026-11-03", "2026-11-09", "2026-11-10"]),
    false,
  );
  assert.equal(await a.vm.setValue(["2026-11-03", "2026-02-31"]), false);
  assert.deepEqual(a.props.modelValue, ["2026-11-03", "2026-11-09"]);
  const b = await mount(ui.HysDatePicker, {
    type: "dates",
    modelValue: ["2026-11-03"],
  });
  assert.equal(await b.vm.setValue(["2026-11-03", "invalid"]), false);
  assert.deepEqual(b.props.modelValue, ["2026-11-03"]);
});
test("DatePicker invalid navigation does not open and blur never affects an unrelated control", async () => {
  const a = await mount(ui.HysDatePicker, { modelValue: "2026-11-03" });
  assert.equal(await a.vm.showMonth("not-a-date"), false);
  assert(!popup());
  const external = document.createElement("input");
  document.body.append(external);
  external.focus();
  a.vm.blur();
  assert.equal(document.activeElement, external);
});
test("DatePicker English locale and semantic grid rows remain accessible", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026-11-03",
    locale: "en-US",
    firstDayOfWeek: 0,
    showWeekNumbers: true,
  });
  await a.vm.show();
  assert(button("Today"));
  assert.equal(popup().querySelectorAll("[role=grid] [role=row]").length, 6);
  assert.equal(
    new Date(
      popup().querySelector("[data-date]").dataset.date + "T00:00:00Z",
    ).getUTCDay(),
    0,
  );
});

test("DatePicker inline fields bind labels and focus the calendar instead of a navigation button", async () => {
  const form = ref(),
    model = reactive({ day: "2026-11-03" });
  const a = await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysForm, { ref: form, model }, () =>
          h(ui.HysFormItem, { prop: "day", label: "Inline date" }, () =>
            h(ui.HysDatePicker, {
              inline: true,
              modelValue: model.day,
              "onUpdate:modelValue": (v) => (model.day = v),
            }),
          ),
        ),
    }),
  );
  const managed = a.find(".hys-ui-date-picker[role=group]");
  assert(managed.hasAttribute("data-hys-ui-field-managed"));
  assert.equal(a.find("label").htmlFor, managed.id);
  form.value.focusField("day");
  await settle();
  assert.equal(document.activeElement.dataset.date, "2026-11-03");
});
test("DatePicker default times initialize a new value and invalid drafts explain disabled confirmation", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "",
    showTime: true,
    defaultTime: "10:15:30",
    defaultPickerValue: "2026-11-01",
  });
  await a.vm.show();
  await fire(date("2026-11-05"), "click");
  assert.equal(await a.vm.confirm(), true);
  assert.equal(a.props.modelValue, "2026-11-05 10:15:30");
  a.props.disabledTime = () => ({ hours: [10] });
  await a.vm.show();
  assert(button("确定").disabled);
  assert(popup().querySelector("[role=alert]"));
});
test("DateRangePicker partial labels retain the position of the missing endpoint", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    modelValue: ["", "2026-11-09"],
    allowEmpty: [true, false],
  });
  const text = a.find(".hys-ui-date-display").textContent;
  assert(text.includes("开始日期"));
  assert(text.includes(" 至 2026-11-09"));
});

test("DatePicker programmatic panel modes still commit the configured date unit", async () => {
  const a = await mount(ui.HysDatePicker, {
    modelValue: "2026-11",
    type: "month",
  });
  await a.vm.show();
  assert.equal(a.vm.setMode("date"), true);
  await settle();
  await fire(date("2026-11-09"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11");
  assert(!popup());
  const b = await mount(ui.HysDatePicker, {
    modelValue: "2026-11-03",
    type: "date",
  });
  await b.vm.show();
  assert.equal(b.vm.setMode("quarter"), true);
  await settle();
  await fire(popup().querySelector('[data-period="2026-10-01"]'), "click");
  await settle();
  assert(popup().querySelector(".hys-ui-date-view-month"));
  assert.equal(b.props.modelValue, "2026-11-03");
});

test("Weekly selection reports complete ISO week metadata and selects from a week number", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "week",
    modelValue: "2026-11-02",
  });
  await a.vm.show();
  const button = [
    ...popup().querySelectorAll(".hys-ui-date-week-number button"),
  ].find((el) => el.getAttribute("aria-label").includes("2026-11-09"));
  await fire(button, "click");
  await settle();
  assert.equal(a.props.modelValue, "2026-11-09");
  const info = a.events.change.at(-1)[1].weeks[0];
  assert.equal(info.year, 2026);
  assert.equal(info.week, 46);
  assert.equal(info.start, "2026-11-09");
  assert.equal(info.end, "2026-11-15");
  assert.equal(info.dates.length, 7);
});
test("Multiple week selection toggles a whole week and confirms without duplicate days", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "weeks",
    modelValue: ["2026-11-02"],
    maxDates: 2,
  });
  await a.vm.show();
  await fire(date("2026-11-12"), "click");
  assert.deepEqual(a.props.modelValue, ["2026-11-02"]);
  await fire(date("2026-11-13"), "click");
  await a.vm.confirm();
  assert.deepEqual(a.props.modelValue, ["2026-11-02"]);
  await a.vm.show();
  await fire(date("2026-11-12"), "click");
  await fire(date("2026-11-19"), "click");
  assert.equal(a.events.invalid.at(-1)[0].reason, "limit");
  await a.vm.confirm();
  assert.deepEqual(a.props.modelValue, ["2026-11-02", "2026-11-09"]);
  assert.equal(a.events.change.at(-1)[1].weeks.length, 2);
});
test("Week-year formatting and input parsing round trip across New Year and reject missing week 53", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "week",
    modelValue: "2020-W53",
    valueFormat: "GGGG-[W]WW",
    format: "GGGG 年第 WW 周",
    editable: true,
  });
  await a.vm.show();
  assert(date("2021-01-01").getAttribute("aria-selected") === "true");
  assert.equal(await a.vm.setValue("2021-W53"), false);
  assert.equal(a.props.modelValue, "2020-W53");
  assert.equal(await a.vm.setValue("2021-W01"), true);
  assert(a.find(".hys-ui-date-input").value.includes("2021 年第 01 周"));
});
test("Custom first-day and first-week rules keep display, parsing and metadata consistent", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "week",
    modelValue: "2027-W01",
    valueFormat: "GGGG-[W]WW",
    firstDayOfWeek: 0,
    firstWeekContainsDate: 1,
  });
  await a.vm.show();
  assert.equal(date("2026-12-27").getAttribute("aria-selected"), "true");
  await fire(date("2027-01-06"), "click");
  await settle();
  assert.equal(a.props.modelValue, "2027-W02");
  const info = a.events.change.at(-1)[1].weeks[0];
  assert.equal(info.start, "2027-01-03");
  assert.equal(info.end, "2027-01-09");
  assert.equal(info.year, 2027);
});
test("Whole-week validation applies consistently to panel, shortcuts and instance updates", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "week",
    modelValue: "2026-11-09",
    min: "2026-11-03",
    max: "2026-11-27",
    weekValidation: "full",
    disabledWeek: (week) => week.start === "2026-11-16",
  });
  await a.vm.show();
  assert(date("2026-11-04").disabled);
  assert(!date("2026-11-10").disabled);
  assert(date("2026-11-18").disabled);
  assert(date("2026-11-24").disabled);
  assert.equal(await a.vm.setValue("2026-11-02"), false);
  assert.equal(await a.vm.setValue("2026-11-16"), false);
  a.props.weekValidation = "any";
  await settle();
  assert(!date("2026-11-02").disabled);
  assert.equal(await a.vm.setValue("2026-11-02"), true);
});
test("Week range reports inclusive covered dates while keeping week-start endpoints", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    type: "week",
    modelValue: ["2026-11-02", "2026-11-09"],
  });
  await a.vm.show();
  await fire(date("2026-11-25"), "click");
  await fire(date("2026-11-10"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, ["2026-11-09", "2026-11-23"]);
  const weeks = a.events.change.at(-1)[1].weeks;
  assert.equal(weeks[0].start, "2026-11-09");
  assert.equal(weeks[1].end, "2026-11-29");
});
test("Week-number formatter and slot receive the configured week year and full range", async () => {
  const a = await mount(
    ui.HysDatePicker,
    {
      type: "week",
      modelValue: "2026-12-28",
      weekNumberFormatter: (week) => "W" + week.week,
    },
    {
      "week-number": (week) =>
        h(
          "span",
          { "data-week-year": week.year },
          week.start + " / " + week.week,
        ),
    },
  );
  await a.vm.show();
  assert(popup().querySelector('[data-week-year="2026"]'));
  assert(
    popup()
      .querySelector(".hys-ui-date-week-number")
      .textContent.includes(" / "),
  );
});

test("Week range limits count full weeks and continuous validation checks the final week", async () => {
  const a = await mount(ui.HysDateRangePicker, {
    type: "week",
    modelValue: ["2026-11-02", "2026-11-09"],
    minRangeDays: 14,
    maxRangeDays: 21,
    weekValidation: "full",
    rangeValidation: "continuous",
    disabledWeek: (week) => week.start === "2026-11-16",
  });
  assert.equal(await a.vm.setValue(["2026-11-02", "2026-11-02"]), false);
  assert.equal(await a.vm.setValue(["2026-11-09", "2026-11-23"]), false);
  a.props.disabledWeek = undefined;
  await settle();
  assert.equal(await a.vm.setValue(["2026-11-09", "2026-11-16"]), true);
  a.props.disabledDate = (date) =>
    date.toISOString().slice(0, 10) === "2026-11-20";
  await settle();
  assert.equal(await a.vm.setValue(["2026-11-02", "2026-11-16"]), false);
});

test("Week APIs normalize arbitrary weekdays and deduplicate whole weeks before limits", async () => {
  const a = await mount(ui.HysDatePicker, {
    type: "weeks",
    modelValue: [],
    maxDates: 2,
  });
  assert.equal(
    await a.vm.setValue(["2026-11-03", "2026-11-05", "2026-11-10"]),
    true,
  );
  assert.deepEqual(a.props.modelValue, ["2026-11-02", "2026-11-09"]);
  assert.equal(a.events.change.at(-1)[1].weeks.length, 2);
});
