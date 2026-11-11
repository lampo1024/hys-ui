import type { StyleValue, VNodeChild } from "vue";

export type HysNumberValue = number | string;
export type HysNumberDirection = "up" | "down" | "none";
export type HysNumberStatus =
  "idle" | "delayed" | "playing" | "paused" | "stopped" | "finished";
export type HysNumberEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "spring"
  | "bounce"
  | readonly [number, number, number, number]
  | ((progress: number) => number);
export type HysNumberInterrupt = "retarget" | "restart" | "queue" | "snap";
export type HysNumberTrigger =
  "mount" | "update" | "manual" | "click" | "hover" | "visible";
export type HysNumberEffect =
  | "count"
  | "odometer"
  | "wheel"
  | "flip"
  | "slot"
  | "random"
  | "fade"
  | "scale"
  | "bounce"
  | "spring"
  | "slide"
  | "blur"
  | "appear"
  | "disappear"
  | "flash"
  | "highlight"
  | "gradient";
export type HysNumberRounding =
  "half-up" | "half-even" | "floor" | "ceil" | "trunc";
export type HysNumberFormat = "decimal" | "percent" | "currency" | "scientific";

export interface HysNumberAnimationOptions {
  /** 目标值。十进制字符串可保留超出 Number 安全范围的精度。 */
  value?: HysNumberValue;
  /** 起始值。省略时首次直接显示目标值，后续从当前显示值过渡。 */
  from?: HysNumberValue;
  /** 单轮时长，单位毫秒。默认 650，非正数直接到达终点。 */
  duration?: number;
  /** 每次新播放的等待毫秒数，循环的后续轮次立即开始。 */
  delay?: number;
  /** 播放速度倍率，影响延迟与时长，默认 1。 */
  speed?: number;
  /** 缓动名称、四元组 [x1, y1, x2, y2] 或返回进度的函数。默认 ease-out。 */
  easing?: HysNumberEasing;
  /** true 无限循环，正整数表示总轮数，默认 1。 */
  loop?: boolean | number;
  /** 循环轮次交替方向。 */
  alternate?: boolean;
  /** 更新策略。retarget 从当前帧衔接，restart 回到起点，queue 逐个播放，snap 立即显示。 */
  interrupt?: HysNumberInterrupt;
  /** queue 等待项上限，默认 32，范围 1–256。满时丢弃最旧的等待项。 */
  queueLimit?: number;
  /** retarget / restart 的最短更新时间间隔，单位毫秒。间隔内保留最新目标。 */
  updateInterval?: number;
  /** 最大采样帧率，范围 1–120，默认随浏览器刷新率采样。 */
  fps?: number;
  /** 直接显示目标值。全局动效关闭与系统减少动态效果也会立即完成。 */
  disabled?: boolean;
  /** 页面隐藏时冻结计时，可见时继续，默认 true。 */
  pauseWhenHidden?: boolean;
}

export interface HysNumberFrame {
  value: HysNumberValue;
  from: HysNumberValue;
  to: HysNumberValue;
  progress: number;
  easedProgress: number;
  direction: HysNumberDirection;
  status: HysNumberStatus;
  iteration: number;
}

export interface HysNumberComposableOptions extends HysNumberAnimationOptions {
  /** 指定是否在挂载时播放，省略时提供 from 即播放。 */
  autoPlay?: boolean;
  /** 监听 value 并应用更新策略，默认 true。 */
  autoUpdate?: boolean;
}

export interface HysNumberTrend {
  previous: HysNumberValue;
  target: HysNumberValue;
  direction: HysNumberDirection;
  delta: string | null;
  percent: string | null;
  significant: boolean;
}

export type HysNumberEvent =
  | "start"
  | "update"
  | "progress"
  | "pause"
  | "resume"
  | "end"
  | "cancel"
  | "loop";

export interface HysNumberControls {
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  restart: () => void;
  reset: () => void;
  reverse: () => void;
  seek: (progress: number) => void;
  finishAnimation: () => void;
}

export interface HysNumberUnitRule {
  /** 按绝对值匹配的最小值，优先使用匹配规则中阈值最大的一项。 */
  threshold: HysNumberValue;
  /** 缩放除数，省略时使用 threshold。 */
  divisor?: HysNumberValue;
  label: string;
}

