import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Input: the icons directory from https://github.com/lucide-icons/lucide/tree/0.468.0/icons
const root = fileURLToPath(new URL("../", import.meta.url));
const iconDirectory = path.join(root, "packages/ui/src/components/HysIcon");
const output = path.join(iconDirectory, "builtins/catalog");
const input = process.argv[2];
assert(
  input,
  "Usage: node scripts/generate-icon-catalog.mjs <Lucide icons directory>",
);

const categories = [
  ["access", "账户与安全", "account security people"],
  ["accessibility", "无障碍", "accessibility"],
  ["arrows", "方向", "arrows"],
  ["charts", "数据与图表", "charts math"],
  ["commerce", "商业与物流", "finance shopping"],
  ["communication", "沟通与通知", "communication mail notifications social"],
  ["design", "设计与摄影", "design photography"],
  ["development", "开发与工具", "development tools cursors"],
  ["devices", "设备与网络", "devices connectivity"],
  ["education", "教育与科学", "science"],
  ["emoji", "表情与手势", "emoji"],
  ["files", "文件", "files"],
  ["food", "餐饮", "food-beverage"],
  ["home", "生活与家居", "home"],
  ["layout", "界面与布局", "layout"],
  ["maps", "地图与位置", "navigation buildings travel"],
  ["media", "媒体", "multimedia"],
  ["medical", "医疗健康", "medical"],
  ["nature", "自然与环保", "animals nature sustainability"],
  ["recreation", "运动与游戏", "gaming sports"],
  ["shapes", "形状", "shapes"],
  ["text", "编辑器", "text"],
  ["time", "日期与时间", "time"],
  ["transport", "交通出行", "transportation"],
  ["weather", "天气", "weather"],
];
const categoryByKey = new Map(
  categories.flatMap((group) =>
    group[2].split(" ").map((category) => [category, group]),
  ),
);
const chinese = {
  accessibility: "无障碍",
  add: "添加",
  alarm: "闹钟",
  alert: "警告",
  archive: "归档",
  arrow: "箭头",
  audio: "音频",
  bank: "银行",
  battery: "电池",
  bell: "通知",
  bike: "自行车",
  book: "书籍",
  box: "盒子",
  briefcase: "公文包",
  building: "建筑",
  bus: "公交",
  calendar: "日历",
  camera: "相机",
  car: "汽车",
  chart: "图表",
  check: "完成",
  circle: "圆形",
  clipboard: "剪贴板",
  clock: "时钟",
  cloud: "云端",
  code: "代码",
  coffee: "咖啡",
  color: "颜色",
  command: "命令",
  copy: "复制",
  credit: "信用",
  crop: "裁剪",
  cursor: "光标",
  database: "数据库",
  delete: "删除",
  download: "下载",
  edit: "编辑",
  euro: "欧元",
  eye: "查看",
  file: "文件",
  filter: "筛选",
  flag: "旗标",
  folder: "文件夹",
  font: "字体",
  gift: "礼物",
  globe: "全球",
  grid: "网格",
  hand: "手势",
  headphones: "耳机",
  heart: "爱心",
  help: "帮助",
  history: "历史",
  home: "首页",
  hospital: "医院",
  house: "房屋",
  image: "图片",
  key: "密钥",
  keyboard: "键盘",
  laptop: "笔记本",
  layers: "图层",
  layout: "布局",
  left: "向左",
  link: "链接",
  list: "列表",
  lock: "锁定",
  mail: "邮件",
  map: "地图",
  message: "消息",
  mic: "麦克风",
  minus: "减少",
  monitor: "屏幕",
  moon: "月亮",
  mouse: "鼠标",
  music: "音乐",
  network: "网络",
  notebook: "笔记",
  package: "包裹",
  panel: "面板",
  pen: "笔",
  phone: "电话",
  pin: "定位",
  plane: "飞机",
  play: "播放",
  plug: "插头",
  plus: "添加",
  printer: "打印",
  rain: "下雨",
  range: "范围",
  receipt: "收据",
  remove: "移除",
  right: "向右",
  rotate: "旋转",
  save: "保存",
  scale: "缩放",
  search: "搜索",
  server: "服务器",
  settings: "设置",
  share: "分享",
  shield: "防护",
  shopping: "购物",
  signal: "信号",
  smartphone: "手机",
  snow: "雪",
  sort: "排序",
  square: "方形",
  star: "星标",
  sun: "太阳",
  table: "表格",
  tag: "标签",
  terminal: "终端",
  text: "文本",
  time: "时间",
  timer: "计时",
  toggle: "切换",
  train: "火车",
  trash: "垃圾桶",
  tree: "树",
  truck: "货运",
  unlock: "解锁",
  upload: "上传",
  user: "用户",
  users: "团队",
  video: "视频",
  volume: "音量",
  wallet: "钱包",
  wifi: "无线网络",
  wind: "风",
  zoom: "缩放",
};
const localizedLabels = {
  accessibility: "无障碍设施",
  "book-open": "打开的书",
  "calendar-range": "日期范围",
  "cloud-lightning": "雷暴",
  "file-lock": "锁定文件",
  "folder-tree": "文件夹树",
  "heart-pulse": "心率",
  "panel-top": "顶部面板",
  "train-front": "列车",
};

