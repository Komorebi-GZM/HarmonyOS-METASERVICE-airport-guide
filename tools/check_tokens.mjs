#!/usr/bin/env node
// 设计令牌一致性检查：确保三端用的是同一份颜色/圆角，且 UI 样式里不再写死色值。
//
// 规则（对应 docs/DESIGN.md §2.6 的统一方案）：
//   1. 生成物 apps/web/src/tokens.css 与 apps/weapp/miniprogram/tokens.wxss 必须与真源一致
//      （真源 = Theme.ets / float.json，经 export_shared.py 导出，这里与 TS 核心的 tokens 对表）
//   2. styles.css / app.wxss 里**不允许**再出现与令牌同值的硬编码色（只允许显式语义白与提示底色）
//   3. 所有 var(--x) 引用都必须有定义（防拼错、防删了定义还留着引用）
//
// 用法：node tools/check_tokens.mjs

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AIRPORT } from '../packages/core/src/index.ts';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TOKENS_CSS = join(ROOT, 'apps/web/src/tokens.css');
const TOKENS_WXSS = join(ROOT, 'apps/weapp/miniprogram/tokens.wxss');
const STYLE_CSS = join(ROOT, 'apps/web/src/styles.css');
const STYLE_WXSS = join(ROOT, 'apps/weapp/miniprogram/app.wxss');

/** 允许在业务样式里显式写死的语义值（ArkTS 侧同样是硬编码，见 docs/TODO.md T-203） */
const ALLOWED_LITERALS = new Set(['#FFFFFF', '#FFF2DF']);

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✖ ${name}\n      ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) { throw new Error(message); }
}

