import type { HysNumberAnimationEntry, HysNumberValue } from "hys-ui";

type View =
  | "bar"
  | "ring"
  | "gauge"
  | "line"
  | "chart"
  | "rank"
  | "battery"
  | "thermometer"
  | "water"
  | "scale"
  | "award";
export interface Sample {
  from: HysNumberValue;
  to: HysNumberValue;
  currency?: boolean;
  percent?: boolean;
  precision?: number;
  suffix?: string;
  view?: View;
  sign?: boolean;
}

const data: Sample[] = [
  { from: 998.75, to: 1205.8, currency: true },
  { from: 1290.45, to: 825.1, currency: true },
  { from: 128.06, to: 128.95, currency: true },
  { from: 1250, to: 680, currency: true },
  { from: -46, to: 82, sign: true },
  { from: 986, to: 12587 },
  { from: 998, to: 1002 },
  { from: 1002, to: 998 },
  { from: 42, to: 86 },
  { from: 86, to: 42 },
  { from: 580, to: 741, sign: true },
  { from: 42.5, to: 68.4, percent: true, precision: 1 },
  { from: 8, to: 24, percent: true, sign: true },
  { from: 68, to: 92, percent: true, view: "bar" },
  { from: 72, to: 100, percent: true, view: "ring" },
  { from: 88, to: 126, percent: true, view: "ring" },
  { from: 20, to: 82, percent: true, view: "bar" },
  { from: 18, to: 76, percent: true, view: "ring" },
  { from: 25, to: 82, view: "gauge" },
  { from: 32, to: 72, view: "line" },
  { from: 22, to: 84, view: "chart" },
  { from: 540, to: 720, view: "rank" },
  { from: 460, to: 812, view: "rank" },
  { from: 825, to: 465, view: "rank" },
  { from: 64, to: 82, percent: true },
  { from: 98, to: 54, percent: true },
  { from: 72, to: 98, percent: true },
  { from: 86, to: 23, percent: true },
  { from: 518.25, to: 826.96, currency: true },
  { from: 2412, to: 2584, suffix: "单" },
];

const special: Sample[] = [
  { from: 0, to: 15 },
  { from: 0, to: 28.6, suffix: "秒", precision: 1 },
  { from: 246813, to: 816279 },
  { from: 1284, to: 7306, suffix: "号" },
  { from: 15, to: 0, suffix: "秒" },
  { from: 780, to: 1000, view: "award" },
  { from: 75, to: 100, percent: true, view: "award" },
  { from: 25, to: 160, suffix: "金币" },
  { from: 120, to: 240, suffix: "金币" },
  { from: 0, to: 888, suffix: "奖励" },
  { from: 87, to: 100, percent: true },
  { from: 90, to: 100, percent: true },
  { from: 8, to: 12, suffix: "枚", view: "award" },
  { from: 4, to: 5, suffix: "星", view: "award" },
  { from: 12, to: 100, percent: true, view: "bar" },
  { from: 18.5, to: 36.8, precision: 1, suffix: "°C", view: "thermometer" },
  { from: 15, to: 84, percent: true, view: "battery" },
  { from: 22, to: 96, suffix: "km/h", view: "gauge" },
  { from: 27, to: 74, percent: true, view: "water" },
  { from: 17, to: 80, suffix: "mm", view: "scale" },
];

export function numberAnimationSample(
  entry: HysNumberAnimationEntry | undefined,
): Sample {
  if (entry?.category === "data") return data[entry.variant];
  if (entry?.category === "special") return special[entry.variant];
  return { from: 2784, to: 9361 };
}
