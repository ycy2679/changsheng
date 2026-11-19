// 從仙人開始：重現 xianEnter 的錯誤
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
for (const paths of [['fa'], ['ti', 'fa'], ['hun', 'fa', 'ti']]) {
  const c = boot(); let j = JSON.parse(fs.readFileSync('asc_small.json', 'utf8')); if (j.S) j = j.S; j.meta.ascends = Math.max(1, j.meta.ascends || 0);
  run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false;`);
  console.log(paths.join('+'), run(c, `(() => { try { die(); rebirth(); chooseXianStart(); const s = L(); const d = s.draw;
    s.root = d.roots ? d.roots[0] : s.root; s.phys = d.phys ? d.phys[0] : s.phys; if (typeof confirmDraw === 'function') { try { confirmDraw(); } catch (e) {} }
    s.mortal.phase = 'path'; s.mortal.pick = ${JSON.stringify(paths)}; S.meta.talentsEff.jianxiu = 2; confirmPath();
    return 'ok ' + stg(s).name + ' tech=' + TECHS[s.tech].name + ' xpFrom=' + (s.xpFrom && TECHS[s.xpFrom].name) + ' got=' + Object.keys(s.xpGot || {}).length + ' xshen=' + JSON.stringify(s.xshen) + ' techs=' + Object.keys(s.techs) + ' log0=' + s.log[0].text.slice(0, 40); }
    catch (e) { return 'ERR ' + e.message + ' @ ' + (e.stack || '').split('\\n').slice(1, 4).join(' | '); } })()`));
}
// 回歸：同一個網頁連續從仙人開始（上一世的根本仙法留在 TECHS 裡），v2.3.6 以前約每 10 次會中斷一次
{
  const c = boot(); let j = JSON.parse(fs.readFileSync('asc_small.json', 'utf8')); if (j.S) j = j.S; j.meta.ascends = Math.max(1, j.meta.ascends || 0);
  run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false; S.meta.talentsEff.a_rebirth = 1; S.meta.auto = {};`);
  console.log('rebirth x25', run(c, `(() => { const r = []; for (let k = 0; k < 25; k++) { try { die(); rebirth(); S.meta.lastStart = 'xian'; for (let i = 0; i < 8 && (L().mortal || L().draw); i++) autoLife(); const s = L(); r.push(s.xshen && s.xj && TECHS[s.tech].xpath ? '+' : '-'); } catch (e) { return 'ERR ' + e.message; } }
    return 'leftover ' + Object.keys(TECHS).filter(id => TECHS[id].xpath).length + ' ' + r.join(''); })()`));
}
