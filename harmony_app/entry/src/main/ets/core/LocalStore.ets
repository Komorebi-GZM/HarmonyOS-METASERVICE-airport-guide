import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';
import { place } from './Places';
export interface SavedChoices { lang: string; recent: string[]; }
export class LocalStore {
  private static prefs: preferences.Preferences | undefined = undefined;
  static async load(context: common.Context): Promise<SavedChoices> {
    const result: SavedChoices = { lang: 'zh', recent: [] };
    try {
      const p = await preferences.getPreferences(context, { name: 'airport-guide' });
      LocalStore.prefs = p;
      const lang = await p.get('language', 'zh');
      const recent = await p.get('recent', '');
      result.lang = lang === 'en' ? 'en' : 'zh';
      if (typeof recent === 'string') {
        const ids = recent.split(',');
        for (let i = 0; i < ids.length && result.recent.length < 6; i++) {
          if (place(ids[i]) !== undefined && result.recent.indexOf(ids[i]) < 0) { result.recent.push(ids[i]); }
        }
      }
    } catch (err) { /* In-memory navigation remains available if local preferences cannot be read. */ }
    return result;
  }
  static async save(lang: string, recent: string[]): Promise<void> {
    const p = LocalStore.prefs;
    if (p === undefined) { return; }
    try { await p.put('language', lang); await p.put('recent', recent.join(',')); await p.flush(); } catch (err) { }
  }
}