const builtinsDir = path.join(iconDirectory, "builtins");
const reserved = new Set();
for (const name of fs
  .readdirSync(builtinsDir)
  .filter((file) => file.endsWith(".ts"))) {
  const source = fs.readFileSync(path.join(builtinsDir, name), "utf8");
  for (const match of source.matchAll(
    /^ {2}(?:"([\w-]+)"|([\w-]+)): \w+Icon\(/gm,
  ))
    reserved.add(match[1] ?? match[2]);
  for (const match of source.matchAll(/aliases: \["([\w-]+)"\]/g))
    reserved.add(match[1]);
}
const original = fs.readFileSync(
  path.join(iconDirectory, "iconBuiltins.ts"),
  "utf8",
);
for (const match of original
  .split("  icons: {")[1]
  .matchAll(/^ {4}(?:"([\w-]+)"|([\w-]+)):/gm))
  reserved.add(match[1] ?? match[2]);
for (const match of original.matchAll(/aliases: \["([\w-]+)"\]/g))
  reserved.add(match[1]);

function readNodes(name) {
  const source = fs.readFileSync(path.join(input, name + ".svg"), "utf8");
  const content = source
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  const entries = [
    ...content.matchAll(
      /<(path|circle|ellipse|rect|line|polyline|polygon)\s+([^<>]*?)\s*\/>/g,
    ),
  ];
  assert(
    entries.length && !content.replace(/<[^<>]+\/>/g, "").trim(),
    "Unexpected SVG in " + name,
  );
  return entries.map(([_, tag, raw]) => {
    const pairs = [...raw.matchAll(/([\w-]+)="([^"]*)"/g)];
    assert.equal(raw.replace(/([\w-]+)="([^"]*)"/g, "").trim(), "", name);
    return {
      tag,
      attrs: Object.fromEntries(pairs.map(([, key, value]) => [key, value])),
    };
  });
}

const groupIcons = new Map(categories.map(([slug]) => [slug, []]));
const signatures = new Set();
const canonicals = new Set(reserved);
for (const file of fs
  .readdirSync(input)
  .filter((name) => name.endsWith(".json"))
  .sort()) {
  const name = path.basename(file, ".json");
  const meta = JSON.parse(fs.readFileSync(path.join(input, file), "utf8"));
  if (
    reserved.has(name) ||
    !meta.categories.length ||
    meta.categories.includes("brands")
  )
    continue;
  const group = categoryByKey.get(meta.categories[0]);
  assert(group, "Unknown category for " + name);
  const nodes = readNodes(name);
  const signature = nodes
    .map(({ tag, attrs }) =>
      JSON.stringify([tag, Object.entries(attrs).sort()]),
    )
    .sort()
    .join("\n");
  if (signatures.has(signature)) continue;
  signatures.add(signature);
  canonicals.add(name);
  groupIcons.get(group[0]).push({ name, meta, nodes });
}

function metadata(name, meta, category) {
  const terms = [...new Set([...name.split("-"), ...meta.tags])];
  const keywords = [
    ...new Set([
      ...meta.tags,
      category,
      ...terms.map((term) => chinese[term]).filter(Boolean),
    ]),
  ];
  const aliases = (meta.aliases ?? []).filter((alias) => {
    if (
      typeof alias !== "string" ||
      !/^[a-z0-9][a-z0-9._-]+$/.test(alias) ||
      canonicals.has(alias)
    )
      return false;
    canonicals.add(alias);
    return true;
  });
  const directional =
    /^(?:arrow|chevron|corner|move)(?:s)?-/.test(name) &&
    /(?:^|-)(?:left|right)(?:-|$)/.test(name) &&
    !/(?:left-right|right-left)/.test(name);
  return {
    ...(localizedLabels[name] ? { label: localizedLabels[name] } : {}),
    keywords,
    ...(aliases.length ? { aliases } : {}),
    ...(directional ? { directional } : {}),
  };
}

const manifest = [];
const files = new Map();
for (const [slug, category] of categories) {
  const icons = groupIcons.get(slug);
  const count = Math.ceil(icons.length / 40);
  for (let index = 0; index < count; index++) {
    const chunk = count === 1 ? slug : slug + "-" + (index + 1);
    const items = icons.slice(index * 40, (index + 1) * 40);
    manifest.push({
      chunk,
      category,
      icons: items.map(({ name, meta }) => ({
        name,
        ...metadata(name, meta, category),
      })),
    });
    files.set(
      chunk + ".json",
      "{\n" +
        items
          .map(
            ({ name, nodes }) =>
              "  " + JSON.stringify(name) + ": " + JSON.stringify(nodes),
          )
          .join(",\n") +
        "\n}\n",
    );
  }
}
const total = manifest.reduce((sum, group) => sum + group.icons.length, 0);
assert(total >= 900, "Too few glyphs in the catalog");
files.set(
  "manifest.json",
  "[\n" +
    manifest.map((group) => "  " + JSON.stringify(group)).join(",\n") +
    "\n]\n",
);
fs.mkdirSync(output, { recursive: true });
for (const [name, content] of files)
  fs.writeFileSync(
    path.join(output, name),
    content.endsWith("\n") ? content : content + "\n",
  );
console.log(`Generated ${total} built-in glyphs in ${manifest.length} chunks.`);
