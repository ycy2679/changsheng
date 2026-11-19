// 玩家機器人：在 vm 裡跑真的遊戲邏輯，每秒 tick，定時做玩家會做的決定
const { boot, run } = require('./h5.js');
const BOT = `
var BT = { t: 0, log: [] };
function botMeta(preset) {
  const m = S.meta; Object.assign(m, preset.meta || {});
  m.talents = { ...preset.tal }; m.talentsEff = { ...preset.tal };
}
function botManage() {
  const s = L(); if (s.dead || s.draw || s.mortal) return;
  // 法寶：每格裝最高階、境界夠的
  for (const id of Object.keys(s.arts)) { if (!artOk(id, s)) continue; const k = gearKeys().find(k => (k === ARTS[id].slot || k.startsWith(ARTS[id].slot)) && (!s.gear[k] || ARTS[s.gear[k]].grade < ARTS[id].grade) && !gearIds().includes(id)); if (k) s.gear[k] = id; }
  // 術法：挑本路、品階最高的
  const sk = Object.keys(s.skills).filter(id => !SKILLS[id].only).sort((a, b) => (ownSch(b, s) - ownSch(a, s)) || (SKILLS[b].grade - SKILLS[a].grade) || (SKILLS[b].pow - SKILLS[a].pow));
  s.equip = sk.slice(0, maxEquip());
  // 輔修
  const sub = Object.keys(s.techs).filter(id => id !== s.tech && id !== s.tech2 && subOk(TECHS[id])).sort((a, b) => TECHS[b].grade - TECHS[a].grade);
  s.subs = sub.slice(0, maxSubs());
  // 賣掉用不到的（保留當得了主修、潛力更高的功法）
  for (const kind of ['tech', 'skill', 'art']) for (const id of poolIds(kind)) {
    if (!canDrop(kind, id)) continue;
    if (kind === 'tech' && canMain(id, s) && (TECHS[id].rate || 0) > (TECHS[s.tech].rate || 0)) continue;
    if (kind === 'art' && artOk(id, s) === false && ARTS[id].grade >= 4) continue;
    applySell(kind, id, s);
  }
  // 坊市：先買洞府、比主修好的功法、更高階的法寶術法、修為丹
  ensureShop();
  if (s.cave < caveMax() && s.stone > cavePrice() * 2) { for (const [m, n] of caveMats(s)) if (count(m) < n) buy(ITEMS[m].mat, ITEMS[m].grade, n - count(m)); buy('cave'); }
  s.shop.slots.forEach((o, i) => {
    if (o.sold || s.stone < o.price) return;
    if (o.k === 'tech' && canMain(o.id, s) && (TECHS[o.id].rate || 0) > (TECHS[s.tech].rate || 0)) buySlot(i);
    else if (o.k === 'art' && artOk(o.id, s) && !gearKeys().some(k => (k === ARTS[o.id].slot || k.startsWith(ARTS[o.id].slot)) && s.gear[k] && ARTS[s.gear[k]].grade >= ARTS[o.id].grade) && s.stone > o.price * 1.5) buySlot(i);
    else if (o.k === 'skill' && ownSch(o.id, s) && SKILLS[o.id].grade > Math.min(...s.equip.map(x => SKILLS[x].grade)) && s.stone > o.price * 1.5) buySlot(i);
    else if (o.k === 'item' && (o.id === 'dujiedan' && !s.flags.jiedan && !count('dujiedan'))) buySlot(i);
  });
  // 陣法：聚靈、護山、藥園、礦脈，買得起就蓋／升級（材料不夠先從櫃台買），啟用聚靈和護山
  for (const id of ['juling', 'hushan', 'yaoyuan', 'kuangmai']) {
    const l = arrLv(id); if (l >= arrMax(s)) continue;
    const c = arrayCost(l + 1, id); if (s.stone < c.stone * 3) continue;
    for (const [m, n] of c.mats) { const it = ITEMS[m], k = it.mat; if (count(m) < n) { const need = n - count(m); if (s.stone > herbPrice(it.grade) * need + c.stone * 2 && it.grade <= matGrade()) buy(k, it.grade, need); } }
    if (arrayAfford(c)) buildArray(id);
  }
  s.arrOn = s.arrOn || {}; for (const id of ['juling', 'hushan', 'yaoyuan', 'kuangmai']) if (arrLv(id) && !s.arrOn[id] && arrayOnCount(s) < arraySlots(s)) s.arrOn[id] = true;
  if (count(XIU_PILLS[stg().major]) < 2 && s.stone > xiuPillPrice() * 3) buy('xiu');
  if (count('heal') < 3 && s.stone > healPrice() * 10) buy('heal');
  // 仙籍差事、兌換
  if (s.xj && s.xj.task <= s.age && !s.injury) doXjTask('dang');
  if (s.xj) xjList(s).forEach((o, i) => { if (s.xj.gong >= o.cost && (o.id === 'dujiedan' ? !count('dujiedan') && !s.flags.jiedan : o.k === 'tech' ? canMain(o.id, s) && (TECHS[o.id].rate || 0) > (TECHS[s.tech].rate || 0) : false)) xjBuy(i); });
  if (count('dujiedan') && !s.flags.jiedan && isXian(s)) usePill('dujiedan');
  if (count('xianshou') && wuShuai(s) >= 1) usePill('xianshou');
  // 秘境：當前境界的，滿血、沒傷就闖
  if (!s.injury && (s.hpNow ?? 1) >= 1) { const x = SECRETS.find(x => secretShown(x) && x.mj === stg().major && !secretWait(x)); if (x) enterSecret(x.id); }
}
function botJie() {
  const s = L(); if (s.dead || !jieNext(s) || s.xiu < stg().need) return;
  if (s.stage === MORTAL_TOP) { if (!ascendWhy(s).length) { armed = 'trib'; tribulation(); BT.log.push(['trib', (BT.t / 3600).toFixed(1), s.dead ? 'fail' : 'ok']); } return; }
  const full = (s.press || 0) >= pressCap() - 1e-9, late = s.age / lifespan(s) > .93;
  if (!full && !late) return;
  const p = jieChance(s);
  armed = 'xjie'; xianJie(); BT.log.push(['jie', (BT.t / 3600).toFixed(1), stg().name, 'p=' + p.toFixed(2), s.dead ? 'FAIL' : 'ok']);
}
function botRun(hours, stopAt) {
  const end = BT.t + hours * 3600;
  while (BT.t < end) {
    const s = L();
    if (s.dead) { if (!BT.multi) return 'dead'; BT.log.push(['death', (BT.t / 3600).toFixed(1), STAGES[s.peak].name, s.jieFail ? 'jie' : 'age']); rebirth(); continue; }
    if (s.mortal && s.mortal.phase === 'birth' && S.meta.ascends > 0 && BT.multi) { chooseXianStart(); continue; }
    if (stopAt && stopAt(s)) return 'stop';
    if (s.mortal || s.draw) { autoLife(); tick(1); BT.t++; continue; }
    // 閉關為主，每 20 分鐘出去遊歷 8 分鐘
    const want = (BT.t % 1680) < 480 && !s.injury ? 'travel' : 'closed';
    if (s.mode !== want) s.mode = want;
    tick(1); BT.t++;
    if (s.ev && s.ev.ev) autoChoose(); else if (s.ev) { try { const ch = visible(curEvent()); choose(0); } catch (e) { s.ev = null; } }
    if (BT.t % 30 === 0) { botManage(); botJie(); }
  }
  return 'time';
}
`;
module.exports = { BOT, boot, run };
