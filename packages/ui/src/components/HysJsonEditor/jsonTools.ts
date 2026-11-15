export const jsonTools = [
  { id: "repair", label: "修复 JSON", writes: true },
  { id: "schema", label: "Schema 校验", writes: false },
  { id: "query", label: "JSONPath 查询", writes: false },
  { id: "compare", label: "结构对比", writes: false },
  { id: "organize", label: "排序与去重", writes: true },
  { id: "convert", label: "格式转换", writes: false },
] as const;
export type JsonTool = (typeof jsonTools)[number]["id"];
