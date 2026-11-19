// 用新版讀舊存檔：load → 各畫面 render → tick 一段時間，抓錯誤
const fs = require('fs'); const { boot, run } = require('./lib/h.js');
for (const f of ['oldA.json', 'oldB.json', 'oldC.json']) {
  const c = boot();
  try {
    console.log(f, run(c, `(() => { localStorage.setItem(SAVE_KEY, ${JSON.stringify(fs.readFileSync(f, 'utf8'))}); load(); const s = L(); const out = { stage: stg().name, dead: !!s.dead, xian: isXian(s) };
      const errs = [];
      const R = (name, fn) => { try { const h = fn(); if (typeof h === 'string' && /undefined|NaN/.test(h.replace(/<[^>]+>/g, ''))) errs.push(name + ': 有 undefined/NaN ' + (h.replace(/<[^>]+>/g, ' ').match(/.{0,30}(undefined|NaN).{0,30}/) || [''])[0]); } catch (e) { errs.push(name + ': ' + e.message); } };
      if (s.dead) { R('death', renderDeath); deathView = 'tree'; R('deathTree', renderDeath); deathView = 'sum'; }
      else if (s.mortal) R('mortal', renderMortal);
      else { for (const k of ['cult','skill','art','bag','shop','log','dao']) { tab = k; R(k, () => ({ cult: renderCult, skill: renderSkill, art: renderArt, bag: renderBag, shop: () => { ensureShop(); return renderShop(); }, log: renderLogTab, dao: renderDao })[k]()); } for (const k of ['dan','qi','zhen']) { craftTab = k; R('craft:' + k, renderCraft); } R('sect', renderSect); R('secret', renderSecret); }
      try { for (let i = 0; i < 900; i++) { tick(1); if (L().ev) choose(0); } } catch (e) { errs.push('tick: ' + e.message); }
      out.errs = errs; out.arrays = JSON.stringify(L().arrays); out.names = L().arrays ? Object.keys(L().arrays).map(id => arrName(id)).join(',') : '';
      if (L().dead) { try { rebirth(); out.reb = L().mortal && L().mortal.phase; out.xianOpt = /從仙人開始/.test(renderMortal()); } catch (e) { errs.push('rebirth: ' + e.message); } }
      if (L().mortal && L().mortal.phase === 'birth') out.xianOpt = /從仙人開始/.test(renderMortal());
      return JSON.stringify(out); })()`));
  } catch (e) { console.log(f, 'CRASH', e.message); }
}
