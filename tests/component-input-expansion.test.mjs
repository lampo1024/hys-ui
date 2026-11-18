import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const name of [
  "window", "document", "navigator", "Node", "Element", "HTMLElement",
  "HTMLInputElement", "HTMLFormElement", "SVGElement", "Event", "FocusEvent",
  "KeyboardEvent", "MouseEvent", "DOMRect", "MutationObserver",
]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
HTMLElement.prototype.scrollIntoView = function () {};
HTMLElement.prototype.getBoundingClientRect = () => new DOMRect(80, 40, 180, 35);
HTMLElement.prototype.getClientRects = function () { return [this.getBoundingClientRect()]; };

const { createApp, h, nextTick, reactive } = await import("vue");
const {
  HysDateTimePicker, HysStepForm, HysTimePicker, provideHysConfig,
} = await import("../packages/ui/dist/index.js");
const { keyValueFromText } = await import("../packages/ui/dist/components/HysKeyValueEditor/keyValueData.js");

let app;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});
async function mount(render) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({ setup() { provideHysConfig({ motion: "off" }); return render; } });
  app.mount(host);
  await nextTick();
  return host;
}
function button(label) {
  const match = [...document.querySelectorAll("button")].find(node => node.textContent.trim() === label);
  assert.ok(match, "Could not find " + label);
  return match;
}
async function until(predicate, message) {
  for (let attempt = 0; attempt < 40; attempt++) {
    await nextTick();
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 8));
  }
  assert.fail(message);
}

test("DateTimePicker validates editable input and uses minute-precision 12-hour display", async () => {
  const state = reactive({ value: "2026-11-18 14:30:00", invalid: [] });
  const host = await mount(() => h(HysDateTimePicker, {
    modelValue: state.value,
    "onUpdate:modelValue": value => { state.value = value; },
    onInvalid: info => { state.invalid.push(info.reason); },
    showConfirm: false,
    showSeconds: false,
    use12Hours: true,
    min: new Date(2026, 10, 18, 9),
    max: new Date(2026, 10, 18, 18),
  }));
  const input = host.querySelector("input:not([type=hidden])");
  assert.ok(input);
  assert.equal(input.readOnly, false);
  assert.equal(input.value, "2026-11-18 02:30 PM");
  function edit(value) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }
  edit("2026-11-18 08:00 PM");
  await until(() => state.invalid.length, "Didn't validate the out-of-hours text");
  assert.equal(state.value, "2026-11-18 14:30:00");
  edit("2026-11-18 04:00 PM");
  await until(() => state.value === "2026-11-18 16:00:00", "Didn't publish validated canonical time");
});

test("StepForm restores a saved target even when restoring values removes the current conditional step", async () => {
  const state = reactive({ current: 1, values: { managed: true, name: "original" } });
  const steps = [
    "账户",
    { title: "代理人", when: model => model.managed },
    "复核",
  ];
  const host = await mount(() => h(HysStepForm, {
    current: state.current,
    model: state.values,
    steps,
    jumpToVisited: true,
    loadDraft: async () => ({ step: 0, values: { managed: false, name: "restored" } }),
    "onUpdate:current": current => { state.current = current; },
    onRestoreDraft: ({ values }) => { state.values = values; },
  }, { default: ({ step }) => h("p", [
    "步骤 " + step + " " + state.values.name,
  ]) }));
  assert.match(host.textContent, /步骤 1 original/);
  button("恢复草稿").click();
  await until(() => state.current === 0, "Didn't restore step 0");
  assert.match(host.textContent, /步骤 0 restored/);
  assert.doesNotMatch(host.textContent, /代理人/);
  assert.match(host.textContent, /已恢复草稿/);
});

test("TimePicker treats the stored and shortcut times as canonical even with a clock-like formatter", async () => {
  const state = reactive({ value: "08:15" });
  const host = await mount(() => h(HysTimePicker, {
    modelValue: state.value,
    "onUpdate:modelValue": value => { state.value = value; },
    formatter: value => value === "08:15" ? "17:30" : value,
    presets: [{ label: "晚班", value: "17:30" }],
  }));
  const input = host.querySelector("input");
  assert.equal(input.value, "17:30");
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  await until(
    () => document.querySelector('[data-time-option="0-8"][aria-selected=true]'),
    "The panel did not show the stored time",
  );
  button("晚班").click();
  await until(() => state.value === "17:30", "The preset was reinterpreted as the displayed time");
});

test("KeyValueEditor rejects unsafe JSON numbers even inside nested values", () => {
  assert.throws(() => keyValueFromText('{"array":[9007199254740993]}', "json"), /安全范围/);
  assert.deepEqual(keyValueFromText('{"array":[9007199254740991]}', "json"), {
    array: [9007199254740991],
  });
});
