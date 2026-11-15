import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatJson, jsonLineStarts, jsonLocation, jsonPointer, parseJsonDocument, readJsonFile,
} from '../packages/ui/dist/components/HysJsonEditor/jsonDocument.js';
import {
  appendJsonChild, encodeJsonValue, removeJsonChild, swapJsonChildren,
} from '../packages/ui/dist/components/HysJsonEditor/jsonTreeEdits.js';

test('JSON formatting changes layout while preserving lexemes and member order', () => {
  const input = String.raw` { "12": 9007199254740993 , "3": -0, "12": 1.20e+1000, "\u0033": "a, } \" b", "nested": [ {}, [] ,true, null ] } `;
  const compact = String.raw`{"12":9007199254740993,"3":-0,"12":1.20e+1000,"\u0033":"a, } \" b","nested":[{},[],true,null]}`;
  const doc = parseJsonDocument(input);
  assert.equal(doc.valid, true);
  assert.equal(formatJson(input, 0), compact);
  const pretty = formatJson(input, 4);
  assert.match(pretty, /^\{\n {4}"12": 9007199254740993,\n {4}"3": -0,/);
  assert.equal(formatJson(pretty, 0), compact);
  assert.equal(formatJson(pretty, 4), pretty);
  assert.deepEqual(doc.duplicates.map(dup => dup.label), ['12', '3']);
});

test('JSON diagnostics distinguish escaped duplicate keys, sibling objects and valid root scalars', () => {
  const source = '{\r\n  "a/b~c": 1,\r\n  "d": {"name": 3},\r\n  "e": {"name": 4},\r\n  "\\u0061/b~c": {"child": null}\r\n}';
  const doc = parseJsonDocument(source);
  assert.equal(doc.valid, true);
  assert.equal(doc.duplicates.length, 1);
  assert.deepEqual(jsonLocation(jsonLineStarts(source), doc.duplicates[0].from), { line: 5, column: 3 });
  assert.deepEqual(jsonLocation(jsonLineStarts(source), doc.duplicates[0].original), { line: 2, column: 3 });
  assert.equal(jsonPointer(doc.root), '');
  assert.equal(jsonPointer(doc.root.children[1].children[0]), '/d/name');
  assert.equal(jsonPointer(doc.root.children.at(-1).children[0]), undefined);
  assert.equal(jsonPointer(parseJsonDocument('{"a/b~c":null,"":true}').root.children[0]), '/a~1b~0c');
  assert.equal(jsonPointer(parseJsonDocument('{"a/b~c":null,"":true}').root.children[1]), '/');
  for (const value of ['"hello"', 'null', 'true', '1e400', '   -10  ']) assert(parseJsonDocument(value).valid);
  for (const value of ['[2,]', '{"x":}', '[01]', '', 'null true', '{"aa":1 /* c */}', '"\t"']) {
    assert.equal(parseJsonDocument(value).valid, false, value);
  }
});

function apply(source, edits) {
  for (const { from, to, insert } of [edits].flat().reverse()) {
    source = source.slice(0, from) + insert + source.slice(to);
  }
  return source;
}

test('JSON tree edit operations preserve unaffected tokens and work on first, middle and last members', () => {
  const source = '{\n  "a": [9007199254740993, -0, 1e-42],\n  "z": 23\n}';
  const { root } = parseJsonDocument(source);
  const array = root.children[0];
  const [first, middle, last] = array.children;
  assert.equal(apply(source, swapJsonChildren(source, middle, first)), source.replace('9007199254740993, -0', '-0, 9007199254740993'));
  assert.equal(apply(source, removeJsonChild(first, array.children, 0)), source.replace('9007199254740993, ', ''));
  assert.equal(apply(source, removeJsonChild(middle, array.children, 1)), source.replace('-0, ', ''));
  assert.equal(apply(source, removeJsonChild(last, array.children, 2)), source.replace(', 1e-42', ''));
  assert.equal(apply(source, appendJsonChild(source, root, 'flag', 'false', 2)), source.replace('23', '23,\n  "flag": false'));
  const empty = '{\n}';
  const added = appendJsonChild(empty, parseJsonDocument(empty).root, '', '{"child":2}', 2);
  assert.equal(apply(empty, added), '{\n  "": {\n    "child": 2\n  }\n}');
  assert.equal(encodeJsonValue('number', '900719925474099399'), '900719925474099399');
  assert.equal(encodeJsonValue('number', 'NaN'), undefined);
  assert.equal(encodeJsonValue('object', '[]'), undefined);
  assert.equal(encodeJsonValue('string', '第一行\n第二行'), '"第一行\\n第二行"');
});

test('JSON file loading preserves decoded text and reports errors without treating invalid JSON as an IO error', async () => {
  assert.equal(await readJsonFile(new File(['\uFEFF{ invalid\r\n'], '接口.JSON')), '{ invalid\r\n');
  await assert.rejects(readJsonFile(new File(['{}'], 'data.txt')), /\.json/);
  await assert.rejects(readJsonFile(new File([new Uint8Array([0xc3, 0x28])], 'data.json')), /UTF-8/);
  await assert.rejects(readJsonFile({ name: 'data.json', arrayBuffer: async () => { throw Error(); } }), /无法读取/);
});
