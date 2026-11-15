import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatJson, parseJsonDocument } from '../packages/ui/dist/components/HysJsonEditor/jsonDocument.js';
import { compareJsonDocuments, compareJsonNumbers, duplicateRemoval, jsonNumberFits, locatePointer, organizeJson, requireJson } from '../packages/ui/dist/components/HysJsonEditor/jsonStructure.js';
import { queryJson } from '../packages/ui/dist/components/HysJsonEditor/jsonQuery.js';
import { convertJson, csvToJson, yamlToJson } from '../packages/ui/dist/components/HysJsonEditor/jsonConvert.js';
import { jsonSchemaHints, parseSchemaText, validateJsonSchema } from '../packages/ui/dist/components/HysJsonEditor/jsonSchema.js';

test('structural query preserves large literals and supports descent, slices, quoted fields and compound filters', () => {
  const root = requireJson('{"order":[{"id":9007199254740992,"ok":true},{"id":9007199254740993,"ok":true},{"id":9007199254740994,"ok":false}],"a/b~c":1e700}');
  assert.deepEqual(queryJson(root, '$.order[?(@.id >= 9007199254740993 && @.ok == true) || @.id == 7].id').map(node => node.preview), ['9007199254740993']);
  assert.deepEqual(queryJson(root, '$..id').map(node => node.preview), ['9007199254740992', '9007199254740993', '9007199254740994']);
  assert.deepEqual(queryJson(root, '$.order[::-2].id').map(node => node.preview), ['9007199254740994', '9007199254740992']);
  assert.equal(queryJson(root, "$['a/b~c']")[0], locatePointer(root, '/a~1b~0c'));
  assert.equal(queryJson(root, '$.order[::0]').length, 0);
  assert.throws(() => queryJson(root, '$.order[?window.alert(1)]'), /JSONPath/);
  assert.throws(() => queryJson(root, '$.order[9007199254740993]'), /安全整数/);
  assert(compareJsonNumbers('1.00000000000000000001', '1.000000000000000000001') > 0);
  assert(compareJsonNumbers('-1e700', '-1e699') < 0);
  assert.equal(compareJsonNumbers('1.20e-20', '12e-21'), 0);
  assert.equal(jsonNumberFits('1e-400'), false);
  assert.equal(jsonNumberFits('1.000'), true);
});

test('sorting, deduplication and comparison retain exact numbers and locate duplicate copies', () => {
  const input = '[{"a":9007199254740993},{"a":9007199254740992},{"a":9007199254740993},"keep"]';
  const root = requireJson(input);
  const sorted = organizeJson(input, root, 'sort-array', 1, 'a');
  assert.equal(sorted.source, '[{"a":9007199254740992},{"a":9007199254740993},{"a":9007199254740993},"keep"]');
  const deduped = organizeJson(input, root, 'dedupe', 1, 'a');
  assert.equal(deduped.source, '[{"a":9007199254740993},{"a":9007199254740992},"keep"]');
  assert.equal(deduped.affected, 1);
  const keyed = '{"z":1.20e-20,"2":-0,"10":"00"}';
  assert.equal(organizeJson(keyed, requireJson(keyed), 'sort-keys', 1).source, '{"10":"00","2":-0,"z":1.20e-20}');
  const structural = '[{"n":1,"v":["a"]},{"v":["\\u0061"],"n":1.0}]';
  assert.equal(organizeJson(structural, requireJson(structural), 'dedupe', 1).source, '[{"n":1,"v":["a"]}]');
  const before = requireJson('{"v":{"a":1.0,"b":2},"a/b~c":[9007199254740993,3]}');
  const after = requireJson('{"a/b~c":[9007199254740992],"v":{"b":2,"a":1e0},"extra":false}');
  assert.deepEqual(compareJsonDocuments(before, after).map(row => [row.path, row.type]),
    [['/a~1b~0c/0', 'changed'], ['/a~1b~0c/1', 'removed'], ['/extra', 'added']]);
  const duplicate = '{"n":1,"n":2,"safe":3}';
  const document = parseJsonDocument(duplicate);
  assert.throws(() => requireJson(duplicate), /重复键/);
  const edit = duplicateRemoval(document.root, document.duplicates[0].original);
  assert.equal(duplicate.slice(0, edit.from) + edit.insert + duplicate.slice(edit.to), '{"n":2,"safe":3}');
});

