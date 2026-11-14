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
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "CompositionEvent",
  "MutationObserver",
  "FormData",
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
    bottom: 220,
    width: 300,
    height: 200,
    toJSON() {
      return {};
    },
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
const captured = new WeakMap();
HTMLElement.prototype.setPointerCapture = function (id) {
  captured.set(this, id);
};
HTMLElement.prototype.hasPointerCapture = function (id) {
  return captured.get(this) === id;
};
HTMLElement.prototype.releasePointerCapture = function () {
  captured.delete(this);
};
HTMLElement.prototype.scrollTo = function (p) {
  this.scrollTop = p.top ?? 0;
};
HTMLElement.prototype.scrollIntoView = function () {};
const { createApp, h, reactive, ref, nextTick, KeepAlive, defineComponent } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  apps = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  settle = async () => {
    await nextTick();
    await Promise.resolve();
    await nextTick();
  };
afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
async function mount(Component, values = {}, slots = {}, accept = true) {
  const props = reactive({ ...values }),
    host = document.createElement("div"),
    events = [],
    warnings = [],
    vm = ref();
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Component.emits ?? []).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        events.push({ name, args });
        if (
          name.startsWith("update:") &&
          values[name.slice(7)] !== undefined &&
          accept !== false
        )
          props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(Component, { ...props, ...listeners, ref: vm }, slots);
    },
  });
  app.config.warnHandler = (m) => warnings.push(m);
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    props,
    host,
    app,
    events,
    warnings,
    get vm() {
      return vm.value;
    },
    find: (s) => host.querySelector(s),
    all: (s) => [...host.querySelectorAll(s)],
    count: (name) => events.filter((e) => e.name === name).length,
  };
}
async function fire(el, type, flags = {}) {
  assert(el);
  el.dispatchEvent(
    new (type === "keydown"
      ? KeyboardEvent
      : type === "click"
        ? MouseEvent
        : type.startsWith("composition")
          ? CompositionEvent
          : Event)(type, { bubbles: true, cancelable: true, ...flags }),
  );
  await settle();
}
async function type(a, value) {
  const input = a.find("input:not([type=hidden])");
  input.value = value;
  await fire(input, "input");
  return input;
}
async function pointer(el, type, x = 100, y = 100, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  Object.defineProperty(event, "pointerId", { value: id });
  el.dispatchEvent(event);
  await settle();
}

