// 所有事件、人物劇情、前世羈絆、主線節點的每個選項各跑一次：抓錯誤和怪字
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
const out = [];
for (const [f, xian] of [['oldA.json', 0], ['asc_small.json', 1]]) {
  const c = boot(); let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.S) j = j.S; const js = JSON.stringify(j);
  run(c, `var __SAVE = ${JSON.stringify(js)}; localStorage.setItem(SAVE_KEY, __SAVE); load(); title = false;`);
  const r = JSON.parse(run(c, `(() => { const bad = [], errs = []; let n = 0;
    const SUS = /undefined|NaN|object Object|\$\{|「」|《》|null|function/;
    const fresh = () => { localStorage.setItem(SAVE_KEY, __SAVE); load(); title = false; const s = L(); s.stone = 1e9; s.injury = 0; for (const id in ITEMS) if (ITEMS[id].kind === 'heal') s.items[id] = 5; return s; };
    const list = [];
    for (const e of EVENTS) if (!e.xian === !${xian}) { list.push(['ev:' + e.id, e, e.min || 0]); if (EVENT_ALTS[e.id]) list.push(['alt:' + e.id, { ...e, ...EVENT_ALTS[e.id] }, e.min || 0]); }
    if (!${xian}) { for (const id in ARCS) ARCS[id].steps.forEach((st, k) => list.push(['arc:' + id + k, st, st.min || 0, () => { arc(id).step = k; }]));
      for (const e of MEMORIES) list.push(['mem:' + e.id, e, e.min || 0]); }
    for (const e of STORY) if (!!(e.id >= 'n7' && e.id.length <= 3 && /^n(7|8|9|10)/.test(e.id)) === !!${xian}) list.push(['story:' + e.id, e, 0]);
    for (const [key, e, min, pre] of list) {
      const nch = (e.choices || []).length;
      for (let i = 0; i < nch; i++) { const s = fresh(); if (!${xian}) s.stage = Math.max(s.stage, Math.min(min, MORTAL_TOP)); if (pre) pre();
        const ch = e.choices[i]; n++;
        try { const txt = typeof e.text === 'function' ? e.text(s) : e.text; const lab = typeof ch.t === 'function' ? ch.t(s) : ch.t; const res = ch.run(s);
          const all = cur(String(txt) + '｜' + lab + '｜' + res);
          if (SUS.test(all) || !res) bad.push(key + '#' + i + ' ' + String(res).slice(0, 80));
          try { render(); } catch (er) { errs.push(key + '#' + i + ' RENDER ' + er.message); }
        } catch (er) { errs.push(key + '#' + i + ' ' + er.message); } }
    }
    return JSON.stringify({ n, bad: bad.slice(0, 30), nbad: bad.length, errs: errs.slice(0, 30), nerr: errs.length }); })()`));
  out.push(f + ' 選項 ' + r.n + '，怪字 ' + r.nbad + '，錯誤 ' + r.nerr + '\n  ' + r.bad.join('\n  ') + '\n  ' + r.errs.join('\n  '));
}
console.log(out.join('\n'));
