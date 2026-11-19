// 通用試玩：node t40.js 預設 路線 小時 [輸出檔]
const fs = require('fs');
const { BOT, boot, run } = require('./lib/bot.js');
const [preset, path, hours, outf] = [process.argv[2] || 'new', process.argv[3] || 'fa', +(process.argv[4] || 20), process.argv[5]];
const STRONG = { jianxiu: 2, suhui: 10, dunwu: 1, lixian: 3, lixianxiao: 5, wenxin: 1, pojing: 4, tianren: 3, xianyuan: 2, shulian: 3, slot5: 1, kaiju: 1, kaijushi: 5, caiyun: 10, wanbao: 2, qiyu: 3, huojia: 2, diaoluo: 5, chongchou: 3, duoxuan: 1, baodi: 1, shouyuan: 5, jiedu: 3, yaoli: 5, sidan: 1, a_minor: 1, a_heal: 1, a_xiu: 1, a_main: 1, a_event: 1, a_major: 1, a_rebirth: 1, a_refine: 1, a_lu: 1 };
const c = boot(); run(c, BOT); const T0 = Date.now(); run(c, `Date.now = () => ${T0} + BT.t * 1000;`);
if (preset === 'strong') run(c, `botMeta({ meta: { dao: 95, autoMajor: .5, lives: 8, lastPaths: ['${path}'], arcDone: { bei: 'vow', gu: 'stranger' }, arcLife: { bei: 3, gu: 6 } }, tal: ${JSON.stringify(STRONG)} });`);
else run(c, `S.meta.lastPaths = ['${path}'];`);
run(c, `var TAL_BUY = []; { const _rb = rebirth; rebirth = () => { if (true) { const PRI = ['xshou', 'wushuai', 'dujie', 'xiandan', 'mijing', 'xianfu', 'jiyi', 'xianbao', 'xjshop']; for (let k = 0; k < 200; k++) { const ok = Object.values(TAL).filter(t => talLv(t.id) < t.max && reqOk(t) && (!t.cond || t.cond(S.meta)) && S.meta.guo >= talentCost(t, talLv(t.id))).sort((a, b) => ((PRI.includes(b.id) ? 1 : 0) - (PRI.includes(a.id) ? 1 : 0)) || talentCost(a, talLv(a.id)) - talentCost(b, talLv(b.id))); if (!ok.length) break; TAL_BUY.push(S.meta.lives + ':' + ok[0].name); buyTalent(ok[0].id); } } return _rb(); }; } BT.multi = 1; { const _ao = autoOn; autoOn = id => id === 'a_rebirth' ? true : _ao(id); }`);
const out = run(c, `(() => {
 const bad = [], errs = [], lives = [], majors = {}, fights = {};
 const SUS = /undefined|NaN|object Object|\$\{|「」|《》|null/;
 const _log = log; log = (t, r) => { if (SUS.test(t)) bad.push(t.slice(0, 120)); return _log(t, r); };
 const _f = fight; fight = foe => { const r = _f(foe); const k = isXian(L()) ? 'X' : 'M' + stg().major; const o = fights[k] = fights[k] || [0, 0, 0]; o[0]++; o[1] += r.win; o[2] += r.rounds; return r; };
 const R = { cult: renderCult, skill: renderSkill, art: renderArt, bag: renderBag, craft: renderCraft, shop: renderShop, log: typeof renderLog === 'function' ? renderLog : null, dao: renderDao };
 let lastLife = S.meta.lives;
 const _tick = tick; tick = d => { try { return _tick(d); } catch (e) { errs.push('tick ' + e.message + ' @' + stg().name); } };
 botRun(${hours}, s => {
   if (S.meta.lives !== lastLife) { lastLife = S.meta.lives; }
   if (!s.mortal && !s.draw && !s.dead) {
     const k = S.meta.lives + ':' + MAJORS[stg(s).major].name; if (!majors[k]) majors[k] = (BT.t / 3600).toFixed(1);
     if (BT.t % 30 === 0 && s.xiu >= stg().need && !jieNext(s) && s.stage !== MORTAL_TOP) { if (!isMajorNext(s) || brkChance(s) >= .5 || s.age / lifespan(s) > .85) { try { breakthrough(); } catch (e) { errs.push('brk ' + e.message); } } }
   }
   if (BT.t % 1200 === 0) for (const k in R) { if (!R[k]) continue; try { const h = cur(R[k]()).replace(/<[^>]+>/g, ' '); const m = h.match(/.{0,25}(undefined|NaN|object Object).{0,25}/); if (m) bad.push(k + ': ' + m[0]); } catch (e) { if (!s.draw && !s.mortal) errs.push(k + ' ERR ' + e.message + ' @' + stg().name); } }
   return false; });
 const s = L();
 const fs2 = Object.fromEntries(Object.entries(fights).map(([k, o]) => [k, o[0] + '場 勝' + Math.round(o[1] / o[0] * 100) + '% ' + (o[2] / o[0]).toFixed(1) + '回']));
 return JSON.stringify({ now: stg().name + ' ' + Math.floor(s.age) + '/' + Math.floor(lifespan()), lives: S.meta.lives, dao: S.meta.dao, guo: S.meta.guo, majors, deaths: BT.log.filter(l => l[0] !== 'trib' || l[2] !== 'ok'), jie: BT.log.filter(l => l[0] === 'jie' || l[0] === 'trib'), fights: fs2, bad: [...new Set(bad)].slice(0, 15), errs: [...new Set(errs)].slice(0, 10), tal: TAL_BUY.join(',') }, null, 1); })()`);
if (outf) fs.writeFileSync(outf, out); console.log(out);