export interface HysNumberFormatOptions {
  /** 小数位数的兼容属性，precision 优先。 */
  decimals?: number;
  /** 固定小数位数，范围 0–100。省略时普通字符串保留有效精度。 */
  precision?: number;
  /** 去掉末尾小数零及多余的小数点。 */
  trimZeros?: boolean;
  /** 整数最小位数，范围 1–21，不足时补零。 */
  minimumIntegerDigits?: number;
  /** 舍入规则，默认 half-up，恰好一半时远离零。 */
  rounding?: HysNumberRounding;
  /** 千分位符号。空字符串关闭分组，省略时由 grouping 和 locale 决定。 */
  groupSeparator?: string;
  /** 小数点符号。省略时使用地区格式或句点。 */
  decimalSeparator?: string;
  /** 是否按地区习惯分组。省略时指定 locale 才默认开启。 */
  grouping?: boolean;
  /** BCP 47 地区或语言标签，例如 zh-CN、de-DE、hi-IN、ar-EG。 */
  locale?: string | string[];
  /** decimal、percent、currency 或 scientific。默认 decimal。 */
  numberFormat?: HysNumberFormat;
  /** percent 的数据约定，ratio（默认）下 0.42 显示为 42%，points 下 42 显示为 42%。 */
  percentInput?: "ratio" | "points";
  /** ISO 4217 货币代码，例如 CNY、USD 或 EUR。默认 CNY。 */
  currency?: string;
  /** 替换地区格式生成的货币符号，保留符号位置。 */
  currencySymbol?: string;
  /** 使用 symbol、narrowSymbol 或 code 显示币种。默认 symbol。 */
  currencyDisplay?: "symbol" | "narrowSymbol" | "code";
  /** 自动单位。short 使用 K/M/B/T，zh 使用万/亿/万亿，也可传自定义规则数组。 */
  compact?: "short" | "zh" | readonly HysNumberUnitRule[];
  /** 在自动缩写单位之后附加文字。 */
  unit?: string;
  /** 正负号显示策略。默认 auto，仅显示负号。 */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /** 自定义正号。需设置 signDisplay="always" 或 "exceptZero"。 */
  positiveSign?: string;
  /** 自定义负号。 */
  negativeSign?: string;
}

export interface HysAnimatedNumberContext extends HysNumberFrame {
  displayValue: string;
  unit: string;
  remaining?: number;
  trend: HysNumberTrend;
}

export interface HysNumberDigitContext extends HysAnimatedNumberContext {
  digit: string;
  index: number;
  position: number;
  section: "integer" | "fraction";
  digitProgress: number;
}

export interface HysAnimatedNumberProps
  extends HysNumberAnimationOptions, HysNumberFormatOptions {
  /** v-model 的目标值。与 value 同时传入时优先。 */
  modelValue?: HysNumberValue;
  /** 可组合的播放触发条件。默认 mount 和 update，manual 仅响应实例方法。 */
  trigger?: HysNumberTrigger | readonly HysNumberTrigger[];
  /** 自动和用户交互触发时的条件，可接收触发原因与最新目标值。 */
  canPlay?:
    boolean | ((trigger: HysNumberTrigger, target: HysNumberValue) => boolean);
  /** 进入视口触发时只播放一次，默认 true。 */
  visibleOnce?: boolean;
  /** 离开视口暂停并在重新进入时继续。 */
  pauseOutside?: boolean;
  /** 可视比例 0–1，默认 0.2。 */
  visibilityThreshold?: number;
  /** 数字动画效果，可传数组组合。默认 count。 */
  effect?: HysNumberEffect | readonly HysNumberEffect[];
  /** 滚轮与滑动方向，默认 vertical。 */
  axis?: "vertical" | "horizontal";
  /** 逐位启动间隔，单位毫秒。 */
  stagger?: number;
  /** 单位数字动效时长，单位毫秒。省略时使用剩余的播放时间。 */
  digitDuration?: number;
  /** high-to-low 从高位开始，low-to-high 从低位开始。 */
  digitOrder?: "high-to-low" | "low-to-high";
  /** 数值区域的自定义逐帧样式，可与内置效果组合。 */
  animationStyle?: (context: HysAnimatedNumberContext) => StyleValue;
  /** 为起点和终点文本预留宽度，并保留当前内容的自然宽度。 */
  stableWidth?: boolean;
  /** 启用正负值的语义配色。 */
  colorBySign?: boolean;
  /** 按最近一次目标值增减配色，优先于 colorBySign。 */
  colorByDirection?: boolean;
  /** 差值绝对值达到此阈值时标记 significant 并触发 threshold 事件。 */
  changeThreshold?: HysNumberValue;
  /** 展示统计标题，title 插槽优先。 */
  title?: string;
  /** 数值前的文本，prefix 插槽优先。 */
  prefix?: string;
  /** 数值后的文本，suffix 插槽优先。 */
  suffix?: string;
  /** 应用到数值区域的 Vue 样式。 */
  valueStyle?: StyleValue;
  /** 接收当前值、格式文本、播放状态与趋势，可返回文字或 VNode。 */
  formatter?: (context: HysAnimatedNumberContext) => VNodeChild;
  /** 朗读结束值和倒计时结束值。默认静默更新。 */
  announce?: boolean;
  /** 启用截止时间倒计时，传 Unix 毫秒时间戳或 Date。 */
  deadline?: number | Date;
  /** 倒计时模板支持 D、DD、H、HH、m、mm、s、ss、SSS，字面文本使用方括号。 */
  format?: string;
}

export interface HysAnimatedNumberInstance extends HysNumberControls {
  displayValue: string;
  remaining: number;
  frame: HysNumberFrame;
  trend: HysNumberTrend;
  setValue: (target: HysNumberValue) => void;
}
