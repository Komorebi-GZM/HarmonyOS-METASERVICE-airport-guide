// 本地偏好存储：用 localStorage 实现共享核心的 PreferencesStore 接口。
// 语义与 ArkTS 端 core/LocalStore.ets（@kit.ArkData preferences）一致：只存 language 与 recent（≤6）。

import type { PreferencesStore } from '@core';

const KEY = 'airport-guide';

export class LocalStore implements PreferencesStore {
  load(): { lang: string; recent: string[] } {
    const result = { lang: 'zh', recent: [] as string[] };
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw === null) { return result; }
      const parsed = JSON.parse(raw) as { lang?: unknown; recent?: unknown };
      if (parsed.lang === 'en' || parsed.lang === 'zh') { result.lang = parsed.lang; }
      if (Array.isArray(parsed.recent)) {
        result.recent = parsed.recent.filter((x): x is string => typeof x === 'string').slice(0, 6);
      }
    } catch (err) {
      // 读到坏数据就用默认值，导航仍可用（与 ArkTS LocalStore 的容错一致）
    }
    return result;
  }

  save(lang: string, recent: string[]): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ lang, recent: recent.slice(0, 6) }));
    } catch (err) {
      // 无痕模式等场景下写不进去也不影响导航
    }
  }
}
