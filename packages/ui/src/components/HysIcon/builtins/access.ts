import { iconInCategory } from "./iconInCategory";

const accountIcon = iconInCategory("账户与安全");

export const accountIcons = {
  users: accountIcon(
    "用户组",
    [
      {
        tag: "path",
        attrs: { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
      },
      { tag: "circle", attrs: { cx: "9", cy: "7", r: "4" } },
      { tag: "path", attrs: { d: "M22 21v-2a4 4 0 0 0-3-3.87" } },
      { tag: "path", attrs: { d: "M16 3.13a4 4 0 0 1 0 7.75" } },
    ],
    { keywords: ["成员", "团队", "群组"], aliases: ["team"] },
  ),
  "user-plus": accountIcon(
    "添加用户",
    [
      {
        tag: "path",
        attrs: { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
      },
      { tag: "circle", attrs: { cx: "9", cy: "7", r: "4" } },
      { tag: "line", attrs: { x1: "19", x2: "19", y1: "8", y2: "14" } },
      { tag: "line", attrs: { x1: "22", x2: "16", y1: "11", y2: "11" } },
    ],
    { keywords: ["邀请", "创建账号"] },
  ),
  "user-check": accountIcon(
    "已验证用户",
    [
      {
        tag: "path",
        attrs: { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
      },
      { tag: "circle", attrs: { cx: "9", cy: "7", r: "4" } },
      { tag: "polyline", attrs: { points: "16 11 18 13 22 9" } },
    ],
    { keywords: ["身份", "已通过", "账号"] },
  ),
  contact: accountIcon(
    "联系人",
    [
      { tag: "path", attrs: { d: "M16 2v2" } },
      { tag: "path", attrs: { d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" } },
      { tag: "path", attrs: { d: "M8 2v2" } },
      { tag: "circle", attrs: { cx: "12", cy: "11", r: "3" } },
      {
        tag: "rect",
        attrs: { x: "3", y: "4", width: "18", height: "18", rx: "2" },
      },
    ],
    { keywords: ["通讯录", "个人资料"] },
  ),
  "id-card": accountIcon(
    "证件",
    [
      { tag: "path", attrs: { d: "M16 10h2" } },
      { tag: "path", attrs: { d: "M16 14h2" } },
      { tag: "path", attrs: { d: "M6.17 15a3 3 0 0 1 5.66 0" } },
      { tag: "circle", attrs: { cx: "9", cy: "11", r: "2" } },
      {
        tag: "rect",
        attrs: { x: "2", y: "5", width: "20", height: "14", rx: "2" },
      },
    ],
    { keywords: ["身份", "名片", "证件照"] },
  ),
  "badge-check": accountIcon(
    "认证",
    [
      {
        tag: "path",
        attrs: {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
        },
      },
      { tag: "path", attrs: { d: "m9 12 2 2 4-4" } },
    ],
    { keywords: ["徽章", "资质", "校验"], aliases: ["verified"] },
  ),
  lock: accountIcon(
    "锁定",
    [
      {
        tag: "rect",
        attrs: { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" },
      },
      { tag: "path", attrs: { d: "M7 11V7a5 5 0 0 1 10 0v4" } },
    ],
    { keywords: ["密码", "加密", "权限"] },
  ),
  "lock-open": accountIcon(
    "解锁",
    [
      {
        tag: "rect",
        attrs: { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" },
      },
      { tag: "path", attrs: { d: "M7 11V7a5 5 0 0 1 9.9-1" } },
    ],
    { keywords: ["开放", "解除锁定"], aliases: ["unlock"] },
  ),
  "key-round": accountIcon(
    "密钥",
    [
      {
        tag: "path",
        attrs: {
          d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
        },
      },
      {
        tag: "circle",
        attrs: { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" },
      },
    ],
    { keywords: ["钥匙", "令牌", "凭证"], aliases: ["key"] },
  ),
  shield: accountIcon(
    "安全防护",
    [
      {
        tag: "path",
        attrs: {
          d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        },
      },
    ],
    { keywords: ["盾牌", "保护", "权限"] },
  ),
  "shield-check": accountIcon(
    "安全验证",
    [
      {
        tag: "path",
        attrs: {
          d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        },
      },
      { tag: "path", attrs: { d: "m9 12 2 2 4-4" } },
    ],
    { keywords: ["可信", "防护", "审核"] },
  ),
  "shield-alert": accountIcon(
    "安全警告",
    [
      {
        tag: "path",
        attrs: {
          d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        },
      },
      { tag: "path", attrs: { d: "M12 8v4" } },
      { tag: "path", attrs: { d: "M12 16h.01" } },
    ],
    { keywords: ["风险", "防护", "异常"] },
  ),
  fingerprint: accountIcon(
    "指纹",
    [
      {
        tag: "path",
        attrs: { d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" },
      },
      { tag: "path", attrs: { d: "M14 13.12c0 2.38 0 6.38-1 8.88" } },
      { tag: "path", attrs: { d: "M17.29 21.02c.12-.6.43-2.3.5-3.02" } },
      { tag: "path", attrs: { d: "M2 12a10 10 0 0 1 18-6" } },
      { tag: "path", attrs: { d: "M2 16h.01" } },
      { tag: "path", attrs: { d: "M21.8 16c.2-2 .131-5.354 0-6" } },
      { tag: "path", attrs: { d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" } },
      { tag: "path", attrs: { d: "M8.65 22c.21-.66.45-1.32.57-2" } },
      { tag: "path", attrs: { d: "M9 6.8a6 6 0 0 1 9 5.2v2" } },
    ],
    { keywords: ["生物识别", "身份验证"] },
  ),
};