test("TagInput preserves max=10, Enter/blur commits, legacy slots and request events", async () => {
  const a = await mount(
    ui.HysTagInput,
    { modelValue: ["Old"] },
    { tag: ({ value, index }) => h("strong", index + ":" + value) },
  );
  assert(a.host.textContent.includes("0:Old"));
  let input = await type(a, "New");
  await fire(input, "keydown", { key: "Enter" });
  assert.deepEqual([...a.props.modelValue], ["Old", "New"]);
  assert.equal(a.count("add"), 1);
  assert.equal(a.count("change"), 1);
  assert.equal(a.count("acceptedChange"), 1);
  assert.equal(input.value, "");
  for (let i = 0; i < 9; i++) await a.vm.add("T" + i);
  assert.equal(a.props.modelValue.length, 10);
  assert.equal(a.count("reject"), 1);
});
test("TagInput host refusal retains draft and does not report accepted changes", async () => {
  const a = await mount(ui.HysTagInput, { modelValue: ["Old"] }, {}, false);
  const input = await type(a, "New");
  await fire(input, "keydown", { key: "Enter" });
  assert.deepEqual([...a.props.modelValue], ["Old"]);
  assert.equal(input.value, "New");
  assert.equal(a.count("change"), 1);
  assert.equal(a.count("acceptedChange"), 0);
});
test("TagInput accepts uncontrolled defaults and restores them on native form reset", async () => {
  const host = document.createElement("form"),
    api = ref();
  document.body.append(host);
  const app = createApp({
    render: () =>
      h(ui.HysTagInput, { ref: api, defaultValue: ["Initial"], name: "tags" }),
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  await api.value.add("Added");
  assert.deepEqual(
    [...new FormData(host).getAll("tags")],
    ["Initial", "Added"],
  );
  host.reset();
  await settle();
  assert.deepEqual([...api.value.values], ["Initial"]);
  assert.equal(api.value.draft, "");
});
test("TagInput supports separators, case-insensitive duplicates, bounds and rejection details", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: ["Vue"],
    max: 4,
    separator: ",",
    caseSensitive: false,
    minlength: 2,
    maxlength: 5,
  });
  await type(a, "vue,ts,x,toolong,good");
  await a.vm.add();
  assert.deepEqual([...a.props.modelValue], ["Vue", "ts", "good"]);
  assert.deepEqual(
    a.events.filter((e) => e.name === "invalid").map((e) => e.args[0].reason),
    ["duplicate", "minlength", "maxlength"],
  );
  assert.equal(a.vm.draft, "vue,x,toolong");
});
test("TagInput trigger configuration respects composition and plain Enter remains configurable", async () => {
  const a = await mount(ui.HysTagInput, { modelValue: [], trigger: "Space" });
  const input = await type(a, "中文");
  await fire(input, "compositionstart");
  await fire(input, "keydown", { key: " ", isComposing: true });
  assert.equal(a.props.modelValue.length, 0);
  await fire(input, "compositionend");
  await fire(input, "keydown", { key: "Enter" });
  assert.equal(a.props.modelValue.length, 0);
  await fire(input, "keydown", { key: " " });
  assert.deepEqual([...a.props.modelValue], ["中文"]);
});
test("TagInput delimiters tokenize input without mutating a global RegExp lastIndex", async () => {
  const delimiters = /[,;]/g;
  delimiters.lastIndex = 2;
  const a = await mount(ui.HysTagInput, { modelValue: [], delimiters });
  await type(a, "Alpha;Beta, Gamma");
  assert.deepEqual([...a.props.modelValue], ["Alpha", "Beta", "Gamma"]);
  assert.equal(delimiters.lastIndex, 2);
});
test("TagInput pasted separators merge the caret selection into the tokenized batch", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: [],
    delimiters: [",", ";"],
  });
  const input = await type(a, "old");
  input.setSelectionRange(0, 3);
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { getData: () => "A,B;C" },
  });
  input.dispatchEvent(event);
  await settle();
  assert(event.defaultPrevented);
  assert.deepEqual([...a.props.modelValue], ["A", "B", "C"]);
});
test("TagInput async guard is cancellable, rejects repeats and cannot commit a replaced model", async () => {
  let resolve, signal;
  const a = await mount(ui.HysTagInput, {
    modelValue: [],
    beforeAdd: (_v, c) => {
      signal = c.signal;
      return new Promise((done) => (resolve = done));
    },
  });
  a.vm.setDraft("Async");
  const job = a.vm.add();
  await settle();
  assert(a.vm.pending);
  assert.equal(await a.vm.add("Repeated"), false);
  a.props.modelValue = ["External"];
  await settle();
  assert(signal.aborted);
  resolve(true);
  assert.equal(await job, false);
  assert.deepEqual([...a.props.modelValue], ["External"]);
  assert(!a.vm.pending);
  assert.equal(a.count("add"), 0);
});
test("TagInput thrown validation reports an error and a false hook leaves input retryable", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: [],
    beforeAdd: () => {
      throw Error("Bad");
    },
  });
  await type(a, "Input");
  assert.equal(await a.vm.add(), false);
  assert.equal(a.vm.draft, "Input");
  assert.equal(
    a.events.find((e) => e.name === "invalid").args[0].reason,
    "error",
  );
  a.props.beforeAdd = () => false;
  await settle();
  assert.equal(await a.vm.add(), false);
  assert.equal(a.vm.pending, false);
});
for (const prop of ["disabled", "readonly"])
  test(
    "TagInput " + prop + " prevents adding, removing, clearing and reordering",
    async () => {
      const a = await mount(ui.HysTagInput, {
        modelValue: ["A", "B"],
        [prop]: true,
        draggable: true,
        clearable: true,
      });
      assert.equal(await a.vm.add("C"), false);
      assert.equal(await a.vm.remove(0), false);
      assert.equal(await a.vm.clear(), false);
      assert.equal(await a.vm.move(0, 1), false);
      assert.deepEqual([...a.props.modelValue], ["A", "B"]);
    },
  );
