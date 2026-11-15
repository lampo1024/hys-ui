import type { Schema, SchemaDraft } from "@cfworker/json-schema";
import type { JsonNode, JsonRange } from "./jsonDocument";
import { jsonNodes, jsonNumberFits, locatePointer, requireJson } from "./jsonStructure";

export type JsonSchema = Record<string, unknown> | boolean;
export interface JsonSchemaIssue { path: string; message: string; range?: JsonRange }
const drafts: Record<string, SchemaDraft> = {
  "http://json-schema.org/draft-07/schema": "7",
  "https://json-schema.org/draft-07/schema": "7",
  "https://json-schema.org/draft/2020-12/schema": "2020-12",
};
const valueTypes = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);
const mapKeywords = ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"];
const childKeywords = ["items", "contains", "additionalItems", "additionalProperties", "propertyNames",
  "unevaluatedItems", "unevaluatedProperties", "not", "if", "then", "else"];
const arrayKeywords = ["allOf", "anyOf", "oneOf", "prefixItems"];
const boundKeywords = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"];
const countKeywords = ["minLength", "maxLength", "minItems", "maxItems", "minProperties", "maxProperties", "minContains", "maxContains"];
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

function assertSchema(value: unknown): asserts value is JsonSchema {
  if (typeof value !== "boolean" && !object(value)) throw new Error("Schema 必须是 JSON 对象或布尔值。");
}

function draftOf(value: unknown): SchemaDraft {
  if (value === undefined) return "2020-12";
  const version = typeof value === "string" ? drafts[value.replace(/#$/, "")] : undefined;
  if (version !== "7" && version !== "2020-12") throw new Error("请选择 Draft 7 或 2020-12 Schema。");
  return version;
}

function inspectSchema(schema: JsonSchema) {
  const pending: JsonSchema[] = [schema];
  const seen = new Set<object>();
  function append(value: unknown) { assertSchema(value); pending.push(value); }
  while (pending.length) {
    const current = pending.pop()!;
    if (!object(current) || seen.has(current)) continue;
    seen.add(current);
    draftOf(current.$schema);
    if (current.$dynamicRef !== undefined) throw new Error("此编辑器支持文档内的 $ref。");
    if (current.$ref !== undefined && (typeof current.$ref !== "string" || !current.$ref.startsWith("#"))) {
      throw new Error("Schema 的 $ref 必须引用当前文档。");
    }
    if (current.type !== undefined) {
      const types = Array.isArray(current.type) ? current.type : [current.type];
      if (!types.length || new Set(types).size !== types.length || !types.every(type => typeof type === "string" && valueTypes.has(type))) {
        throw new Error("Schema 的 type 需要有效且唯一的类型。");
      }
    }
    if (current.required !== undefined && (!Array.isArray(current.required) || current.required.some(key => typeof key !== "string"))) {
      throw new Error("Schema 的 required 必须是字段名数组。");
    }
    if (current.enum !== undefined && (!Array.isArray(current.enum) || !current.enum.length)) throw new Error("Schema 的 enum 必须是非空数组。");
    for (const key of boundKeywords) {
      const value = current[key];
      if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || key === "multipleOf" && value <= 0)) {
        throw new Error("Schema 的 " + key + " 需要有效的数值约束。");
      }
    }
    for (const key of countKeywords) {
      const value = current[key];
      if (value !== undefined && (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)) {
        throw new Error("Schema 的 " + key + " 需要非负整数。");
      }
    }
    if (current.pattern !== undefined) {
      if (typeof current.pattern !== "string") throw new Error("Schema 的 pattern 必须是字符串。");
      try { new RegExp(current.pattern, "u"); } catch { throw new Error("Schema 的 pattern 不是有效的正则表达式。"); }
    }
    for (const key of mapKeywords) if (current[key] !== undefined) {
      if (!object(current[key])) throw new Error("Schema 的 " + key + " 必须是对象。");
      Object.values(current[key]).forEach(append);
    }
    for (const key of childKeywords) if (current[key] !== undefined) {
      if (key === "items" && Array.isArray(current[key])) current[key].forEach(append);
      else append(current[key]);
    }
    for (const key of arrayKeywords) if (current[key] !== undefined) {
      if (!Array.isArray(current[key])) throw new Error("Schema 的 " + key + " 必须是数组。");
      current[key].forEach(append);
    }
    if (object(current.dependencies)) Object.values(current.dependencies).forEach(value => { if (!Array.isArray(value)) append(value); });
  }
}

