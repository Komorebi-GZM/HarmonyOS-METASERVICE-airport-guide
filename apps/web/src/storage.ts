// 本地偏好存储：替代 HarmonyOS 的 @kit.ArkData preferences。
// 保存 language 与 recent（最多 6 条），与 ArkTS 端 LocalStore 语义一致。

import type { SavedChoices } from '@core';

const KEY = 'airport-guide';

export function load(): SavedChoices {
  const result: SavedChoices = { lang: 'zh', recent: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) { return result; }
    const parsed = JSON.parse(raw) as Partial<SavedChoices>;
    if (parsed.lang === 'en' || parsed.lang === 'zh') { result.lang = parsed.lang; }
    if (Array.isArray(parsed.recent)) {
      result.recent = parsed.recent.filter((x): x is string => typeof x === 'string').slice(0, 6);
    }
  } catch (err) {
    // 读不到就用内存态，导航仍可用（与 ArkTS LocalStore 的容错一致）
  }
  return result;
}

export function save(lang: string, recent: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ lang, recent: recent.slice(0, 6) }));
  } catch (err) {
    // 忽略：无痕模式等场景下不影响导航
  }
}
