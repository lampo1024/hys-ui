export interface HysChartPoint {
  label: string;
  value: number | null;
  /** Stable point identifier within its series. */
  id?: string | number;
  color?: string;
  /** Legend group for pie or donut charts. */
  legendGroup?: string;
  /** Short legend label for selected and grouped layouts. */
  legendLabel?: string;
  /** Numeric coordinate used by a value axis or scatter chart. */
  x?: number;
  /** ISO timestamp, Date or epoch milliseconds for a time axis. */
  time?: string | Date | number;
}

export interface HysChartReference {
  value: number;
  label: string;
  color?: string;
  yAxis?: 0 | 1;
}

export type HysChartType =
  | "bar"
  | "horizontal-bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "combo"
  | "radar"
  | "funnel"
  | "gauge"
  | "heatmap";
export type HysChartLegendLayout =
  "compact" | "selected" | "grouped" | "sidebar" | "paged";
export type HysChartBarStyle = "solid" | "gradient" | "outline";
export type HysChartMissing = "gap" | "connect" | "zero";

export interface HysChartAxis {
  min?: number;
  max?: number;
  ticks?: readonly number[];
  tickCount?: number;
  unit?: string;
  includeZero?: boolean;
  formatter?: (value: number) => string;
}

export interface HysChartXAxis extends Omit<HysChartAxis, "min" | "max"> {
  type?: "category" | "value" | "time";
  min?: number | string | Date;
  max?: number | string | Date;
}

/** Category indices (zero-based), numeric coordinates or epoch milliseconds. */
export interface HysChartRange {
  start: number;
  end: number;
}

export interface HysChartCursor {
  /** X coordinate in milliseconds, numeric units or a category index. */
  value: number;
  locked: boolean;
}

export interface HysChartRangePreset {
  label: string;
  /** Inclusive calendar days ending at the last day of the domain. Omit for the full range. */
  days?: number;
}

export interface HysChartSeries {
  id?: string;
  name: string;
  legendGroup?: string;
  legendLabel?: string;
  data: readonly HysChartPoint[];
  color?: string;
  type?: "bar" | "line" | "area";
  dashed?: boolean;
  yAxis?: 0 | 1;
}

export interface HysChartSelection {
  point: HysChartPoint;
  series: HysChartSeries;
  pointIndex: number;
  seriesIndex: number;
  percentage?: number;
  x?: number;
}

export interface HysChartTooltipItem extends HysChartSelection {
  key: string;
  color: string;
  text: string;
}

export interface HysChartTooltipContext {
  item: HysChartTooltipItem;
  items: readonly HysChartTooltipItem[];
  close: () => void;
}

export type HysChartAnnotation =
  | {
      type: "band";
      from: number;
      to: number;
      yAxis?: 0 | 1;
      label?: string;
      color?: string;
    }
  | {
      type: "min" | "max" | "trend";
      seriesId?: string;
      label?: string;
      color?: string;
    };

export type HysChartExportFormat = "svg" | "png" | "csv";

export interface HysChartExportOptions {
  /** CSV data scope. Image exports always capture the current plot. */
  scope?: "all" | "visible";
  pixelRatio?: number;
  includeContext?: boolean;
  title?: string;
}

export interface HysChartProps {
  data?: readonly HysChartPoint[];
  series?: readonly HysChartSeries[];
  type?: HysChartType;
  height?: number;
  aspectRatio?: number;
  xAxis?: HysChartXAxis;
  yAxis?: HysChartAxis | readonly [HysChartAxis, HysChartAxis?];
  loading?: boolean;
  error?: string | Error | null;
  loadingText?: string;
  missing?: HysChartMissing;
  selectedKey?: string | null;
  hiddenKeys?: readonly string[];
  range?: HysChartRange | null;
  zoomable?: boolean;
  rangePresets?: readonly HysChartRangePreset[];
  showDateRange?: boolean;
  crosshair?: boolean;
  cursor?: HysChartCursor | null;
  /** Approximate maximum rendered points per visible line, area, or scatter series. */
  sampling?: number;
  showValues?: boolean;
  showTable?: boolean;
  showLegend?: boolean;
  legendLayout?: HysChartLegendLayout;
  legendActions?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  tooltipMode?: "point" | "axis";
  tooltipInteractive?: boolean;
  stacked?: boolean;
  smooth?: boolean;
  barStyle?: HysChartBarStyle;
  innerRadius?: number;
  colors?: readonly string[];
  valueFormatter?: (value: number, point: HysChartPoint) => string;
  axisFormatter?: (value: number, axis: "x" | "y") => string;
  emptyText?: string;
  ariaLabel?: string;
  reference?: HysChartReference;
  references?: readonly HysChartReference[];
  annotations?: readonly HysChartAnnotation[];
}
