// 真的畫畫面：每 5 分鐘把所有分頁、面板、各種畫面都 render 一次，收集錯誤
const fs = require('fs');
const { BOT, boot, run } = require('./lib/bot5.js');
const [preset, path, hours] = [process.argv[2] || 'strong', process.argv[3] || 'fa', +(process.argv[4] || 30)];
const STRONG = { suhui: 10, dunwu: 1, lixian: 3, lixianxiao: 5, wenxin: 1, pojing: 4, tianren: 3, xianyuan: 2, shulian: 3, slot5: 1, kaiju: 1, kaijushi: 5, caiyun: 10, wanbao: 2, qiyu: 3, huojia: 2, diaoluo: 5, chongchou: 3, duoxuan: 1, baodi: 1, shouyuan: 5, jiedu: 3, yaoli: 5, sidan: 1, liangyi: 1, a_minor: 1, a_heal: 1, a_xiu: 1, a_main: 1, a_event: 1, a_major: 1, a_rebirth: 1, a_refine: 1, a_lu: 1 };
const c = boot(); run(c, BOT); const T0 = Date.now(); run(c, `Date.now = () => ${T0} + BT.t * 1000;`);
if (preset === 'strong') run(c, `botMeta({ meta: { dao: 95, autoMajor: .5, lives: 8, lastPaths: ['${path}'], arcDone: { bei: 'vow', gu: 'stranger' }, arcLife: { bei: 3, gu: 6 } }, tal: ${JSON.stringify(STRONG)} });`);
else run(c, `S.meta.lastPaths = ['${path}']; { const _ao = autoOn; autoOn = id => id === 'a_rebirth' ? true : _ao(id); }`);
run(c, `BT.multi = 1;`);
console.log(run(c, `(() => { const phases = {}, HANDLERS = {}, BAD = {}, CLICKED = {}, CLICK_ERR = {}; let LAST_HTML = '';
 { const _r2 = render; render = () => { _r2(); const h = (document.getElementById('app').innerHTML || ''); LAST_HTML = h; for (const m of h.matchAll(/on(?:click|change|input)="([^"]+)"/g)) { const code = m[1]; const fns = [...code.matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)[ ]*[(]/g)].map(x => x[1]); for (const f of fns) { HANDLERS[f] = 1; if (typeof globalThis[f] !== 'function' && !['if', 'Math', 'this'].includes(f)) { try { if (typeof eval(f) !== 'function') BAD[f] = code; } catch (e) { BAD[f] = code; } } } } }; }
 const sweep = tag => { const s = L(); phases[tag] = (phases[tag] || 0) + 1;
   for (const t of ['cult', 'skill', 'art', 'bag', 'craft', 'shop', 'log', 'dao']) { tab = t; for (const ct of ['gen', 'gong', 'shen']) { if (t !== 'cult' && ct !== 'gen') continue; cultTab = ct; render(); } }
   for (const ct of ['dan', 'qi', 'zhen']) { tab = 'craft'; craftTab = ct; render(); }
   for (const st of ['tech', 'skill', 'art', 'item']) { tab = 'shop'; shopTab = st; render(); }
   tab = 'cult'; showSecret = true; showSect = true; showXj = true; render(); showSecret = showSect = showXj = false;
   title = true; render(); clickAll(tag + ':title'); title = false;
   for (const t2 of ['cult', 'skill', 'art', 'bag', 'craft', 'shop', 'log', 'dao']) { tab = t2; showSecret = showXj = showSect = (t2 === 'cult'); render(); clickAll(tag + ':' + t2); } showSecret = showXj = showSect = false;
   for (const a of ['xjie', 'trib', 'rebirth']) { armed = a; tab = a === 'rebirth' ? 'dao' : 'cult'; render(); } armed = '';
   if (!s.mortal && !s.draw && !s.dead) { try { applyOffline(900); } catch (e) { RENDER_ERR.push('applyOffline ' + e.message); } render(); if (typeof closeOffline === 'function') closeOffline(); }
 };
 const _pe = popEvent; popEvent = (...a) => { const r = _pe(...a); if (L().ev) { render(); phases.event = (phases.event || 0) + 1; } return r; };

 const clickAll = tag => { const codes = [...new Set([...LAST_HTML.matchAll(/on(?:click|change)="([^"]+)"/g)].map(m => m[1]))]; const snap = JSON.stringify(S), ui = { tab, cultTab, craftTab, shopTab, armed, title, showXj, showSecret, showSect, deathView };
   for (const code0 of codes) { const code = code0.replace(/setPlace[(]this[.]value[)]/g, 'setPlace(L().place)').replace(/this[.]value/g, '1').replace(/&#39;/g, "'").replace(/&quot;/g, '"'); if (/reset|importSave|exportSave/.test(code)) continue; if (CLICKED[code]) continue; CLICKED[code] = tag;
     const n0 = RENDER_ERR.length; try { eval(code); eval(code); } catch (e) { CLICK_ERR[code] = e.message + ' (' + tag + ')'; } if (RENDER_ERR.length > n0) CLICK_ERR[code] = 'render: ' + RENDER_ERR[RENDER_ERR.length - 1] + ' (' + tag + ')';
     S = JSON.parse(snap); for (const id in L().custom || {}) TECHS[id] = L().custom[id]; ({ tab, cultTab, craftTab, shopTab, armed, title, showXj, showSecret, showSect, deathView } = ui); } };
 const _rb = rebirth; rebirth = () => { for (const v of ['sum', 'tree', 'log']) { deathView = v; render(); clickAll('death:' + v); } phases.death = (phases.death || 0) + 1; return _rb(); };
 botRun(${hours}, s => { if (BT.t % 300 === 0 || (s.mortal && BT.t % 20 === 0) || (s.draw && BT.t % 5 === 0)) sweep(s.dead ? 'dead' : s.draw ? 'draw' : s.mortal ? 'mortal:' + s.mortal.phase : isXian(s) ? 'xian' : 'live'); if (s.ascView) { render(); phases.ascView = (phases.ascView || 0) + 1; } return false; });
 return JSON.stringify({ now: stg().name, lives: S.meta.lives, RENDER_ERR, handlers: Object.keys(HANDLERS).length, BAD, clicked: Object.keys(CLICKED).length, CLICK_ERR }, null, 1); })()`));
