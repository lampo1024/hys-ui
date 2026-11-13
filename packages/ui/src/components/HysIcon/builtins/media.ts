import { iconInCategory } from "./iconInCategory";

const mediaIcon = iconInCategory("媒体");

export const mediaIcons = {
  play: mediaIcon(
    "播放",
    [{ tag: "polygon", attrs: { points: "6 3 20 12 6 21 6 3" } }],
    { keywords: ["开始", "视频", "音乐"] },
  ),
  pause: mediaIcon(
    "暂停",
    [
      {
        tag: "rect",
        attrs: { x: "14", y: "4", width: "4", height: "16", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { x: "6", y: "4", width: "4", height: "16", rx: "1" },
      },
    ],
    { keywords: ["停止", "播放器"] },
  ),
  square: mediaIcon(
    "停止",
    [
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "3", rx: "2" },
      },
    ],
    { keywords: ["方块", "播放器"], aliases: ["stop"] },
  ),
  "skip-back": mediaIcon(
    "上一首",
    [
      { tag: "polygon", attrs: { points: "19 20 9 12 19 4 19 20" } },
      { tag: "line", attrs: { x1: "5", x2: "5", y1: "19", y2: "5" } },
    ],
    { keywords: ["上一段", "跳过", "回放"] },
  ),
  "skip-forward": mediaIcon(
    "下一首",
    [
      { tag: "polygon", attrs: { points: "5 4 15 12 5 20 5 4" } },
      { tag: "line", attrs: { x1: "19", x2: "19", y1: "5", y2: "19" } },
    ],
    { keywords: ["下一段", "跳过", "快进"] },
  ),
  "volume-2": mediaIcon(
    "音量",
    [
      {
        tag: "path",
        attrs: {
          d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
        },
      },
      { tag: "path", attrs: { d: "M16 9a5 5 0 0 1 0 6" } },
      { tag: "path", attrs: { d: "M19.364 18.364a9 9 0 0 0 0-12.728" } },
    ],
    { keywords: ["扬声器", "声音"], aliases: ["volume"] },
  ),
  "volume-x": mediaIcon(
    "静音",
    [
      {
        tag: "path",
        attrs: {
          d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
        },
      },
      { tag: "line", attrs: { x1: "22", x2: "16", y1: "9", y2: "15" } },
      { tag: "line", attrs: { x1: "16", x2: "22", y1: "9", y2: "15" } },
    ],
    { keywords: ["音量", "关闭声音"], aliases: ["mute"] },
  ),
  mic: mediaIcon(
    "麦克风",
    [
      {
        tag: "path",
        attrs: { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" },
      },
      { tag: "path", attrs: { d: "M19 10v2a7 7 0 0 1-14 0v-2" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "19", y2: "22" } },
    ],
    { keywords: ["录音", "语音", "话筒"], aliases: ["microphone"] },
  ),
  "mic-off": mediaIcon(
    "麦克风关闭",
    [
      { tag: "line", attrs: { x1: "2", x2: "22", y1: "2", y2: "22" } },
      { tag: "path", attrs: { d: "M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" } },
      { tag: "path", attrs: { d: "M5 10v2a7 7 0 0 0 12 5" } },
      { tag: "path", attrs: { d: "M15 9.34V5a3 3 0 0 0-5.68-1.33" } },
      { tag: "path", attrs: { d: "M9 9v3a3 3 0 0 0 5.12 2.12" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "19", y2: "22" } },
    ],
    { keywords: ["关闭语音", "静音"] },
  ),
  camera: mediaIcon(
    "相机",
    [
      {
        tag: "path",
        attrs: {
          d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
        },
      },
      { tag: "circle", attrs: { cx: "12", cy: "13", r: "3" } },
    ],
    { keywords: ["拍摄", "摄影", "照片"] },
  ),
  video: mediaIcon(
    "摄像机",
    [
      {
        tag: "path",
        attrs: {
          d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
        },
      },
      {
        tag: "rect",
        attrs: { x: "2", y: "6", width: "14", height: "12", rx: "2" },
      },
    ],
    { keywords: ["录制", "视频", "会议"] },
  ),
  music: mediaIcon(
    "音乐",
    [
      { tag: "path", attrs: { d: "M9 18V5l12-2v13" } },
      { tag: "circle", attrs: { cx: "6", cy: "18", r: "3" } },
      { tag: "circle", attrs: { cx: "18", cy: "16", r: "3" } },
    ],
    { keywords: ["音符", "音频", "曲目"] },
  ),
};

const locationIcon = iconInCategory("地图与位置");

export const locationIcons = {
  "map-pin": locationIcon(
    "地点",
    [
      {
        tag: "path",
        attrs: {
          d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        },
      },
      { tag: "circle", attrs: { cx: "12", cy: "10", r: "3" } },
    ],
    { keywords: ["地图", "坐标", "地址"], aliases: ["location"] },
  ),
  map: locationIcon(
    "地图",
    [
      {
        tag: "path",
        attrs: {
          d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
        },
      },
      { tag: "path", attrs: { d: "M15 5.764v15" } },
      { tag: "path", attrs: { d: "M9 3.236v15" } },
    ],
    { keywords: ["地理", "路网", "区域"] },
  ),
  route: locationIcon(
    "路线",
    [
      { tag: "circle", attrs: { cx: "6", cy: "19", r: "3" } },
      {
        tag: "path",
        attrs: { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" },
      },
      { tag: "circle", attrs: { cx: "18", cy: "5", r: "3" } },
    ],
    { keywords: ["路径", "行程", "规划"] },
  ),
  flag: locationIcon(
    "旗标",
    [
      {
        tag: "path",
        attrs: {
          d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
        },
      },
      { tag: "line", attrs: { x1: "4", x2: "4", y1: "22", y2: "15" } },
    ],
    { keywords: ["标记", "目标", "里程碑"] },
  ),
  globe: locationIcon(
    "地球",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
      {
        tag: "path",
        attrs: { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" },
      },
      { tag: "path", attrs: { d: "M2 12h20" } },
    ],
    { keywords: ["全球", "语言", "国际化"] },
  ),
  "locate-fixed": locationIcon(
    "当前位置",
    [
      { tag: "line", attrs: { x1: "2", x2: "5", y1: "12", y2: "12" } },
      { tag: "line", attrs: { x1: "19", x2: "22", y1: "12", y2: "12" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "2", y2: "5" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "19", y2: "22" } },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "7" } },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } },
    ],
    { keywords: ["定位", "准星", "GPS"] },
  ),
  "building-2": locationIcon(
    "楼宇",
    [
      {
        tag: "path",
        attrs: { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" },
      },
      { tag: "path", attrs: { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" } },
      { tag: "path", attrs: { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" } },
      { tag: "path", attrs: { d: "M10 6h4" } },
      { tag: "path", attrs: { d: "M10 10h4" } },
      { tag: "path", attrs: { d: "M10 14h4" } },
      { tag: "path", attrs: { d: "M10 18h4" } },
    ],
    { keywords: ["建筑", "机构", "办公室"], aliases: ["building"] },
  ),
  earth: locationIcon(
    "世界",
    [
      { tag: "path", attrs: { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54" } },
      {
        tag: "path",
        attrs: {
          d: "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",
        },
      },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
    ],
    { keywords: ["全球", "地球", "地理"], aliases: ["world"] },
  ),
};