test('CSV imports text cells and YAML round trips uncommon keys, alias values and exact numbers', async () => {
  assert.deepEqual(JSON.parse(csvToJson('\uFEFFid,note\r\n001,"Hi,\r\nthere ""friend"""\r\n002,""')),
    [{ id: '001', note: 'Hi,\r\nthere "friend"' }, { id: '002', note: '' }]);
  assert.throws(() => csvToJson('id,id\n1,2'), /重复/);
  assert.throws(() => csvToJson('id,key\n1'), /列数/);
  assert.throws(() => csvToJson('id\n"1'), /未闭合/);
  const source = '[{"id":9007199254740993, "01":0.1234567890123456789012, "with space":[true,null,{},[]]}, {"id":2, "text":"null"}]';
  const csv = await convertJson('to-csv', source);
  assert.match(csv.value, /^id,01,with space,text\r\n9007199254740993,0.1234567890123456789012,/);
  assert.equal(csv.extension, 'csv');
  const yaml = await convertJson('to-yaml', source);
  assert.equal(formatJson(await yamlToJson(yaml.value), 0), formatJson(source, 0));
  assert.match(await yamlToJson('base: &row { id: 9007199254740993 }\ncopy: *row'), /"copy": \{\n {4}"id": 9007199254740993/);
  await assert.rejects(yamlToJson('x: &loop { self: *loop }'), /循环/);
  await assert.rejects(yamlToJson('x: 1\n---\ny: 2'));
  const types = await convertJson('to-typescript', '[{"id":1,"is-on":true},{"id":"2"},{"id":null}]');
  assert.match(types.value, /"id": number \| string \| null;/);
  assert.match(types.value, /"is-on"\?: boolean;/);
});

test('Schema validates local references and diagnoses unsafe values without mutating inputs', async () => {
  const asset = '{"a/b~c":{"mode":"maybe"},"empty":{}}';
  const schema = parseSchemaText('{"$schema":"https://json-schema.org/draft/2020-12/schema","$defs":{"record":{"type":"object","required":["mode"],"properties":{"mode":{"enum":["yes","no"]},"extra":{"type":"integer"}}}},"properties":{"a/b~c":{"$ref":"#/$defs/record"},"empty":{"$ref":"#/$defs/record"}}}');
  const original = JSON.stringify(schema);
  const root = requireJson(asset);
  const issues = await validateJsonSchema(schema, asset, root);
  assert(issues.some(issue => issue.path === '/a~1b~0c/mode' && asset.slice(issue.range.from, issue.range.to) === '"maybe"'));
  assert(issues.some(issue => issue.path === '/empty' && asset.slice(issue.range.from, issue.range.to) === '{}'));
  assert.equal(JSON.stringify(schema), original);
  const section = locatePointer(root, '/a~1b~0c');
  assert.deepEqual(jsonSchemaHints(schema, section).keys, ['extra']);
  assert.deepEqual(jsonSchemaHints(schema, locatePointer(root, '/empty'), 'mode').values, ['"yes"', '"no"']);
  const huge = '{"number":9007199254740993}';
  assert.match((await validateJsonSchema(true, huge, requireJson(huge)))[0].message, /精确/);
  const draft7 = parseSchemaText('{"$schema":"http://json-schema.org/draft-07/schema#","type":"array","items":[{"type":"number"}]}');
  assert.equal((await validateJsonSchema(draft7, '[1]', requireJson('[1]'))).length, 0);
  assert.throws(() => parseSchemaText('{"$ref":"https://schema.example/example"}'), /当前文档/);
  assert.throws(() => parseSchemaText('{"type":"invalid"}'), /type/);
  assert.throws(() => parseSchemaText('{"minimum":"low"}'), /数值约束/);
  assert.throws(() => parseSchemaText('{"pattern":"["}'), /正则表达式/);
});