test("TagInput clear and keyboard removal keep accepted values synchronized", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: ["A", "B"],
    clearable: true,
  });
  await fire(a.find("input"), "keydown", { key: "Backspace" });
  assert.deepEqual([...a.props.modelValue], ["A"]);
  await type(a, "Draft");
  await a.vm.clear();
  assert.deepEqual([...a.props.modelValue], []);
  assert.equal(a.vm.draft, "");
  assert.equal(a.count("clear"), 1);
});
test("TagInput collapse renders bounded tags and virtualizes the overflow list", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: Array.from({ length: 1000 }, (_, i) => "Tag " + i),
    max: Infinity,
    collapseTags: true,
    maxCollapseTags: 2,
  });
  assert.equal(a.all(".hys-ui-tag-item").length, 2);
  await fire(a.find(".hys-ui-tag-overflow-trigger"), "click");
  await settle();
  assert(document.querySelector(".hys-ui-tag-overflow"));
  assert(document.querySelectorAll(".hys-ui-tag-overflow-row").length < 20);
  assert.equal(a.count("change"), 0);
});
test("TagInput duplicate values render distinct keys when duplicates are allowed", async () => {
  const a = await mount(ui.HysTagInput, {
    modelValue: ["Same"],
    allowDuplicates: true,
  });
  await a.vm.add("Same");
  assert.equal(a.all(".hys-ui-tag-item").length, 2);
  await a.vm.remove(1);
  assert.deepEqual([...a.props.modelValue], ["Same"]);
  assert.deepEqual(a.warnings, []);
});
test("TagInput keyboard reorder uses explicit opt-in and preserves the source array", async () => {
  const original = ["A", "B", "C"],
    a = await mount(ui.HysTagInput, { modelValue: original, draggable: true });
  await fire(a.find('[data-tag-index="0"]'), "keydown", {
    key: "ArrowRight",
    altKey: true,
  });
  assert.deepEqual([...a.props.modelValue], ["B", "A", "C"]);
  assert.deepEqual(original, ["A", "B", "C"]);
  assert.equal(a.count("reorder"), 1);
  assert.equal(document.activeElement.dataset.tagIndex, "1");
});

test("ColorPicker preserves immediate hex updates and custom slider controls", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#3867f5",
    inline: true,
  });
  assert.equal(a.all("input[type=range],input[type=color]").length, 0);
  assert(a.find(".hys-ui-pf-color-palette"));
  assert.equal(await a.vm.setColor("#ff0000"), true);
  assert.equal(a.props.modelValue, "#ff0000");
  assert.equal(a.count("change"), 1);
});
for (const [input, expected] of [
  ["#f00", "#ff0000"],
  ["#f008", "#ff000088"],
  ["rgb(0, 255, 0)", "#00ff00"],
  ["rgb(100% 0% 0% / 50%)", "#ff000080"],
  ["hsl(240, 100%, 50%)", "#0000ff"],
  ["hsl(.5turn 100% 50% / .25)", "#00ffff40"],
  ["hsv(120, 100%, 100%)", "#00ff00"],
  ["hsva(120, 100%, 100%, 0.5)", "#00ff0080"],
  ["rebeccapurple", "#663399"],
])
  test("ColorPicker parses " + input, async () => {
    const a = await mount(ui.HysColorPicker, {
      modelValue: "",
      inline: true,
      format: "hex",
      showAlpha: expected.length === 9,
    });
    assert.equal(await a.vm.setColor(input), true);
    assert.equal(a.props.modelValue, expected);
  });
test("ColorPicker supports rgba, hsl and hsv output without losing alpha", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "",
    inline: true,
    showAlpha: true,
    format: "rgb",
  });
  await a.vm.setColor("#ff000080");
  assert.equal(a.props.modelValue, "rgba(255, 0, 0, 0.502)");
  a.props.format = "hsl";
  await settle();
  await a.vm.setColor("#00ff00");
  assert.equal(a.props.modelValue, "hsla(120, 100%, 50%, 1)");
  a.props.format = "hsv";
  await settle();
  await a.vm.setColor("#0000ff");
  assert.equal(a.props.modelValue, "hsva(240, 100%, 100%, 1)");
});
for (const raw of [
  "javascript:alert(1)",
  "#ggg",
  "rgb(no, 0, 1)",
  "hsl(1, x, 2)",
  "rgba(1, 2, 3, NaN)",
])
  test("ColorPicker rejects invalid color " + raw, async () => {
    const a = await mount(ui.HysColorPicker, {
      modelValue: "#ff0000",
      inline: true,
    });
    assert.equal(await a.vm.setColor(raw), false);
    assert.equal(a.props.modelValue, "#ff0000");
    assert.equal(a.count("invalid"), 1);
  });
