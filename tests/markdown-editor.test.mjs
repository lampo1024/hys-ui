import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { HysMarkdownEditor } from '../packages/ui/dist/index.js';
import { formatMarkdown, insertMarkdownBlock, insertMarkdownLink, markdownUrl, readMarkdownFile } from '../packages/ui/dist/components/HysMarkdownEditor/markdownSource.js';
import { findMarkdownLink, parseMarkdown, taskMarker } from '../packages/ui/dist/components/HysMarkdownEditor/markdownPreview.js';

function apply(source, edit) {
  const { from, to, insert } = edit.changes;
  return source.slice(0, from) + insert + source.slice(to);
}

function elements(tree, tag) {
  return (tree.type === 'element' && tree.tagName === tag ? [tree] : []).concat(
    (tree.children ?? []).flatMap(child => elements(child, tag)),
  );
}

test('Markdown format commands handle selected lines, delimiters and table and code templates', () => {
  const source = 'First\nSecond\nThird';
  assert.equal(apply(source, formatMarkdown(source, { from: 1, to: 13 }, 'numbered')), '1. First\n2. Second\nThird');
  assert.equal(apply(source, formatMarkdown(source, { from: 0, to: 12 }, 'bold')), '**First**\n**Second**\nThird');
  assert.equal(apply('**word**', formatMarkdown('**word**', { from: 2, to: 6 }, 'bold')), 'word');
  assert.equal(apply('## Heading', formatMarkdown('## Heading', { from: 9, to: 9 }, 'heading', 0)), 'Heading');
  const table = insertMarkdownBlock('', { from: 0, to: 0 }, 'table', { rows: 2, columns: 3 });
  assert.equal(elements(parseMarkdown(table.changes.insert, 'demo').root, 'td').length, 6);
  const code = '  ```\nfoo';
  const fenced = insertMarkdownBlock(code, { from: 0, to: code.length }, 'code', { language: 'js' });
  assert.match(fenced.changes.insert, /^````js\n/);
});

test('Markdown preview renders GFM, scopes heading anchors, and blocks HTML and unsafe URLs', () => {
  const source = [
    '# 重复', '# 重复', '', '- [ ] parent', '  - [x] nested', '', '| A | B |', '| --- | --- |', '| 1 | 2 |',
    '', '<script>alert(1)</script><img src=x onerror=alert(1)>', '', '[bad](javascript:alert%281%29) [good](../doc) https://example.org',
    '', '![blocked](http://example.org/p.png) ![allowed](https://example.org/p.png)', '', '~~old~~',
  ].join('\n');
  const rendered = parseMarkdown(source, 'left');
  assert.deepEqual([...rendered.anchors.keys()], ['重复', '重复-1']);
  assert.equal(elements(rendered.root, 'script').length, 0);
  assert.match(JSON.stringify(rendered.root), /<script>/);
  assert.deepEqual(elements(rendered.root, 'a').map(n => n.properties.href), [undefined, '../doc', 'https://example.org']);
  assert.deepEqual(elements(rendered.root, 'img').map(n => n.properties.src), [undefined, 'https://example.org/p.png']);
  assert.equal(elements(rendered.root, 'table').length, 1);
  assert.equal(elements(rendered.root, 'del').length, 1);
  const tasks = elements(rendered.root, 'li').map(n => taskMarker(source, n.position.start.offset));
  assert.deepEqual(tasks.map(task => source[task.offset]), [' ', 'x']);
  assert.equal(parseMarkdown(source, 'right').headings[0].id, 'right-heading-0');
});

test('Markdown link editing retains existing label markup and replaces a reference locally', () => {
  const source = 'See [**release**][notes].\n\n[notes]: /old "Info"';
  const record = findMarkdownLink(source, { from: 10, to: 10 }, false);
  assert.equal(record.url, '/old');
  assert.equal(record.title, 'Info');
  const changed = insertMarkdownLink(record.range, false, record.text, '/new(v2)', record.title, record.labelSource);
  assert.equal(apply(source, changed), 'See [**release**](</new(v2)> "Info").\n\n[notes]: /old "Info"');
  for (const input of ['javascript:alert(1)', '//example.com', 'https://user:pass@example.com', 'data:image/png;base64,test']) {
    assert.equal(markdownUrl(input), undefined);
    assert.equal(markdownUrl(input, true), undefined);
  }
  assert.equal(markdownUrl('../guide#overview'), '../guide#overview');
  assert.equal(markdownUrl('./logo.png', true), undefined);
});

test('Markdown file reading decodes UTF-8 and rejects invalid data or file types', async () => {
  assert.equal(await readMarkdownFile(new File(['\uFEFF# 交接记录\r\n'], '交接.MD')), '# 交接记录\r\n');
  await assert.rejects(readMarkdownFile(new File([new Uint8Array([0xc3, 0x28])], 'bad.md')), /UTF-8/);
  await assert.rejects(readMarkdownFile(new File(['text'], 'bad.txt')), /\.md/);
  await assert.rejects(readMarkdownFile({ name: 'bad.md', arrayBuffer: () => Promise.reject(new Error('failed')) }), /无法读取/);
});

test('Markdown editor renders a sanitized preview in server-side rendering', async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(HysMarkdownEditor, { view: 'preview', modelValue: '# Guide\n\n<script>alert(1)</script>' }),
  }));
  assert.match(html, /<h1[^>]*>Guide<\/h1>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
