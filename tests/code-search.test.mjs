import assert from "node:assert/strict";
import { test } from "node:test";
import { findCodeMatches } from "../packages/ui/dist/composables/codeSearch.js";

test("literal search uses non-overlapping source offsets across characters and lines", () => {
  assert.deepEqual(findCodeMatches("aaa aA [a]", "aa", false), [{ from: 0, to: 2 }, { from: 4, to: 6 }]);
  assert.deepEqual(findCodeMatches("aaa aA [a]", "aa", true), [{ from: 0, to: 2 }]);
  assert.deepEqual(findCodeMatches("一\n[二]\n三", "[二]\n", true), [{ from: 2, to: 6 }]);
  assert.deepEqual(findCodeMatches("x😀x😀", "😀", true), [{ from: 1, to: 3 }, { from: 4, to: 6 }]);
  assert.deepEqual(findCodeMatches("text", "", true), []);
});

test("normalization keeps the original ranges for decomposed and expanded characters", () => {
  assert.deepEqual(findCodeMatches("é e\u0301 É", "e\u0301", false), [
    { from: 0, to: 1 }, { from: 2, to: 4 }, { from: 5, to: 6 },
  ]);
  assert.deepEqual(findCodeMatches("ﬃ ff", "f", true), [
    { from: 0, to: 1 }, { from: 2, to: 3 }, { from: 3, to: 4 },
  ]);
});
