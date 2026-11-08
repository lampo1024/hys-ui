import AsyncValidator from "async-validator";
import type { RuleItem, Rules, ValidateError } from "async-validator";
import { toRaw, unref } from "vue";
import {
  formPath,
  formValue,
  type HysFormMessages,
  type HysFormRule,
  type HysFormRules,
  type HysFormValidationContext,
} from "./formContext";
const Schema =
  (AsyncValidator as unknown as { default?: typeof AsyncValidator }).default ??
  AsyncValidator;

export function snapshotForm(
  value: unknown,
  seen = new WeakMap<object, unknown>(),
): unknown {
  const raw = toRaw(unref(value));
  if (!raw || typeof raw !== "object") return raw;
  if (raw instanceof Date) return new Date(raw);
  if (raw instanceof RegExp) return new RegExp(raw.source, raw.flags);
  if (seen.has(raw)) return seen.get(raw);
  if (
    !Array.isArray(raw) &&
    Object.getPrototypeOf(raw) !== Object.prototype &&
    Object.getPrototypeOf(raw) !== null
  )
    return raw;
  const result: Record<string, unknown> | unknown[] = Array.isArray(raw)
    ? []
    : {};
  seen.set(raw, result);
  for (const [key, item] of Object.entries(raw))
    Object.defineProperty(result, key, {
      value: snapshotForm(item, seen),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  return result;
}
export function sameFormValue(
  a: unknown,
  b: unknown,
  seen = new WeakMap<object, object>(),
): boolean {
  a = toRaw(a);
  b = toRaw(b);
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp)
    return a.source === b.source && a.flags === b.flags;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (
    Array.isArray(a) !== Array.isArray(b) ||
    Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)
  )
    return false;
  if (
    !Array.isArray(a) &&
    ![Object.prototype, null].includes(Object.getPrototypeOf(a))
  )
    return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        sameFormValue(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
          seen,
        ),
    )
  );
}
function inferredType(value: unknown): RuleItem["type"] {
  return value instanceof Date
    ? "date"
    : Array.isArray(value)
      ? "array"
      : value && typeof value === "object"
        ? "object"
        : typeof value === "number"
          ? "number"
          : typeof value === "boolean"
            ? "boolean"
            : "string";
}
function descriptor(
  rules: HysFormRule[],
  value: unknown,
  model: Record<string, unknown>,
  context: HysFormValidationContext,
): RuleItem[] {
  return rules.flatMap((rule) => {
    const {
      validator,
      asyncValidator,
      trigger: _trigger,
      level: _level,
      fields,
      defaultField,
      ...rest
    } = rule;
    const result: RuleItem[] = [];
    // Built-in constraints and custom validators must both run. async-validator
    // otherwise treats a custom validator as a replacement for built-in rules.
    const builtin: RuleItem = {
      ...rest,
      type: rest.type ?? (rest.enum ? "enum" : inferredType(value)),
    };
    // The engine runs transforms before it clones a descriptor. Build children
    // here so inference uses the actual transformed member, including mixed arrays.
    builtin.transform = function (this: RuleItem, incoming) {
      const next = rule.transform ? rule.transform(incoming) : incoming;
      this.type = rest.type ?? (rest.enum ? "enum" : inferredType(next));
      if (fields) {
        const nested: Rules = {};
        for (const [key, child] of Object.entries(fields))
          nested[key] = descriptor(
            [child].flat(),
            (next as Record<string, unknown> | undefined)?.[key],
            model,
            context,
          );
        this.fields = nested;
      }
      if (defaultField)
        this.defaultField = descriptor(
          [defaultField].flat(),
          undefined,
          model,
          context,
        );
      return next;
    };
    if (
      Object.keys(rest).some((key) => key !== "message") ||
      fields ||
      defaultField ||
      (!validator && !asyncValidator)
    )
      result.push(builtin);
    if (validator)
      result.push({
        asyncValidator: async (item, next) => {
          if (context.signal.aborted) return;
          const outcome = await validator(next, model, {
            ...context,
            path: item.fullField ?? context.path,
          });
          if (context.signal.aborted) return;
          if (outcome === false)
            throw Error(
              typeof rule.message === "function"
                ? rule.message(item.fullField)
                : rule.message || "校验未通过",
            );
          if (typeof outcome === "string") throw Error(outcome);
          if (outcome instanceof Error) throw outcome;
        },
      });
    if (asyncValidator)
      result.push({
        asyncValidator: (item, next) =>
          new Promise<void>((resolve, reject) => {
            if (context.signal.aborted) {
              resolve();
              return;
            }
            let settled = false;
            const done = (error?: string | Error) => {
                if (settled) return;
                settled = true;
                context.signal.removeEventListener("abort", abort);
                if (error && !context.signal.aborted)
                  reject(typeof error === "string" ? Error(error) : error);
                else resolve();
              },
              abort = () => done();
            context.signal.addEventListener("abort", abort, { once: true });
            try {
              const pending = asyncValidator(next, done, model, {
                ...context,
                path: item.fullField ?? context.path,
              });
              if (pending && typeof pending.then === "function")
                void pending.then(
                  () => done(),
                  (error) =>
                    done(error instanceof Error ? error : String(error)),
                );
            } catch (error) {
              done(error instanceof Error ? error : String(error));
            }
          }),
      });
    return result;
  });
}
const defaultMessages: HysFormMessages = {
  default: "校验未通过",
  required: "此项不能为空",
  enum: "请选择允许的值",
  whitespace: "不能只输入空白字符",
  types: {
    string: "请输入文本",
    number: "请输入数字",
    boolean: "请输入布尔值",
    method: "应为函数",
    regexp: "正则表达式无效",
    integer: "请输入整数",
    float: "请输入有效数值",
    array: "应为数组",
    object: "应为对象",
    date: "日期无效",
    email: "邮箱格式不正确",
    url: "链接格式不正确",
    hex: "颜色格式不正确",
  },
  string: {
    len: (_field, len) => "长度应为 " + len + " 个字符",
    min: (_field, min) => "长度至少为 " + min + " 个字符",
    max: (_field, max) => "长度最多为 " + max + " 个字符",
    range: (_field, min, max) => "长度应为 " + min + "–" + max + " 个字符",
  },
  number: {
    len: "数值不符合要求",
    min: "数值过小",
    max: "数值过大",
    range: "超出允许范围",
  },
  array: {
    len: "项目数量不符合要求",
    min: "项目数量过少",
    max: "项目数量过多",
    range: "项目数量超出允许范围",
  },
  pattern: { mismatch: "格式不正确" },
  date: {
    format: "日期格式不正确",
    parse: "日期无法解析",
    invalid: "日期无效",
  },
};
export interface HysFormRuleResult {
  messages: string[];
  fields: Record<string, string[]>;
}
export function runFormRules(
  name: string,
  value: unknown,
  rules: HysFormRule[],
  model: Record<string, unknown>,
  messages: HysFormMessages | undefined,
  context: HysFormValidationContext,
  first = true,
): HysFormRuleResult | Promise<HysFormRuleResult> {
  if (!rules.length) return { messages: [], fields: {} };
  const toResult = (errors?: ValidateError[] | null): HysFormRuleResult => {
    const fields: Record<string, string[]> = {};
    for (const error of errors ?? []) {
      const path = formPath(error.field ?? name),
        message = String(error.message ?? "校验失败");
      if (!(fields[path] ??= []).includes(message)) fields[path].push(message);
    }
    return { messages: [...new Set(Object.values(fields).flat())], fields };
  };
  try {
    const validator = new Schema({
      [name]: descriptor(rules, value, model, context),
    });
    validator.messages(defaultMessages);
    if (messages) validator.messages(messages);
    let complete = false,
      outcome: HysFormRuleResult = { messages: [], fields: {} },
      resolveResult!: (result: HysFormRuleResult) => void;
    const result = new Promise<HysFormRuleResult>((resolve) => {
      resolveResult = resolve;
    });
    const validation = validator.validate(
      { [name]: snapshotForm(value) },
      {
        firstFields: first,
        suppressWarning: true,
        suppressValidatorError: true,
      },
      (errors) => {
        outcome = toResult(errors);
        complete = true;
        resolveResult(outcome);
      },
    );
    // The callback is our result channel; consume the engine's rejected promise.
    void validation.catch(() => {});
    return complete ? outcome : result;
  } catch (error) {
    const errors = (error as { errors?: ValidateError[] })?.errors;
    return errors
      ? toResult(errors)
      : {
          messages: [error instanceof Error ? error.message : "校验失败"],
          fields: {
            [name]: [error instanceof Error ? error.message : "校验失败"],
          },
        };
  }
}
/** Resolve a mounted leaf against object/array descriptors declared on parents. */
export function nestedFormRules(
  path: string,
  rules: HysFormRules,
  model?: Record<string, unknown>,
): { rules: HysFormRule[]; value: unknown } {
  const result: HysFormRule[] = [rules[path] ?? []].flat();
  let value = formValue(model, path);
  for (const [name, list] of Object.entries(rules))
    if (path.startsWith(name + ".")) {
      const parts = path.slice(name.length + 1).split(".");
      let candidates = [list].flat(),
        current = formValue(model, name);
      for (const part of parts) {
        const children: HysFormRule[] = [];
        for (const rule of candidates) {
          if (model !== undefined && rule.transform)
            current = rule.transform(snapshotForm(current));
          const child = rule.fields?.[part] ?? rule.defaultField;
          if (child)
            children.push(
              ...[child]
                .flat()
                .map((entry) => ({
                  ...entry,
                  level: entry.level ?? rule.level,
                  trigger: entry.trigger ?? rule.trigger,
                })),
            );
        }
        current =
          current && typeof current === "object"
            ? (current as Record<string, unknown>)[part]
            : undefined;
        candidates = children;
      }
      result.push(...candidates);
      if (candidates.length) value = current;
    }
  return { rules: result, value };
}
