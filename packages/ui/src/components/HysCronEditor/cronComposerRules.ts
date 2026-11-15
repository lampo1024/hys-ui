import type { CronRule } from "./cronFieldDraft";
import type { CronField, CronFormat } from "./cronValidation";

export type CronComposerTab = Exclude<CronField, "weekday">;
interface CronRuleOption {
  value: string;
  label: string;
  field: CronField;
  mode: CronRule;
}
interface CronRuleGroup {
  key: "regular" | "monthly" | "custom";
  label?: string;
  options: CronRuleOption[];
}

const labels = {
  second: "秒", minute: "分", hour: "时", day: "日", month: "月", year: "年",
};
export function cronComposerTabs(format: CronFormat) {
  const fields: CronComposerTab[] = format === "quartz"
    ? ["second", "minute", "hour", "day", "month", "year"]
    : ["minute", "hour", "day", "month"];
  return fields.map(value => ({ value, label: labels[value] }));
}

const fieldLabels = {
  second: ["每秒", "秒数"], minute: ["每分钟", "分钟"], hour: ["每小时", "小时"],
  month: ["每月", "月份"], year: ["每年", "年份"],
};
export function cronComposerRuleGroups(tab: CronComposerTab, format: CronFormat): CronRuleGroup[] {
  const option = (mode: CronRule, label: string, field: CronField = tab) => ({
    value: field + ":" + mode, label, field, mode,
  });
  if (tab === "day") {
    const common = [
      option("any", "每天"),
      option("interval", "每隔几日"),
      option("list", "多选日期"),
      option("range", "日期范围"),
      option("list", "多选星期", "weekday"),
      option("range", "星期范围", "weekday"),
    ];
    const groups: CronRuleGroup[] = [{ key: "regular", options: common }];
    if (format === "quartz") {
      common.push(option("interval", "周内星期步进", "weekday"));
      groups[0].label = "日期与星期";
      groups.push({ key: "monthly", label: "月内规则", options: [
        option("lastDay", "每月最后一天"),
        option("monthEndWorkday", "月末工作日"),
        option("lastWeekday", "最后一个指定星期", "weekday"),
        option("monthEnd", "距月末若干天"),
        option("workday", "指定日最近工作日"),
        option("nthWeekday", "第几个指定星期", "weekday"),
      ] });
    }
    groups.push({ key: "custom", options: [
      option("custom", "自定义日期"),
      option("custom", "自定义星期", "weekday"),
    ] });
    return groups;
  }
  const [every, unit] = fieldLabels[tab];
  const rules = [
    option("any", every),
    option("interval", "按步长"),
    option("list", "指定" + unit + "（可多选）"),
    option("range", unit + "范围"),
    option("custom", "自定义"),
  ];
  if (tab === "year") rules.unshift(option("omit", "不限年份（省略字段）"));
  return [{ key: "regular", options: rules }];
}