test("ColorPicker manual mode stages previews until confirmation and can cancel them", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
    immediate: false,
  });
  assert.equal(await a.vm.setColor("#00ff00"), true);
  assert.equal(a.props.modelValue, "#ff0000");
  assert.equal(a.count("activeChange"), 1);
  assert.equal(a.count("change"), 0);
  a.vm.cancel();
  await settle();
  assert.equal(a.vm.draft, "#ff0000");
  await a.vm.setColor("#0000ff");
  assert.equal(await a.vm.confirm(), true);
  assert.equal(a.props.modelValue, "#0000ff");
  assert.equal(a.count("confirm"), 1);
});
test("ColorPicker controlled value refusal restores the actual selected color", async () => {
  const a = await mount(
    ui.HysColorPicker,
    { modelValue: "#ff0000", inline: true },
    {},
    false,
  );
  assert.equal(await a.vm.setColor("#0000ff"), false);
  assert.equal(a.vm.draft, "#ff0000");
  assert.equal(a.count("change"), 0);
  assert.equal(a.count("update:modelValue"), 1);
});
test("ColorPicker clear is explicit and guarded by clearable", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
  });
  assert.equal(await a.vm.clear(), false);
  a.props.clearable = true;
  await settle();
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.props.modelValue, "");
  assert.equal(a.count("clear"), 1);
});
test("ColorPicker initial controlled popup opens and refusal keeps it closed", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    open: true,
  });
  await settle();
  assert(a.vm.open);
  assert(document.querySelector(".hys-ui-color-panel"));
  a.props.open = false;
  await settle();
  assert(!a.vm.open);
  const b = await mount(
    ui.HysColorPicker,
    { modelValue: "#ff0000", open: false },
    {},
    false,
  );
  assert.equal(await b.vm.show(), false);
  assert.equal(b.count("update:open"), 1);
  assert(!b.vm.open);
});
test("ColorPicker custom templates and inline footer do not suppress default controls", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
    showAlpha: true,
  });
  assert(a.find("header strong"));
  assert(a.find("footer button"));
  assert.equal(a.all("[role=slider]").length, 3);
  assert.deepEqual(a.warnings, []);
});
for (const prop of ["disabled", "readonly"])
  test(
    "ColorPicker " + prop + " blocks palette edits and instance mutations",
    async () => {
      const a = await mount(ui.HysColorPicker, {
        modelValue: "#ff0000",
        inline: true,
        clearable: true,
        [prop]: true,
      });
      assert.equal(await a.vm.setColor("#00ff00"), false);
      assert.equal(await a.vm.clear(), false);
      await fire(a.find(".hys-ui-pf-color-hue"), "keydown", { key: "End" });
      assert.equal(a.props.modelValue, "#ff0000");
    },
  );
