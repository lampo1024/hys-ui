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
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
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
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  mounts = new Set();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  settle = async () => {
    await nextTick();
    await pause(0);
    await nextTick();
  };
async function mount(Component, values = {}, slots = {}, accept = true) {
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
        if (accept && name.startsWith("update:"))
          props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(Component, { ...props, ...listeners, ref: element }, slots);
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
  await settle();
  return item;
}
const click = async (el) => {
    el.click();
    await settle();
  },
  key = async (el, key) => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
    await settle();
  };
afterEach(async () => {
  for (const item of [...mounts]) item.unmount();
  await settle();
  document.body.innerHTML = "";
});
test("Group classes and layout styles apply directly to their semantic root", async () => {
  for (const [Component, role] of [
    [ui.HysRadioGroup, "radiogroup"],
    [ui.HysCheckboxGroup, "group"],
  ]) {
    const entry = await mount(Component, {
        options: ["a", "b"],
        class: "host-choice",
        style: { gap: "30px" },
        id: "host-choice-id",
      }),
      node = entry.find("[role=" + role + "]");
    assert.equal(node, entry.host.firstElementChild);
    assert(node.classList.contains("host-choice"));
    assert.equal(node.style.gap, "30px");
    assert.equal(node.id, "host-choice-id");
    assert.equal(entry.all("#host-choice-id").length, 1);
    entry.unmount();
  }
});

