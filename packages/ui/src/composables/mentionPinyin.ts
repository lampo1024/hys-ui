import type { HysMentionPinyinLoader } from "./mention";

export const loadMentionPinyin: HysMentionPinyinLoader = async () => {
  const { pinyin } = await import("pinyin-pro");
  return text => pinyin(text, { toneType: "none", type: "array", nonZh: "consecutive" });
};