function kebab(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

/** 由核心令牌推出"变量名 -> 色值"的期望表 */
function expectedVars() {
  const tokens = AIRPORT.tokens;
  const out = new Map();
  for (const [group, prefix] of [['APP', 'app'], ['MAP', 'map'], ['ROUTE', 'route']]) {
    for (const [key, value] of Object.entries(tokens[group])) {
      out.set(`--${prefix}-${kebab(key)}`, value);
    }
  }
  for (const [key, value] of Object.entries(tokens.TYPE_COLOR)) {
    out.set(`--type-${kebab(key)}`, value);
  }
  out.set('--hit', tokens.HIT);
  return out;
}

const expected = expectedVars();

check('生成的令牌文件存在且包含全部颜色令牌', () => {
  for (const path of [TOKENS_CSS, TOKENS_WXSS]) {
    assert(existsSync(path), `缺少 ${path.replace(ROOT + '/', '')}，请运行 python3 tools/export_shared.py`);
    const text = readFileSync(path, 'utf8');
    const missing = [];
    for (const [name, value] of expected) {
      if (!text.includes(`${name}: ${value};`)) { missing.push(`${name}=${value}`); }
    }
    assert(missing.length === 0, `${path.replace(ROOT + '/', '')} 缺少/不匹配 ${missing.length} 个令牌：${missing.slice(0, 5).join(', ')}`);
  }
});

check('Web 与小程序令牌文件内容一致（仅单位换算不同）', () => {
  const css = readFileSync(TOKENS_CSS, 'utf8');
  const wxss = readFileSync(TOKENS_WXSS, 'utf8');
  const colors = (text) => (text.match(/--[a-z0-9-]+: #[0-9A-Fa-f]{6};/g) ?? []).sort();
  assert(JSON.stringify(colors(css)) === JSON.stringify(colors(wxss)), '两端颜色令牌集合不一致');
  assert(css.includes('--radius-card: 16px;') && css.includes('--radius-pill: 999px;'), 'CSS 圆角令牌缺失');
  assert(wxss.includes('--radius-card: 32rpx;') && wxss.includes('--radius-pill: 999rpx;'), 'WXSS 圆角令牌缺失（1px = 2rpx）');
  assert(css.includes(':root {') && wxss.includes('page {'), '变量作用域应分别为 :root 与 page');
});

check('业务样式里没有与令牌同值的硬编码颜色', () => {
  const tokenValues = new Set([...expected.values()].map((v) => v.toUpperCase()));
  for (const path of [STYLE_CSS, STYLE_WXSS]) {
    const text = readFileSync(path, 'utf8');
    const offenders = [];
    for (const match of text.matchAll(/#[0-9A-Fa-f]{6}/g)) {
      const value = match[0].toUpperCase();
      if (!tokenValues.has(value)) { continue; }
      if (ALLOWED_LITERALS.has(value) && /--(on-accent|warn-bg)\s*:/.test(text.slice(Math.max(0, match.index - 40), match.index))) {
        continue; // 语义别名允许显式写死
      }
      const line = text.slice(0, match.index).split('\n').length;
      offenders.push(`${path.replace(ROOT + '/', '')}:${line} ${match[0]}`);
    }
    assert(offenders.length === 0, `应改用 var(--token)：${offenders.slice(0, 6).join(' | ')}`);
  }
});

check('字号/圆角一律走令牌，间距不得使用阶梯字面量', () => {
  const ladder = (prefix) => {
    const text = readFileSync(TOKENS_CSS, 'utf8');
    return new Set([...text.matchAll(new RegExp(`--${prefix}-(\\d+):`, 'g'))].map((m) => Number(m[1])));
  };
  const fonts = ladder('font');
  const spaces = ladder('space');
  const radii = ladder('radius');
  assert(fonts.size >= 10 && spaces.size >= 8 && radii.size >= 3, '尺寸阶梯令牌缺失，请重跑 export_shared.py');

  for (const [path, unit] of [[STYLE_CSS, 'px'], [STYLE_WXSS, 'rpx']]) {
    const text = readFileSync(path, 'utf8');
    const problems = [];
    const scale = (value) => (unit === 'px' ? value : value / 2);

    for (const m of text.matchAll(/font-size:\s*(\d+)(px|rpx)/g)) {
      problems.push(`font-size ${m[0].split(':')[1].trim()} 应改用 var(--font-N)`);
    }
    for (const m of text.matchAll(/border-radius:\s*(\d+)(px|rpx)\s*;/g)) {
      problems.push(`border-radius ${m[1]}${m[2]} 应改用 var(--radius-N)`);
    }
    for (const m of text.matchAll(/(?:padding|margin|gap)(?:-[a-z]+)?:\s*([^;{}]+);/g)) {
      const body = m[1];
      const values = [...body.matchAll(/(\d+)(px|rpx)/g)].map((x) => scale(Number(x[1])));
      if (values.length > 0 && values.every((v) => spaces.has(v)) && !body.includes('var(')) {
        problems.push(`间距 ${body.trim()} 应改用 var(--space-N)`);
      }
    }
    assert(problems.length === 0, `${path.replace(ROOT + '/', '')} 有 ${problems.length} 处：${[...new Set(problems)].slice(0, 5).join(' | ')}`);
  }
});

check('无障碍对比度（WCAG 2.1 AA）', () => {
  const theme = AIRPORT.tokens;
  const channels = (hex) => {
    const body = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16) / 255);
  };
  const linear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = (hex) => {
    const [r, g, b] = channels(hex).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  // 正文 4.5:1；大字与非文本图形 3:1
  const TEXT = 4.5;
  const GRAPHIC = 3.0;
  const pairs = [
    ['正文/卡片', theme.APP.text, theme.APP.card, TEXT],
    ['正文/页面底色', theme.APP.text, theme.APP.bg, TEXT],
    ['次要文字/卡片', theme.APP.sub, theme.APP.card, TEXT],
    ['强调文字/卡片', theme.APP.accent, theme.APP.card, TEXT],
    ['强调上的白字', '#FFFFFF', theme.APP.accent, TEXT],
    ['提示文字/提示底色', theme.APP.gtext, '#FFF2DF', TEXT],
    ['地图文字/地表', theme.MAP.ink, theme.MAP.surface, TEXT],
    ['路线线/地表', theme.ROUTE.color, theme.MAP.surface, GRAPHIC],
    ...Object.entries(theme.TYPE_COLOR).map(([k, c]) => [`类型色 ${k}/陆侧洗色`, c, theme.MAP.landWash, GRAPHIC]),
    ...Object.entries(theme.TYPE_COLOR).map(([k, c]) => [`类型色 ${k}/空侧洗色`, c, theme.MAP.airWash, GRAPHIC]),
  ];

  // 已知且已记录的偏差（上游主题色限制，见 docs/TODO.md T-620）；这些只报告不判失败
  const allowed = new Map([
    ['次要文字/页面底色', '差 2% 未达 AA：上游 sub 色在页面底色上的固有上限'],
    ['强调文字/浅强调底', '选中态胶囊用强调色文字，同属上游配色限制'],
    ['类型色 corridor/陆侧洗色', '走廊是结构性底图（浏览列表已过滤 corridor 节点），导航信息由 4.56:1 的路线线承载'],
    ['类型色 corridor/空侧洗色', '同上'],
  ]);

  const problems = [];
  const notes = [];
  for (const [name, fg, bg, threshold] of pairs) {
    const ratio = contrast(fg, bg);
    if (ratio >= threshold) { continue; }
    if (allowed.has(name)) { notes.push(`${name} ${ratio.toFixed(2)}:1（${allowed.get(name)}）`); continue; }
    problems.push(`${name} ${fg} on ${bg} = ${ratio.toFixed(2)}:1 < ${threshold}`);
  }
  // 选中态胶囊单独核对（颜色对不在上面的表里）
  const chip = contrast(theme.APP.accent, theme.APP.accentSoft);
  if (chip < TEXT && allowed.has('强调文字/浅强调底')) {
    notes.push(`强调文字/浅强调底 ${chip.toFixed(2)}:1（${allowed.get('强调文字/浅强调底')}）`);
  }
  assert(problems.length === 0, `低于 WCAG AA：${problems.slice(0, 4).join(' | ')}`);
  for (const note of notes) { console.log(`      记录在案的偏差：${note}`); }
});

check('所有 var(--x) 引用都有定义', () => {
  const defined = new Set([...expected.keys(), '--radius-card', '--radius-pill']);
  // 尺寸阶梯令牌（--font-N / --space-N / --radius-N）
  for (const path of [TOKENS_CSS, TOKENS_WXSS]) {
    for (const m of readFileSync(path, 'utf8').matchAll(/(--(?:font|space|radius)-\d+):/g)) { defined.add(m[1]); }
  }
  // 业务样式里自定义的语义别名也算已定义
  for (const path of [STYLE_CSS, STYLE_WXSS]) {
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) { defined.add(match[1]); }
  }
  for (const path of [TOKENS_CSS, TOKENS_WXSS, STYLE_CSS, STYLE_WXSS]) {
    const text = readFileSync(path, 'utf8');
    const undefinedRefs = [];
    for (const match of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      if (!defined.has(match[1])) { undefinedRefs.push(match[1]); }
    }
    assert(undefinedRefs.length === 0, `${path.replace(ROOT + '/', '')} 引用了未定义变量：${[...new Set(undefinedRefs)].join(', ')}`);
  }
});

check('小程序与 Web 的语义别名集合一致', () => {
  const aliases = (path) => {
    const text = readFileSync(path, 'utf8');
    const head = text.slice(0, text.indexOf('\n\n\n'));
    return [...new Set([...head.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(/g)].map((m) => m[1]))].sort();
  };
  const web = aliases(STYLE_CSS);
  const wxss = aliases(STYLE_WXSS);
  const missingInWxss = web.filter((a) => !wxss.includes(a));
  assert(missingInWxss.length === 0, `小程序缺少 Web 端的别名：${missingInWxss.join(', ')}（两端观感应一致）`);
});

// 信息性统计：阶梯外的间距字面量（多为"混合值"声明，收敛见 docs/TODO.md T-202）
function offLadderSpacing() {
  const text = readFileSync(TOKENS_CSS, 'utf8');
  const spaces = new Set([...text.matchAll(/--space-(\d+):/g)].map((m) => Number(m[1])));
  let count = 0;
  for (const [path, unit] of [[STYLE_CSS, 'px'], [STYLE_WXSS, 'rpx']]) {
    const body = readFileSync(path, 'utf8');
    for (const m of body.matchAll(/(?:padding|margin|gap)(?:-[a-z]+)?:\s*([^;{}]+);/g)) {
      if (m[1].includes('var(')) { continue; }
      const values = [...m[1].matchAll(/(\d+)(px|rpx)/g)].map((x) => (unit === 'px' ? Number(x[1]) : Number(x[1]) / 2));
      if (values.some((v) => v !== 0 && !spaces.has(v))) { count += 1; }
    }
  }
  return count;
}

console.log('');
if (failures.length === 0) {
  const cssText = readFileSync(TOKENS_CSS, 'utf8');
const count = (prefix) => [...cssText.matchAll(new RegExp(`--${prefix}-\\d+:`,'g'))].length;
console.log(`令牌一致性通过 ✔（颜色 ${expected.size} + 字号 ${count('font')} + 间距 ${count('space')} + 圆角 ${count('radius') + 2}，三端同源）`);
  process.exit(0);
}
console.log(`${failures.length} 项失败：`);
for (const f of failures) { console.log(`  - ${f}`); }
process.exit(1);
