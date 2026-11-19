// 離線、存檔來回、死亡轉世、從仙人開始
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
const load = f => { const c = boot(); let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.S) j = j.S; run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false;`); return c; };
const out = (k, v) => console.log(k.padEnd(14), v);
// A. 離線
for (const f of ['oldA.json', 'asc_small.json']) for (const h of [1, 8, 24]) {
  const c = load(f);
  out('offline ' + f.slice(0, 4) + ' ' + h + 'h', run(c, `(() => { const s = L(), a = [stg(s).name, Math.round(s.xiu), Math.round(s.age), s.stone]; let e = ''; try { applyOffline(${h * 3600}); render(); } catch (x) { e = 'ERR ' + x.message; }
    return a.join(',') + ' -> ' + [stg(s).name, Math.round(s.xiu), Math.round(s.age), s.stone].join(',') + ' ' + e + ' log:' + (s.offline ? JSON.stringify(s.offline).slice(0, 120) : s.log[0].text.slice(0, 80)); })()`));
}
// B. 存檔來回
for (const f of ['oldA.json', 'asc_small.json']) {
  const c = load(f);
  out('roundtrip ' + f.slice(0, 4), run(c, `(() => { save(); const before = JSON.stringify(S); const code = encodeURIComponent(before);
    const d = JSON.parse(decodeURIComponent(code)); localStorage.setItem(SAVE_KEY, JSON.stringify(d)); load(); render();
    const a = JSON.parse(before), b = S; const diff = ['lives', 'dao', 'guo'].filter(k => a.meta[k] !== b.meta[k]).concat(['stage', 'xiu', 'stone', 'tech'].filter(k => a.life[k] !== b.life[k]));
    return 'diff=' + JSON.stringify(diff) + ' stage ' + stg().name; })()`));
}
