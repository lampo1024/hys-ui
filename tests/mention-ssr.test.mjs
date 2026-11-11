import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import {
  HysMention,
  deserializeMentionDocument,
  serializeMentionDocument,
} from "../packages/ui/dist/index.js";

test("Mention renders text and rich editor shells without browser globals and escapes user content", async () => {
  assert.equal(typeof window, "undefined");
  const unsafe = '<img src=x onerror="alert(1)"> @张三';
  for (const type of ["textarea", "text", "rich"]) {
    const app = createSSRApp({
      render: () =>
        h(HysMention, {
          type,
          modelValue: unsafe,
          name: "notes",
          recommendOnFocus: true,
          virtual: true,
        }),
    });
    const html = await renderToString(app);
    assert.match(html, /role="combobox"/);
    assert.match(html, /&lt;img/);
    assert.doesNotMatch(html, /<img|role="listbox"/);
    assert.match(html, /name="notes"/);
  }
});

test("Mention document decoding keeps only matching, nonoverlapping UTF-16 ranges", () => {
  const text = "🌎 @张三 #发布";
  const entity = {
    id: 0,
    value: "张三",
    label: "张三",
    prefix: "@",
    type: "member",
    text: "@张三",
    start: 3,
    end: 6,
  };
  const invalid = { ...entity, start: 2, end: 5 };
  const result = deserializeMentionDocument(
    serializeMentionDocument({ text, entities: [invalid, entity] }),
  );
  assert.deepEqual(result, { text, entities: [entity] });
  assert.throws(() => deserializeMentionDocument('{"entities":[]}'), TypeError);
});