export function parseSchemaText(text: string) {
  const root = requireJson(text);
  for (const node of jsonNodes(root)) {
    if (node.type === "number" && !jsonNumberFits(node.preview)) throw new Error("Schema 包含无法精确校验的数字。");
  }
  const parsed: unknown = JSON.parse(text);
  assertSchema(parsed);
  inspectSchema(parsed);
  return parsed;
}

export async function validateJsonSchema(schema: JsonSchema, source: string, root: JsonNode): Promise<JsonSchemaIssue[]> {
  const precision: JsonSchemaIssue[] = [];
  for (const node of jsonNodes(root)) {
    if (node.type === "number" && !jsonNumberFits(node.preview)) {
      precision.push({ path: node.id.slice(4), range: node, message: "该数字超出 Schema 校验可精确表示的范围，已暂停校验。" });
    }
  }
  if (precision.length) return precision;
  const { Validator } = await import("@cfworker/json-schema");
  // The validator annotates schema objects during dereferencing. Keep caller state separate.
  const isolated = parseSchemaText(JSON.stringify(schema));
  const validator = new Validator(isolated as Schema | boolean, draftOf(object(isolated) ? isolated.$schema : undefined), false);
  const result = validator.validate(JSON.parse(source));
  return result.errors.filter(error => !["properties", "patternProperties", "propertyNames"].includes(error.keyword)).map(error => {
    const fragment = error.instanceLocation.replace(/^#/, "");
    let path = fragment;
    try { path = decodeURIComponent(fragment); } catch { /* schema paths are percent-encoded when needed */ }
    const node = locatePointer(root, path);
    return { path, message: error.error, range: node ?? root };
  });
}

function resolveSchema(root: JsonSchema, value: unknown) {
  const seen = new Set<unknown>();
  while (object(value) && typeof value.$ref === "string" && value.$ref.startsWith("#") && !seen.has(value)) {
    seen.add(value);
    let fragment: string;
    try { fragment = decodeURIComponent(value.$ref.slice(1)); } catch { return undefined; }
    if (fragment && !fragment.startsWith("/")) return value;
    let next: unknown = root;
    for (const part of fragment ? fragment.slice(1).split("/") : []) {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      next = object(next) && Object.hasOwn(next, key) ? next[key] : undefined;
    }
    value = next;
  }
  return object(value) ? value : undefined;
}

export function jsonSchemaHints(schema: JsonSchema | null, node: JsonNode, key?: string) {
  if (schema === null || node.ambiguous) return { keys: [], values: [] };
  let current = resolveSchema(schema, schema);
  for (const part of node.id.slice(5).split("/").filter((_, index) => index || node.id !== "root")) {
    const name = part.replace(/~1/g, "/").replace(/~0/g, "~");
    const properties = current?.properties;
    const items = current?.items;
    const tuple = current?.prefixItems;
    const next = object(properties) && Object.hasOwn(properties, name) ? properties[name]
      : Array.isArray(tuple) && Number(name) < tuple.length ? tuple[Number(name)]
        : Array.isArray(items) ? items[Number(name)] : items;
    current = resolveSchema(schema, next);
  }
  const properties = current?.properties;
  const keys = node.type === "object" && object(properties)
    ? Object.keys(properties).filter(name => !node.children!.some(child => child.label === name)) : [];
  const field = key === undefined ? current : resolveSchema(schema, object(properties) && Object.hasOwn(properties, key) ? properties[key] : current?.items);
  return { keys, values: Array.isArray(field?.enum) ? field.enum.map(value => JSON.stringify(value)).filter(Boolean) : [] };
}
