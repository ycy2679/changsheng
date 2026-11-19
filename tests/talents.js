// 悟道樹全點滿＋化身全開，凡界、仙界各跑一段時間，掃畫面
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
for (const f of ['oldA.json', 'asc_small.json']) {
  const c = boot(); let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.S) j = j.S;
  run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false;`);
  console.log(f, run(c, `(() => { const errs = [], sus = []; const all = Object.fromEntries(TALENTS.map(t => [t.id, t.max]));
    S.meta.talents = { ...all }; S.meta.talentsEff = { ...all }; S.meta.auto = {}; S.meta.ascends = Math.max(1, S.meta.ascends || 0); S.meta.lives = Math.max(10, S.meta.lives); S.meta.best = Math.max(30, S.meta.best);
    const s = L(), st0 = stg(s).name, SUS = /undefined|NaN|\\[object|null(?![a-z])/;
    const scan = tag => { for (const tb of ['cult', 'skill', 'art', 'bag', 'craft', 'shop', 'log', 'dao']) for (const ct of ['gen', 'gong', 'shen']) { if (tb !== 'cult' && ct !== 'gen') continue; try { tab = tb; cultTab = ct; render(); const html = document.getElementById('app').innerHTML || ''; const m = html.replace(/<[^>]+>/g, ' ').match(SUS); if (m) sus.push(tag + ':' + tb + '/' + ct + ':' + m[0]); } catch (e) { errs.push(tag + ':' + tb + ' ' + e.message); } } };
    scan('start');
    for (let i = 0; i < 3600 * 3 && !s.dead; i++) { try { tick(1); } catch (e) { errs.push('tick ' + e.message); break; } }
    scan('after3h');
    return 'stage ' + st0 + ' -> ' + stg(s).name + ' dead=' + !!s.dead + ' errs=' + JSON.stringify(errs.slice(0, 5)) + ' sus=' + JSON.stringify(sus.slice(0, 8)) + ' slots 飾品=' + (1 + tl('wanbao')) + ' 神通=' + maxShen() + ' 輔修=' + maxSubs(); })()`));
}
