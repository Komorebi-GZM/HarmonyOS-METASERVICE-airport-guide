// 本地偏好：用 wx.storage 实现共享核心的 PreferencesStore 接口（对齐 ArkTS preferences 的语义）。

const KEY = 'airport-guide';

function readRaw() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw === '' || raw === null || raw === undefined) { return null; }
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    return null;
  }
}

const wxStore = {
  /** @returns {{lang: string, recent: string[]}} */
  load() {
    const parsed = readRaw();
    const result = { lang: 'zh', recent: [] };
    if (parsed === null || typeof parsed !== 'object') { return result; }
    if (parsed.lang === 'en' || parsed.lang === 'zh') { result.lang = parsed.lang; }
    if (Array.isArray(parsed.recent)) {
      result.recent = parsed.recent.filter((x) => typeof x === 'string').slice(0, 6);
    }
    return result;
  },

  save(lang, recent) {
    try {
      wx.setStorageSync(KEY, JSON.stringify({ lang, recent: recent.slice(0, 6) }));
    } catch (err) {
      // 读不到/写不进都不影响导航（与 ArkTS LocalStore 的容错一致）
    }
  },
};

module.exports = { wxStore, KEY };