test("ColorPicker pointer moves are frame-batched and cache the track bounds", async () => {
  const a = await mount(ui.HysColorPicker, {
      modelValue: "#ff0000",
      inline: true,
      showAlpha: true,
    }),
    track = a.find(".hys-ui-color-alpha");
  let reads = 0;
  track.getBoundingClientRect = () => {
    reads++;
    return { left: 20, top: 20, width: 300, height: 12 };
  };
  await pointer(track, "pointerdown", 20, 20);
  const before = a.count("update:modelValue");
  for (let i = 0; i < 30; i++)
    await pointer(track, "pointermove", 30 + i * 5, 20);
  assert.equal(reads, 1);
  assert(a.count("update:modelValue") <= before + 1);
  await pointer(track, "pointerup", 175, 20);
  assert.equal(reads, 1);
  assert(a.vm.color.a > 0.4 && a.vm.color.a < 0.7);
});
test("ColorPicker pointer cancellation restores the start value rather than accepting a partial gesture", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
  });
  const hue = a.find(".hys-ui-pf-color-hue");
  await pointer(hue, "pointerdown", 160, 20);
  await pointer(hue, "pointercancel", 160, 20);
  await settle();
  assert.equal(a.props.modelValue, "#ff0000");
});
test("ColorPicker release mode publishes only the final pointer color", async () => {
  const picker = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
    immediate: "release",
  });
  const hue = picker.find(".hys-ui-pf-color-hue");
  await pointer(hue, "pointerdown", 130, 24);
  await pointer(hue, "pointermove", 175, 24);
  await settle();
  assert.notEqual(picker.vm.draft, "#ff0000");
  assert.equal(picker.count("update:modelValue"), 0);
  await pointer(hue, "pointercancel", 175, 24);
  assert.equal(picker.vm.draft, "#ff0000");
  assert.equal(picker.count("update:modelValue"), 0);
  await pointer(hue, "pointerdown", 130, 24);
  await pointer(hue, "pointermove", 175, 24);
  await pointer(hue, "pointerup", 175, 24);
  assert.notEqual(picker.props.modelValue, "#ff0000");
  assert.equal(picker.props.modelValue, picker.vm.draft);
  assert.equal(picker.count("update:modelValue"), 1);
});
test("ColorPicker keyboard alpha adjustment is a single accepted change per key", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "rgba(255, 0, 0, 1)",
    inline: true,
    showAlpha: true,
  });
  await fire(a.find(".hys-ui-color-alpha"), "keydown", {
    key: "ArrowLeft",
    shiftKey: true,
  });
  assert.equal(a.props.modelValue, "rgba(255, 0, 0, 0.9)");
  assert.equal(a.count("update:modelValue"), 1);
});

test("TagInput in-place host edits cancel pending validation without losing new tags", async () => {
  let resolve, signal;
  const a = await mount(ui.HysTagInput, {
    modelValue: ["A"],
    beforeAdd: (_v, c) => {
      signal = c.signal;
      return new Promise((done) => (resolve = done));
    },
  });
  const request = a.vm.add("Late");
  a.props.modelValue.push("External");
  await settle();
  assert(signal.aborted);
  resolve(true);
  assert.equal(await request, false);
  assert.deepEqual([...a.props.modelValue], ["A", "External"]);
});
test("TagInput async acceptance preserves a newer draft typed while checking", async () => {
  let resolve;
  const a = await mount(ui.HysTagInput, {
    modelValue: [],
    beforeAdd: () => new Promise((done) => (resolve = done)),
  });
  a.vm.setDraft("First");
  const request = a.vm.add();
  a.vm.setDraft("Second");
  resolve(true);
  assert.equal(await request, true);
  assert.equal(a.vm.draft, "Second");
  assert.deepEqual([...a.props.modelValue], ["First"]);
});
test("ColorPicker manual text preview survives opening its popup", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    immediate: false,
  });
  await a.vm.setColor("#00ff00");
  await a.vm.show();
  assert.equal(a.vm.draft, "#00ff00");
  assert.equal(a.props.modelValue, "#ff0000");
  assert.equal(await a.vm.confirm(), true);
  assert.equal(a.props.modelValue, "#00ff00");
  assert(!a.vm.open);
});
test("ColorPicker external replacement cancels an active pointer gesture without overwriting the replacement", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
  });
  const hue = a.find(".hys-ui-pf-color-hue");
  await pointer(hue, "pointerdown", 160, 20);
  a.props.modelValue = "#0000ff";
  await settle();
  await pointer(hue, "pointercancel", 160, 20);
  assert.equal(a.props.modelValue, "#0000ff");
  assert(!hue.hasPointerCapture(1));
});
test("TagInput and ColorPicker inherit form state, associate labels and validate only accepted edits", async () => {
  const host = document.createElement("div"),
    model = reactive({ tags: [], color: "#ff0000" }),
    size = ref("sm"),
    disabled = ref(false),
    form = ref(),
    tags = ref(),
    color = ref();
  let checks = 0;
  const rules = {
    validator: () => {
      checks++;
      return true;
    },
  };
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(
          ui.HysForm,
          { ref: form, model, size: size.value, disabled: disabled.value },
          {
            default: () => [
              h(
                ui.HysFormItem,
                {
                  prop: "tags",
                  label: "Tags",
                  rules,
                },
                () =>
                  h(ui.HysTagInput, {
                    ref: tags,
                    modelValue: model.tags,
                    "onUpdate:modelValue": (v) => (model.tags = v),
                  }),
              ),
              h(ui.HysFormItem, { prop: "color", label: "Color" }, () =>
                h(ui.HysColorPicker, {
                  ref: color,
                  modelValue: model.color,
                  "onUpdate:modelValue": (v) => (model.color = v),
                }),
              ),
            ],
          },
        );
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  assert(host.querySelector(".hys-ui-tag-input-sm"));
  assert(host.querySelector(".hys-ui-color-picker-sm"));
  const input = host.querySelector(".hys-ui-tags-native"),
    label = [...host.querySelectorAll("label")].find((el) =>
      el.textContent.includes("Tags"),
    );
  assert.equal(label.htmlFor, input.id);
  input.value = "Draft";
  await fire(input, "input");
  assert.equal(checks, 0);
  await tags.value.add();
  await settle();
  assert.equal(checks, 1);
  disabled.value = true;
  await settle();
  assert(input.disabled);
  assert.equal(await color.value.setColor("#00ff00"), false);
  disabled.value = false;
  await settle();
  await color.value.setColor("#00ff00");
  form.value.resetFields();
  await settle();
  assert.deepEqual([...model.tags], []);
  assert.equal(model.color, "#ff0000");
  assert.equal(tags.value.draft, "");
});
test("Cached TagInput cancels guards and cached ColorPicker releases pointer capture and popup listeners", async () => {
  const host = document.createElement("div"),
    shown = ref(true),
    tag = ref(),
    color = ref();
  let resolve, signal;
  document.body.append(host);
  const Page = defineComponent({
      setup: () => () =>
        h("div", [
          h(ui.HysTagInput, {
            ref: tag,
            beforeAdd: (_v, c) => {
              signal = c.signal;
              return new Promise((done) => (resolve = done));
            },
          }),
          h(ui.HysColorPicker, { ref: color, defaultValue: "#ff0000" }),
        ]),
    }),
    Other = defineComponent({ render: () => h("p", "Other") });
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(KeepAlive, () => (shown.value ? h(Page) : h(Other)));
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  const tagApi = tag.value,
    colorApi = color.value,
    request = tagApi.add("Late");
  await colorApi.show();
  const hue = document.querySelector(".hys-ui-pf-color-hue");
  await pointer(hue, "pointerdown", 160, 20);
  shown.value = false;
  await settle();
  assert(signal.aborted);
  assert(!hue.hasPointerCapture(1));
  assert(!document.querySelector(".hys-ui-color-panel"));
  resolve(true);
  assert.equal(await request, false);
  assert.equal(await tagApi.add("Inactive"), false);
  assert.equal(await colorApi.setColor("#0000ff"), false);
  shown.value = true;
  await settle();
  assert(!colorApi.open);
  assert.equal(tagApi.values.length, 0);
});

