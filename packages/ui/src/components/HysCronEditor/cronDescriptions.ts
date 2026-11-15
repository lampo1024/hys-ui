import { fieldOrder, cronFields, type CalendarCron, type CronFormat, type CronResult } from "./cronValidation";

export const cronDefaults: Record<CronFormat, string> = { unix: "0 0 * * *", quartz: "0 0 0 * * ?" };
export const cronPresets: Record<CronFormat, { label: string; value: string }[]> = {
  unix: [
    { label: "每 15 分钟", value: "*/15 * * * *" },
    { label: "每小时", value: "0 * * * *" },
    { label: "每天 09:00", value: "0 9 * * *" },
    { label: "周一至周五 09:00", value: "0 9 * * MON-FRI" },
    { label: "每周一 09:00", value: "0 9 * * 1" },
    { label: "每月 1 日", value: "0 0 1 * *" },
  ],
  quartz: [
    { label: "每 30 秒", value: "*/30 * * * * ?" },
    { label: "每 15 分钟", value: "0 */15 * * * ?" },
    { label: "每天 09:00", value: "0 0 9 * * ?" },
    { label: "周一至周五 09:00", value: "0 0 9 ? * MON-FRI" },
    { label: "每月最后一天", value: "0 0 0 L * ?" },
    { label: "每月第二个星期五", value: "0 0 9 ? * FRI#2" },
  ],
};

const week = "日一二三四五六";

export function cronFieldDescriptions(plan: CalendarCron) {
  return fieldOrder(plan.format, plan.tokens.length === 7).map((key, index) => {
    const token = plan.tokens[index];
    const field = plan.fields[key];
    let meaning = token === "*" ? "任意" : token === "?" ? "不指定" : token;
    if (key === "weekday" && field.values.length < 7 && field.values.length && !field.rules.length)
      meaning = field.values.map(value => "周" + week[value]).join("、");
    const rules = field.rules.map(rule => {
      if (rule.kind === "nthWeekday") return `第 ${rule.occurrence} 个星期${week[rule.weekday]}`;
      if (rule.kind === "lastWeekday") return `最后一个星期${week[rule.weekday]}`;
      if (rule.kind === "nearestWeekday") return `最接近 ${rule.day} 日的工作日`;
      if ("offset" in rule) {
        const end = rule.offset ? `倒数第 ${rule.offset + 1} 天` : "最后一天";
        return rule.kind === "monthEndWeekday" ? `最接近${end}的工作日` : end;
      }
      return "";
    });
    if (rules.length) meaning = (field.values.length ? [field.values.join("、"), ...rules] : rules).join("、");
    return { key, label: cronFields[key].label, token, meaning };
  });
}

export function describeCron(result: CronResult) {
  if (result.kind === "invalid") return "";
  if (result.kind === "reboot") return "调度服务启动时运行";
  const parts = cronFieldDescriptions(result);
  const token = (key: string) => parts.find(part => part.key === key)?.token;
  const partial = token("year") && token("year") !== "*" || token("month") !== "*";
  const unrestricted = (key: "day" | "weekday") => ["*", "?"].includes(token(key) ?? "");
  const at = [result.fields.hour, result.fields.minute, result.fields.second];
  if (!partial && at.every(field => field.values.length === 1)) {
    const time = at.slice(0, result.format === "unix" ? 2 : 3)
      .map(field => String(field.values[0]).padStart(2, "0")).join(":");
    if (unrestricted("day") && unrestricted("weekday")) return `每天 ${time} 运行`;
    if (unrestricted("day") && !result.fields.weekday.rules.length) {
      const days = result.fields.weekday.values;
      const weekdays = days.join() === "1,2,3,4,5" ? "周一至周五" : days.map(value => "周" + week[value]).join("、");
      return `${weekdays} ${time} 运行`;
    }
    if (unrestricted("weekday")) {
      const dates = result.fields.day.rules.length
        ? parts.find(part => part.key === "day")?.meaning
        : result.fields.day.values.join("、") + " 日";
      return `每月${dates} ${time} 运行`;
    }
  }
  const seconds = token("second")?.match(/^\*\/(\d+)$/);
  const minutes = token("minute")?.match(/^\*\/(\d+)$/);
  if (!partial && unrestricted("day") && unrestricted("weekday") && token("hour") === "*") {
    if (seconds && 60 % Number(seconds[1]) === 0 && token("minute") === "*") return `每 ${seconds[1]} 秒运行`;
    if (minutes && 60 % Number(minutes[1]) === 0 && result.fields.second.values.join() === "0") return `每 ${minutes[1]} 分钟运行`;
    if (token("minute") === "0" && result.fields.second.values.join() === "0") return "每小时整点运行";
  }
  return parts.filter(part => part.token !== "*" && part.token !== "?")
    .map(part => `${part.label} ${part.meaning}`).join(" · ") || (result.format === "unix" ? "每分钟运行" : "每秒运行");
}