test("Checkbox supports uncontrolled defaults, scalar mappings and exact array values", async () => {
  const entry = await mount(ui.HysCheckbox, {
    defaultValue: "off",
    trueValue: "on",
    falseValue: "off",
    label: "Consent",
  });
  assert.equal(entry.vm.checked, false);
  await click(entry.find("input"));
  assert.equal(entry.props.modelValue, "on");
  assert.equal(entry.vm.checked, true);
  await click(entry.find("input"));
  assert.equal(entry.props.modelValue, "off");
  entry.unmount();
  const array = await mount(ui.HysCheckbox, { modelValue: [1], value: "1" });
  await click(array.find("input"));
  assert.deepEqual(array.props.modelValue, [1, "1"]);
  await click(array.find("input"));
  assert.deepEqual(array.props.modelValue, [1]);
});
test("Checkbox change-only consumers remain compatible and vetoed native values are restored", async () => {
  const state = ref(false),
    Wrapper = defineComponent({
      setup: () => () =>
        h(ui.HysCheckbox, {
          modelValue: state.value,
          onChange: (value) => (state.value = value),
        }),
    }),
    entry = await mount(Wrapper);
  await click(entry.find("input"));
  assert.equal(state.value, true);
  entry.unmount();
  const veto = await mount(ui.HysCheckbox, { modelValue: false }, {}, false);
  await click(veto.find("input"));
  assert.equal(veto.find("input").checked, false);
  assert.deepEqual(veto.events.change, [[true]]);
  assert.equal(veto.vm.checked, false);
});
test("Mixed checkboxes retain readonly semantics, native identity and custom icons", async () => {
  const entry = await mount(
    ui.HysCheckbox,
    {
      defaultValue: false,
      indeterminate: true,
      readonly: true,
      id: "consent",
      ariaLabel: "Consent",
      error: "Check consent",
    },
    {
      icon: ({ indeterminate }) => h("b", indeterminate ? "Mixed" : "Selected"),
    },
  );
  assert.equal(entry.find("input").id, "consent");
  assert.equal(entry.find("input").getAttribute("aria-checked"), "mixed");
  assert.equal(entry.find("b").textContent, "Mixed");
  assert(
    document.getElementById(
      entry.find("input").getAttribute("aria-describedby"),
    ),
  );
  await click(entry.find("input"));
  assert.equal(entry.events.change, undefined);
  entry.vm.focus();
  assert.equal(document.activeElement, entry.find("input"));
});
test("CheckboxGroup distinguishes number/string/boolean options and filters duplicate records", async () => {
  const entry = await mount(ui.HysCheckboxGroup, {
    options: [1, "1", false, { label: "One duplicate", value: 1 }],
    defaultValue: [],
  });
  assert.equal(entry.all("input[type=checkbox]").length, 3);
  for (const el of entry.all("input[type=checkbox]")) await click(el);
  assert.deepEqual(entry.props.modelValue, [1, "1", false]);
  assert.equal(entry.vm.allChecked, true);
  assert.equal(entry.vm.indeterminate, false);
  await entry.vm.clear();
  await settle();
  assert.deepEqual(entry.props.modelValue, []);
});
test("CheckboxGroup maps business fields, supports disabled values and preserves unknown selections", async () => {
  const entry = await mount(ui.HysCheckboxGroup, {
    modelValue: ["fixed", "unloaded"],
    options: [
      { id: "a", title: "Alpha" },
      { id: "fixed", title: "Locked", locked: true },
    ],
    fieldNames: { value: "id", label: "title", disabled: "locked" },
    name: "members",
  });
  assert.equal(entry.all("input[type=checkbox]")[1].disabled, true);
  await entry.vm.checkAll();
  assert.deepEqual(entry.props.modelValue, ["fixed", "unloaded", "a"]);
  await entry.vm.clear();
  assert.deepEqual(entry.props.modelValue, ["fixed", "unloaded"]);
  assert.equal(await entry.vm.toggle("missing"), false);
  assert.equal(entry.vm.allChecked, false);
});
test("CheckboxGroup min/max limits, bulk actions and contradictory ranges are stable", async () => {
  const entry = await mount(ui.HysCheckboxGroup, {
    options: ["a", "b", "c"],
    modelValue: ["a"],
    min: 1,
    max: 2,
  });
  assert.equal(await entry.vm.toggle("a", false), false);
  assert.equal(entry.events.reject.at(-1)[0].reason, "min");
  await entry.vm.checkAll();
  assert.deepEqual(entry.props.modelValue, ["a", "b"]);
  assert.equal(await entry.vm.toggle("c", true), false);
  assert.equal(entry.events.reject.at(-1)[0].reason, "max");
  await entry.vm.clear();
  assert.equal(entry.props.modelValue.length, 1);
  entry.props.min = 3;
  entry.props.max = 1;
  await settle();
  assert.equal(await entry.vm.toggle("b", true), false);
  assert.equal(entry.events.reject.at(-1)[0].reason, "range");
  assert.equal(entry.find("[role=group]").getAttribute("aria-invalid"), "true");
});
test("Slot checkbox groups register dynamic children and exclude readonly entries from bulk actions", async () => {
  const show = ref(true),
    state = ref(["fixed"]),
    api = ref(),
    Wrapper = defineComponent({
      setup: () => () =>
        h(
          ui.HysCheckboxGroup,
          {
            ref: api,
            modelValue: state.value,
            "onUpdate:modelValue": (value) => (state.value = value),
          },
          () => [
            h(ui.HysCheckbox, {
              value: "fixed",
              label: "Fixed",
              readonly: true,
            }),
            show.value
              ? h(ui.HysCheckbox, { value: "dynamic", label: "Dynamic" })
              : null,
          ],
        ),
    }),
    entry = await mount(Wrapper);
  await api.value.checkAll();
  assert.deepEqual(state.value, ["fixed", "dynamic"]);
  await api.value.clear();
  assert.deepEqual(state.value, ["fixed"]);
  show.value = false;
  await settle();
  assert.equal(entry.all("input[type=checkbox]").length, 1);
  assert.equal(await api.value.toggle("dynamic"), false);
});
test("CheckboxGroup selection summaries survive disabled and readonly states", async () => {
  const entry = await mount(ui.HysCheckboxGroup, {
    options: ["a", "b"],
    modelValue: ["a", "b"],
  });
  assert.equal(entry.vm.allChecked, true);
  entry.props.disabled = true;
  await settle();
  assert.equal(entry.vm.allChecked, true);
  assert.equal(await entry.vm.clear(), false);
  entry.props.disabled = false;
  entry.props.readonly = true;
  await settle();
  assert.equal(entry.vm.allChecked, true);
  assert.equal(await entry.vm.toggle("a"), false);
});
test("CheckboxGroup controlled veto restores checked DOM and focus methods skip unavailable choices", async () => {
  const entry = await mount(
    ui.HysCheckboxGroup,
    {
      modelValue: [],
      options: [{ value: "a", label: "Alpha", disabled: true }, "b"],
    },
    {},
    false,
  );
  await click(entry.all("input[type=checkbox]")[1]);
  assert.deepEqual(entry.props.modelValue, []);
  assert.equal(entry.all("input[type=checkbox]")[1].checked, false);
  entry.vm.focus("a");
  assert.equal(document.activeElement, entry.all("input[type=checkbox]")[1]);
  entry.vm.blur();
  assert.notEqual(document.activeElement, entry.all("input[type=checkbox]")[1]);
});
test("Radio supports false/zero values and standalone controlled rejection", async () => {
  const entry = await mount(ui.HysRadio, {
    value: false,
    modelValue: null,
    label: "False",
  });
  assert.equal(entry.vm.checked, false);
  await click(entry.find("input"));
  assert.equal(entry.props.modelValue, false);
  assert.equal(entry.vm.checked, true);
  entry.unmount();
  const veto = await mount(
    ui.HysRadio,
    { value: 0, modelValue: null },
    {},
    false,
  );
  await click(veto.find("input"));
  assert.equal(veto.find("input").checked, false);
});
test("RadioGroup keyboard uses one tab stop, skips disabled items and loops", async () => {
  const entry = await mount(ui.HysRadioGroup, {
      modelValue: 1,
      options: [1, { label: "Disabled", value: 2, disabled: true }, 3],
      name: "numbers",
    }),
    inputs = entry.all("input");
  assert.deepEqual(
    inputs.map((el) => el.tabIndex),
    [0, -1, -1],
  );
  inputs[0].focus();
  await key(inputs[0], "ArrowRight");
  assert.equal(entry.props.modelValue, 3);
  assert.equal(document.activeElement, inputs[2]);
  await key(inputs[2], "ArrowRight");
  assert.equal(entry.props.modelValue, 1);
  await key(inputs[0], "End");
  assert.equal(entry.props.modelValue, 3);
  await key(inputs[2], "Home");
  assert.equal(entry.props.modelValue, 1);
});
test("RadioGroup restores native peer checks on rejection, supports boolean values and explicit clearing", async () => {
  const entry = await mount(
    ui.HysRadioGroup,
    { modelValue: false, options: [false, true] },
    {},
    false,
  );
  await click(entry.all("input")[1]);
  assert.deepEqual(
    entry.all("input").map((el) => el.checked),
    [true, false],
  );
  entry.unmount();
  const normal = await mount(ui.HysRadioGroup, {
    defaultValue: false,
    options: [false, true],
  });
  await normal.vm.select(true);
  assert.equal(normal.props.modelValue, true);
  normal.props.modelValue = null;
  await settle();
  assert.equal(normal.props.modelValue, null);
  assert(normal.all("input").every((el) => !el.checked));
});
test("Radio groups accept composed children, field mappings, button variants and dynamic empty data", async () => {
  const entry = await mount(
    ui.HysRadioGroup,
    {
      options: [
        { id: 0, title: "Zero" },
        { id: 1, title: "One" },
      ],
      fieldNames: { value: "id", label: "title" },
      type: "button",
      buttonStyle: "solid",
      block: true,
    },
    { label: ({ option }) => h("strong", option.label) },
  );
  assert.equal(entry.all(".hys-ui-radio-button").length, 2);
  assert.equal(entry.all("strong").length, 2);
  await click(entry.all("input")[0]);
  assert.equal(entry.props.modelValue, 0);
  entry.props.options = [];
  await settle();
  assert.equal(entry.all("input").length, 0);
  assert(entry.host.textContent.includes("暂无选项"));
  assert.equal(entry.props.modelValue, 0);
});
test("Composed radios inherit group state and preserve identity across keyed option reordering", async () => {
  const reverse = ref(false),
    state = ref("a"),
    Wrapper = defineComponent({
      setup: () => () =>
        h(
          ui.HysRadioGroup,
          {
            modelValue: state.value,
            "onUpdate:modelValue": (value) => (state.value = value),
            size: "sm",
            type: "button",
          },
          () =>
            (reverse.value ? ["c", "b", "a"] : ["a", "b", "c"]).map((value) =>
              h(ui.HysRadio, { key: value, value, label: value }),
            ),
        ),
    }),
    entry = await mount(Wrapper);
  assert(entry.find(".hys-ui-radio-sm"));
  reverse.value = true;
  await settle();
  const a = entry.all("input").find((el) => el.value === "a");
  a.focus();
  await key(a, "Home");
  assert.equal(state.value, "c");
});
test("Switch supports custom values, loading/readonly restrictions and change-only consumers", async () => {
  const entry = await mount(ui.HysSwitch, {
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  });
  await click(entry.find("button"));
  assert.equal(entry.props.modelValue, 1);
  assert.equal(entry.find("button").getAttribute("aria-checked"), "true");
  entry.props.readonly = true;
  await settle();
  await click(entry.find("button"));
  assert.equal(entry.props.modelValue, 1);
  entry.unmount();
  const value = ref(false),
    Wrapper = defineComponent({
      setup: () => () =>
        h(ui.HysSwitch, {
          modelValue: value.value,
          onChange: (next) => (value.value = next),
        }),
    }),
    legacy = await mount(Wrapper);
  await click(legacy.find("button"));
  assert.equal(value.value, true);
});
test("Switch async guards run once, block duplicates and reject or fail without changing values", async () => {
  let resolve,
    calls = 0;
  const entry = await mount(ui.HysSwitch, {
    modelValue: false,
    beforeChange: () => {
      calls++;
      return new Promise((done) => (resolve = done));
    },
  });
  entry.find("button").click();
  await settle();
  assert.equal(entry.vm.pending, true);
  await entry.vm.toggle();
  assert.equal(calls, 1);
  resolve(false);
  await settle();
  assert.equal(entry.props.modelValue, false);
  assert.equal(entry.vm.pending, false);
  entry.props.beforeChange = () => {
    throw new Error("Denied");
  };
  await settle();
  assert.equal(await entry.vm.toggle(), false);
  assert.equal(entry.events.error[0][0].message, "Denied");
  assert.equal(entry.events.change, undefined);
});
test("Switch passes a cancellation signal and discards stale results after external updates", async () => {
  let resolve, signal;
  const entry = await mount(ui.HysSwitch, {
    modelValue: "off",
    activeValue: "on",
    inactiveValue: "off",
    beforeChange: (next, current, context) => {
      assert.equal(next, "on");
      assert.equal(current, "off");
      signal = context.signal;
      return new Promise((done) => (resolve = done));
    },
  });
  entry.find("button").click();
  await settle();
  entry.props.modelValue = "server";
  await settle();
  assert(signal.aborted);
  resolve(true);
  await settle();
  assert.equal(entry.props.modelValue, "server");
  assert.equal(entry.events.change, undefined);
  assert.equal(entry.vm.pending, false);
});
test("Switch native values remain host-owned when a controlled update is vetoed", async () => {
  const entry = await mount(ui.HysSwitch, { modelValue: false }, {}, false);
  assert.equal(await entry.vm.toggle(), false);
  assert.equal(entry.find("button").getAttribute("aria-checked"), "false");
  assert.deepEqual(entry.events.change, [[true]]);
});
test("Choice controls inherit form sizes, labels, errors and reset cancellation", async () => {
  let finish, signal;
  const data = reactive({
      agree: false,
      roles: [],
      team: null,
      enabled: false,
    }),
    form = ref(),
    Wrapper = defineComponent({
      setup: () => () =>
        h(
          ui.HysForm,
          {
            model: data,
            ref: form,
            size: "lg",
            rules: {
              roles: {
                type: "array",
                required: true,
                min: 1,
                message: "Choose a role",
              },
            },
          },
          () => [
            h(ui.HysFormItem, { prop: "agree", label: "Consent" }, () =>
              h(ui.HysCheckbox, {
                modelValue: data.agree,
                "onUpdate:modelValue": (v) => (data.agree = v),
              }),
            ),
            h(ui.HysFormItem, { prop: "roles", label: "Roles" }, () =>
              h(ui.HysCheckboxGroup, {
                modelValue: data.roles,
                "onUpdate:modelValue": (v) => (data.roles = v),
                options: ["a", "b"],
              }),
            ),
            h(ui.HysFormItem, { prop: "team", label: "Team" }, () =>
              h(ui.HysRadioGroup, {
                modelValue: data.team,
                "onUpdate:modelValue": (v) => (data.team = v),
                options: ["dev", "qa"],
              }),
            ),
            h(ui.HysFormItem, { prop: "enabled", label: "Enabled" }, () =>
              h(ui.HysSwitch, {
                modelValue: data.enabled,
                "onUpdate:modelValue": (v) => (data.enabled = v),
                beforeChange: (_next, _current, context) => {
                  signal = context.signal;
                  return new Promise((resolve) => (finish = resolve));
                },
              }),
            ),
          ],
        ),
    }),
    entry = await mount(Wrapper);
  assert(entry.find(".hys-ui-checkbox-lg"));
  assert(entry.find(".hys-ui-switch-lg"));
  assert.equal(
    entry.find("[role=switch]").getAttribute("aria-label"),
    "Enabled",
  );
  await form.value.validate();
  await settle();
  assert.equal(entry.find("[role=group]").getAttribute("aria-invalid"), "true");
  entry.find("[role=switch]").click();
  await settle();
  await form.value.resetFields();
  await settle();
  assert(signal.aborted);
  finish(true);
  await settle();
  assert.equal(data.enabled, false);
  assert.notEqual(
    entry.find("[role=group]").getAttribute("aria-invalid"),
    "true",
  );
});
test("Native form reset restores uncontrolled defaults and can be cancelled", async () => {
  const Wrapper = defineComponent({ setup: () => () => h("form", () => null) });
  const entry = await mount(
    defineComponent({
      setup: () => () =>
        h("form", [
          h(ui.HysCheckbox, { defaultValue: true, name: "agree" }),
          h(ui.HysRadioGroup, {
            defaultValue: "a",
            options: ["a", "b"],
            name: "team",
          }),
          h(ui.HysSwitch, {
            defaultValue: "on",
            activeValue: "on",
            inactiveValue: "off",
            name: "enabled",
          }),
        ]),
    }),
  );
  await click(entry.find("input[type=checkbox]"));
  await click(entry.all("input[type=radio]")[1]);
  await click(entry.find("[role=switch]"));
  entry.find("form").reset();
  await settle();
  assert.equal(entry.find("input[type=checkbox]").checked, true);
  assert.equal(entry.all("input[type=radio]")[0].checked, true);
  assert.equal(
    entry.find("[role=switch]").getAttribute("aria-checked"),
    "true",
  );
  entry
    .find("form")
    .addEventListener("reset", (event) => event.preventDefault());
  await click(entry.find("input[type=checkbox]"));
  entry.find("form").reset();
  await settle();
  assert.equal(entry.find("input[type=checkbox]").checked, false);
});
test("Native submission has one value per selection and omits disabled choices", async () => {
  const entry = await mount(
      defineComponent({
        setup: () => () =>
          h("form", [
            h(ui.HysCheckboxGroup, {
              modelValue: ["a", "b"],
              options: ["a", { label: "Disabled", value: "b", disabled: true }],
              name: "roles",
            }),
            h(ui.HysRadioGroup, {
              modelValue: 0,
              options: [0, 1],
              name: "team",
            }),
            h(ui.HysSwitch, { modelValue: false, name: "enabled" }),
          ]),
      }),
    ),
    form = new window.FormData(entry.find("form"));
  assert.deepEqual(form.getAll("roles"), ["a"]);
  assert.equal(form.get("team"), "0");
  assert.equal(form.get("enabled"), "false");
});
test("Cached-page deactivation aborts switch guards and unregisters choice children", async () => {
  let finish, signal;
  const visible = ref(true),
    api = ref(),
    Wrapper = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, () =>
          visible.value
            ? h(ui.HysSwitch, {
                ref: api,
                modelValue: false,
                beforeChange: (_n, _c, context) => {
                  signal = context.signal;
                  return new Promise((resolve) => (finish = resolve));
                },
              })
            : h("div", "Other"),
        ),
    }),
    entry = await mount(Wrapper);
  entry.find("button").click();
  await settle();
  visible.value = false;
  await settle();
  assert(signal.aborted);
  finish(true);
  await settle();
  visible.value = true;
  await settle();
  assert.equal(
    entry.find("[role=switch]").getAttribute("aria-checked"),
    "false",
  );
  assert.equal(api.value.pending, false);
});
test("Standalone controlled radio peers reconcile native checks when a host vetoes selection", async () => {
  const entry = await mount(
    defineComponent({
      setup: () => () =>
        h("div", [
          h(ui.HysRadio, { modelValue: "a", value: "a", name: "peers" }),
          h(ui.HysRadio, { modelValue: "a", value: "b", name: "peers" }),
        ]),
    }),
  );
  await click(entry.all("input")[1]);
  assert.deepEqual(
    entry.all("input").map((el) => el.checked),
    [true, false],
  );
});
test("Switch cancellation cannot clear a newer pending request", async () => {
  const pending = [],
    entry = await mount(ui.HysSwitch, {
      modelValue: false,
      beforeChange: (_next, _current, { signal }) =>
        new Promise((resolve) => pending.push({ signal, resolve })),
    });
  entry.find("button").click();
  await settle();
  entry.props.disabled = true;
  await settle();
  entry.props.disabled = false;
  await settle();
  entry.find("button").click();
  await settle();
  assert.equal(pending.length, 2);
  pending[0].resolve(true);
  await settle();
  assert.equal(entry.vm.pending, true);
  assert.equal(entry.props.modelValue, false);
  pending[1].resolve(true);
  await settle();
  assert.equal(entry.props.modelValue, true);
  assert.equal(entry.vm.pending, false);
});
test("External native form association resets active controls and detaches while cached", async () => {
  const form = document.createElement("form");
  form.id = "external";
  document.body.append(form);
  const visible = ref(true),
    Wrapper = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, () =>
          visible.value
            ? h(ui.HysCheckbox, {
                defaultValue: true,
                name: "external-choice",
                form: "external",
              })
            : h("div", "Other"),
        ),
    }),
    entry = await mount(Wrapper);
  await click(entry.find("input"));
  assert.equal(new window.FormData(form).get("external-choice"), null);
  visible.value = false;
  await settle();
  form.reset();
  await settle();
  visible.value = true;
  await settle();
  assert.equal(entry.find("input").checked, false);
  form.reset();
  await settle();
  assert.equal(entry.find("input").checked, true);
  assert.equal(new window.FormData(form).get("external-choice"), "on");
});
test("Required radio groups apply native constraints to composed children", async () => {
  const entry = await mount(
    defineComponent({
      setup: () => () =>
        h(
          "form",
          h(
            ui.HysRadioGroup,
            { required: true, name: "required-choice" },
            () => [
              h(ui.HysRadio, { value: "a", label: "A" }),
              h(ui.HysRadio, { value: "b", label: "B" }),
            ],
          ),
        ),
    }),
  );
  assert.equal(entry.find("form").checkValidity(), false);
  await click(entry.all("input")[1]);
  assert.equal(entry.find("form").checkValidity(), true);
});
test("Radio keyboard selection also notifies the selected child", async () => {
  const value = ref("a"),
    changes = [],
    Wrapper = defineComponent({
      setup: () => () =>
        h(
          ui.HysRadioGroup,
          {
            modelValue: value.value,
            "onUpdate:modelValue": (next) => (value.value = next),
          },
          () => [
            h(ui.HysRadio, { value: "a", label: "A" }),
            h(ui.HysRadio, {
              value: "b",
              label: "B",
              onChange: (next) => changes.push(next),
            }),
          ],
        ),
    }),
    entry = await mount(Wrapper);
  entry.all("input")[0].focus();
  await key(entry.all("input")[0], "ArrowRight");
  assert.equal(value.value, "b");
  assert.deepEqual(changes, ["b"]);
});
test("Composed choice children can control their group through change handlers", async () => {
  const values = ref([]),
    selected = ref("a");
  const Wrapper = defineComponent({
    setup: () => () =>
      h("div", [
        h(ui.HysCheckboxGroup, { modelValue: values.value }, () =>
          h(ui.HysCheckbox, {
            value: "a",
            label: "Check A",
            onChange: (next) => (values.value = next ? ["a"] : []),
          }),
        ),
        h(ui.HysRadioGroup, { modelValue: selected.value }, () => [
          h(ui.HysRadio, { value: "a", label: "Radio A" }),
          h(ui.HysRadio, {
            value: "b",
            label: "Radio B",
            onChange: (next) => (selected.value = next),
          }),
        ]),
      ]),
  });
  const entry = await mount(Wrapper);
  await click(entry.find("input[type=checkbox]"));
  assert.deepEqual(values.value, ["a"]);
  await click(entry.all("input[type=radio]")[1]);
  assert.equal(selected.value, "b");
});
