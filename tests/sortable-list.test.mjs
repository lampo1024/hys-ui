import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "localStorage",
]) {
  Object.defineProperty(globalThis, name, {
    value: dom.window[name],
    configurable: true,
  });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
const { createApp, h, nextTick, ref, shallowReactive } = await import("vue");
const { HysSortableList } = await import("../packages/ui/dist/index.js");
const hosts = [];
const task = (id, extra) => ({ id, label: String(id), ...extra });

async function mount(
  values,
  { controlled = true, accept = true, slots = {} } = {},
) {
  const host = document.createElement("div");
  document.body.append(host);
  const model = shallowReactive({ ...values });
  const instance = ref();
  const events = [];
  const app = createApp(() =>
    h(
      HysSortableList,
      {
        ...model,
        ref: instance,
        motion: false,
        "onUpdate:modelValue": (next) => {
          events.push({ name: "model", next });
          if (controlled && accept) model.modelValue = next;
        },
        onChange: (change) => events.push({ name: "change", change }),
        onConflict: (error) => events.push({ name: "conflict", error }),
        onInvalid: (error) => events.push({ name: "invalid", error }),
        onSaveError: (error) => events.push({ name: "save-error", error }),
        onCancel: (error) => events.push({ name: "cancel", error }),
      },
      slots,
    ),
  );
  app.mount(host);
  hosts.push(() => {
    app.unmount();
    host.remove();
  });
  await nextTick();
  return {
    instance: instance.value,
    model,
    events,
    host,
    keys: () =>
      [...host.querySelectorAll("[data-sort-id]")].map(
        (row) => row.dataset.sortId,
      ),
  };
}

afterEach(() => {
  for (const remove of hosts.splice(0).reverse()) remove();
  localStorage.clear();
});

test("sort handles render by default and only an explicit false enables the handle-free row", async () => {
  const list = await mount({ modelValue: [task("a"), task("b")] });
  assert.equal(list.host.querySelectorAll("[data-sort-handle]").length, 2);
  list.model.showHandle = false;
  await nextTick();
  assert.equal(list.host.querySelectorAll("[data-sort-handle]").length, 0);
  assert.equal(list.host.querySelectorAll(".hys-sort-whole").length, 2);
  list.model.showHandle = undefined;
  await nextTick();
  assert.equal(list.host.querySelectorAll("[data-sort-handle]").length, 2);
});

test("fixed boundaries, absolute positions and batch swaps are enforced through the public API", async () => {
  const list = await mount({
    modelValue: [
      task("top"),
      task("a"),
      task("b"),
      task("c"),
      task("d"),
      task("last"),
    ],
    fixed: (item) => ({ top: "top", last: "bottom" })[item.id],
    mode: "swap",
  });
  assert.equal(await list.instance.move(["a", "b"], { index: 3 }), true);
  assert.deepEqual(list.keys(), ["top", "c", "d", "a", "b", "last"]);
  assert.equal(await list.instance.move("c", { index: 0 }), false);
  assert.equal(list.events.at(-1).error.reason, "fixed");
  list.model.mode = "insert";
  list.model.fixed = ["d"];
  await nextTick();
  assert.equal(await list.instance.move("c", { index: 4 }), false);
  assert.equal(await list.instance.move("a", { index: 5 }), true);
  assert.deepEqual(list.keys(), ["top", "c", "d", "b", "a", "last"]);
});

test("a batch transfer shares both snapshots in one save and can be undone from the destination", async () => {
  const saves = [];
  const source = await mount({
    modelValue: [task("a"), task("b"), task("c")],
    listId: "source",
    group: "work",
    save: (change) => {
      saves.push(change);
    },
  });
  const destination = await mount({
    modelValue: [task("d")],
    listId: "destination",
    group: "work",
    maxItems: 3,
    save: () => {
      throw Error("source save takes priority");
    },
  });
  assert.equal(
    await source.instance.move(["c", "a"], { to: "destination", index: 1 }),
    true,
  );
  assert.deepEqual(source.keys(), ["b"]);
  assert.deepEqual(destination.keys(), ["d", "a", "c"]);
  assert.equal(saves.length, 1);
  assert.deepEqual(
    saves[0].lists.map((list) => [
      list.id,
      list.previous.length,
      list.next.length,
    ]),
    [
      ["source", 3, 1],
      ["destination", 1, 3],
    ],
  );
  assert.equal(
    await source.instance.move("b", { to: "destination", index: 1 }),
    false,
  );
  assert.equal(source.events.at(-1).error.reason, "capacity");
  assert.equal(await destination.instance.undo(), true);
  assert.deepEqual(source.keys(), ["a", "b", "c"]);
  assert.deepEqual(destination.keys(), ["d"]);
  assert.equal(await source.instance.redo(), true);
  assert.deepEqual(destination.keys(), ["d", "a", "c"]);
});

test("copy and clone generate distinct keys and respect destination group policy", async () => {
  const item = task("a", { detail: { priority: 2 } });
  const source = await mount({
    modelValue: [item],
    group: { name: "template", pull: "copy" },
  });
  const destination = await mount({
    modelValue: [],
    listId: "board",
    group: "board",
  });
  assert.equal(
    await source.instance.move("a", { to: "board", index: 0 }),
    false,
  );
  assert.equal(source.events.at(-1).error.reason, "group");
  destination.model.group = { name: "board", put: ["template"] };
  await nextTick();
  assert.equal(
    await source.instance.move("a", {
      to: "board",
      index: 0,
      operation: "copy",
    }),
    true,
  );
  const shallow = destination.model.modelValue[0];
  assert.notEqual(shallow.id, item.id);
  assert.equal(shallow.detail, item.detail);
  source.model.group = { name: "template", pull: "clone" };
  await nextTick();
  assert.equal(
    await source.instance.move("a", {
      to: "board",
      index: 1,
      operation: "clone",
    }),
    true,
  );
  const deep = destination.model.modelValue[1];
  assert.notEqual(deep.id, shallow.id);
  assert.notEqual(deep.detail, item.detail);
  assert.deepEqual(deep.detail, item.detail);
  assert.deepEqual(source.keys(), ["a"]);
});

test("if one controlled list rejects a cross-list move, the other rolls back", async () => {
  const source = await mount({ modelValue: [task("a")], group: "work" });
  const destination = await mount(
    { modelValue: [task("b")], listId: "target", group: "work" },
    { accept: false },
  );
  assert.equal(
    await source.instance.move("a", { to: "target", index: 1 }),
    false,
  );
  assert.deepEqual(source.keys(), ["a"]);
  assert.deepEqual(destination.keys(), ["b"]);
  assert.equal(source.events.at(-1).name, "conflict");
  assert.equal(
    source.events.find((event) => event.name === "change").change.action,
    "rollback",
  );
  assert.equal(await source.instance.undo(), false);
});

test("failed and canceled saves restore accepted changes while newer external data survives conflicts", async () => {
  let started;
  let finishSave;
  const list = await mount({
    modelValue: [task("a"), task("b")],
    save: () => false,
  });
  assert.equal(await list.instance.move("a", { index: 2 }), false);
  assert.deepEqual(list.keys(), ["a", "b"]);
  assert.equal(list.events.at(-1).name, "save-error");
  let saveStarted = new Promise((resolve) => {
    started = resolve;
  });
  list.model.save = (_, signal) => {
    started(signal);
    return new Promise((resolve) => {
      finishSave = resolve;
    });
  };
  await nextTick();
  const pending = list.instance.move("a", { index: 2 });
  const signal = await saveStarted;
  assert.equal(await list.instance.move("b", { index: 2 }), false);
  list.instance.cancel();
  assert.equal(await pending, false);
  assert.equal(signal.aborted, true);
  assert.deepEqual(list.keys(), ["a", "b"]);
  finishSave(true);

  saveStarted = new Promise((resolve) => {
    started = resolve;
  });
  const changed = list.instance.move("a", { index: 2 });
  await saveStarted;
  list.model.modelValue = [task("new")];
  await nextTick();
  finishSave(false);
  assert.equal(await changed, false);
  assert.deepEqual(list.keys(), ["new"]);
  assert.equal(list.events.at(-1).name, "conflict");
});

test("restoring stored order retains new items and can reset only the surviving initial items", async () => {
  localStorage.setItem("sort", JSON.stringify(["b", "a", "removed"]));
  const list = await mount(
    {
      defaultItems: [task("a"), task("new"), task("b")],
      storageKey: "sort",
    },
    { controlled: false },
  );
  assert.deepEqual(list.keys(), ["b", "new", "a"]);
  assert.equal(await list.instance.reset(), true);
  assert.deepEqual(list.keys(), ["a", "new", "b"]);
  assert.deepEqual(JSON.parse(localStorage.getItem("sort")), ["a", "new", "b"]);
});

test("a branch cannot be moved into its own nested list", async () => {
  const tree = await mount(
    { modelValue: [task("folder"), task("outside")], group: "tree" },
    {
      slots: {
        item: ({ item }) =>
          item.id === "folder"
            ? h(HysSortableList, {
                listId: "child",
                defaultItems: [task("nested")],
                group: "tree",
              })
            : item.label,
      },
    },
  );
  assert.equal(
    await tree.instance.move("folder", { to: "child", index: 1 }),
    false,
  );
  assert.equal(tree.events.at(-1).error.reason, "cycle");
  assert.deepEqual(tree.keys(), ["folder", "nested", "outside"]);
});

test("an async drop guard sees the original model and a late decision cannot overwrite updates", async () => {
  let decide;
  const list = await mount({
    modelValue: [task("a"), task("b")],
    beforeDrop: () =>
      new Promise((resolve) => {
        decide = resolve;
      }),
  });
  const pending = list.instance.move("a", { index: 2 });
  await nextTick();
  assert.deepEqual(list.keys(), ["a", "b"]);
  assert.equal(list.events.length, 0);
  list.model.modelValue = [task("fresh"), task("a"), task("b")];
  await nextTick();
  decide(true);
  assert.equal(await pending, false);
  assert.deepEqual(list.keys(), ["fresh", "a", "b"]);
  assert.equal(list.events.at(-1).name, "conflict");
});

test("releasing at the last preview point commits even while rows are moving", async () => {
  const list = await mount({
    modelValue: [task("a"), task("b"), task("c")],
    touchDelay: 0,
  });
  const handle = list.host.querySelector(
    '[data-sort-id="a"] [data-sort-handle]',
  );
  const destination = list.host.querySelector('[data-sort-id="b"]');
  destination.getBoundingClientRect = () => new window.DOMRect(0, 40, 200, 40);
  const hitTest = document.elementFromPoint;
  document.elementFromPoint = () => destination;
  const pointer = (target, type, x, y) => {
    const event = new window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });
    Object.defineProperties(event, {
      pointerId: { value: 1 },
      pointerType: { value: "touch" },
      isPrimary: { value: true },
    });
    target.dispatchEvent(event);
  };
  try {
    pointer(handle, "pointerdown", 10, 10);
    pointer(window, "pointermove", 40, 75);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    await nextTick();
    assert.deepEqual(list.keys(), ["b", "a", "c"]);
    assert.equal(list.events.length, 0);
    // The moving destination now reports a different visual index beneath the same pointer.
    pointer(window, "pointerup", 40, 75);
    await nextTick();
    await nextTick();
    assert.deepEqual(
      list.model.modelValue.map((item) => item.id),
      ["b", "a", "c"],
    );
  } finally {
    document.elementFromPoint = hitTest;
  }
});

test("pointer sorting blocks native selection from press until release or cancellation", async () => {
  const list = await mount(
    { modelValue: [task("a"), task("b")], showHandle: false },
    { slots: { item: ({ item }) => h("span", [item.label, h("input")]) } },
  );
  const row = list.host.querySelector("[data-sort-id]");
  const input = row.querySelector("input");
  function pointer(target, type) {
    const event = new window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperties(event, {
      pointerId: { value: 1 },
      pointerType: { value: "mouse" },
      isPrimary: { value: true },
    });
    return target.dispatchEvent(event);
  }
  const canSelect = () =>
    document.body.dispatchEvent(
      new window.Event("selectstart", { bubbles: true, cancelable: true }),
    );

  assert.equal(pointer(input, "pointerdown"), true);
  assert.equal(canSelect(), true);
  assert.equal(pointer(row, "pointerdown"), false);
  assert.equal(document.activeElement, row);
  assert.equal(canSelect(), false);
  pointer(window, "pointerup");
  assert.equal(canSelect(), true);

  pointer(row, "pointerdown");
  assert.equal(canSelect(), false);
  pointer(window, "pointercancel");
  assert.equal(canSelect(), true);
});
