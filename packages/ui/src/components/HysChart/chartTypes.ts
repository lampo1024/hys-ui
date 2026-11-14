export interface HysChartPoint {
  label: string;
  value: number;
  color?: string;
  /** Numeric horizontal coordinate used by scatter charts. */
  x?: number;
}

export interface HysChartReference {
  value: number;
  label: string;
  color?: string;
}

export type HysChartType =
  | "bar"
  | "horizontal-bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "combo";
export type HysChartBarStyle = "solid" | "gradient" | "outline";

export interface HysChartSeries {
  id?: string;
  name: string;
  data: readonly HysChartPoint[];
  color?: string;
  /** Per-series rendering in a combination chart. */
  type?: "bar" | "line" | "area";
  dashed?: boolean;
}

export interface HysChartSelection {
  point: HysChartPoint;
  series: HysChartSeries;
  pointIndex: number;
  seriesIndex: number;
  percentage?: number;
  x?: number;
}

export interface HysChartProps {
  data?: readonly HysChartPoint[];
  series?: readonly HysChartSeries[];
  type?: HysChartType;
  height?: number;
  showValues?: boolean;
  showTable?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
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
}