test("ColorPicker defers form model validation across continuous frames and validates once at release", async () => {
  const host = document.createElement("div"),
    model = reactive({ color: "rgba(255, 0, 0, 1)" }),
    api = ref();
  let checks = 0;
  const rules = {
    validator: () => {
      checks++;
      return true;
    },
  };
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(ui.HysForm, { model }, () =>
          h(ui.HysFormItem, { prop: "color", rules }, () =>
            h(ui.HysColorPicker, {
              ref: api,
              modelValue: model.color,
              "onUpdate:modelValue": (v) => (model.color = v),
              inline: true,
              showAlpha: true,
            }),
          ),
        );
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  const track = host.querySelector(".hys-ui-color-alpha");
  await pointer(track, "pointerdown", 50, 20);
  for (const x of [100, 150, 200]) {
    await pointer(track, "pointermove", x, 20);
    await wait(22);
    await settle();
  }
  assert.equal(checks, 0);
  await pointer(track, "pointerup", 200, 20);
  await settle();
  assert.equal(checks, 1);
  await fire(track, "keydown", { key: "ArrowLeft" });
  await settle();
  assert.equal(checks, 2);
});

test("ColorPicker Escape cancels an inline pointer gesture and restores the start color", async () => {
  const a = await mount(ui.HysColorPicker, {
    modelValue: "#ff0000",
    inline: true,
  });
  const track = a.find(".hys-ui-pf-color-hue");
  await pointer(track, "pointerdown", 160, 20);
  await fire(track, "keydown", { key: "Escape" });
  assert.equal(a.props.modelValue, "#ff0000");
  assert(!track.hasPointerCapture(1));
});
