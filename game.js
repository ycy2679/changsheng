// 長生閒記：遊戲邏輯
const SAVE_KEY = 'changsheng_v1';
const OFFLINE_AGE = 1 / 3;   // 離線變老的速度（線上的三分之一）
const YEAR_SEC = 60;        // 線上 60 秒 = 1 年（離線也會老，但只有三分之一）
const OFFLINE_RATE = 0.5;   // 離線修煉效率

let S = null;               // { meta, life, t }
let tab = 'cult';
let dirty = true;
let armed = '';             // 兩段式確認：'rebirth' / 'reset'
let title = true;           // 開始介面：每次打開都先顯示，停在這裡時不算時間
let fresh = false;          // 沒有存檔（全新開始）
let deathView = 'sum';      // 坐化後：'sum' 總結 / 'tree' 悟道

// ---------- 存檔 ----------
// guo 道果（可花）、talents 悟道樹級數、auto 化身天賦開關、autoMajor 自動突破大境界的成功率門檻
// wins/pills/best 跨世累計：擊敗數、服丹數、到過的最高境界（解鎖頂端天賦用）
function newMeta() { return { lives: 0, dao: 0, guo: 0, talents: {}, auto: {}, autoMajor: .5, wins: 0, pills: 0, best: 0, keepTech: null, arcDone: {}, arcLife: {}, memSeen: {}, history: [] }; }
function newLife(meta) {
  meta.lives++;
  const t = id => meta.talents[id] || 0;
  const s = {
    stage: 0, xiu: 0, age: 12 - 2 * t('tongyan'), stone: 300 * t('kaijushi') * t('kaijushi'), items: { heal: t('kaijudan'), juqi: 3 * t('kaijudan') }, mode: 'closed', place: 'bamboo',
    tech: 'yinqi', subs: [], techs: { yinqi: 0 }, skills: { qijin: 0 }, equip: ['qijin'], cave: 0, injury: 0,
    root: null, phys: null, draw: null, mortal: newMortal(12 - 2 * t('tongyan')), arts: {}, gear: {}, tox: 0, body: 0, shop: null,
    lifeBonus: 0, brkBonus: 0, flags: {}, arcs: {}, encT: 15, evT: 100, ev: null, log: [], wins: 0, peak: 0,
  };
  // 前世術法：隨機帶一個玄階術法；前世功法：保留上一世的主修（連同進度）
  if (t('kaiju')) { const id = pick(Object.keys(SKILLS).filter(k => SKILLS[k].grade === 2)); s.skills[id] = 0; s.equip.push(id); }
  if (t('qianshi') && meta.keepTech && meta.keepTech.def) { TECHS[meta.keepTech.id] = meta.keepTech.def; s.custom = { [meta.keepTech.id]: meta.keepTech.def }; }
  if (t('qianshi') && meta.keepTech && TECHS[meta.keepTech.id]) s.techs[meta.keepTech.id] = meta.keepTech.xp;
  // 宿世神通：帶上上一世的一門神通（報通）
  s.shen = t('baotong') && meta.lastShen && meta.lastShen.length ? [pick(meta.lastShen)] : [];
  return s;
}
const tl = id => S.meta.talents[id] || 0;
const autoOn = id => tl(id) > 0 && S.meta.auto[id] !== false;
function save() { S.t = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() {
  try { S = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { S = null; }
  fresh = !S || !S.meta || !S.life;
  if (fresh) {
    const meta = newMeta(); S = { meta, life: newLife(meta), t: Date.now() };
    return;
  }
  // 舊存檔轉換：破境丹 → 當前境界的突破丹，功法改成主修＋輔修，補上靈根
  const s = S.life;
  // 悟道樹上線前的存檔：補上新欄位，已累積的道心也當成道果給你
  const m = S.meta, d = newMeta();
  for (const k of ['talents', 'auto', 'autoMajor', 'wins', 'pills', 'keepTech']) if (m[k] === undefined) m[k] = d[k];
  if (m.guo === undefined) m.guo = m.dao;
  if (m.talents.a_place) { m.guo += 4; delete m.talents.a_place; delete m.auto.a_place; }   // 自動選地點拿掉了，退還道果
  if (m.best === undefined) m.best = Math.max(s.peak || 0, ...m.history.map(h => STAGES.findIndex(x => x.name === h.stageName)));
  if (!s.items) { s.items = { heal: s.heal || 0 }; if (s.pill) s.items[BRK_PILLS[Math.min(3, stg(s).major)]] = s.pill; delete s.pill; delete s.heal; }
  for (const id in s.custom || {}) TECHS[id] = s.custom[id];   // 自創功法
  m.codex = m.codex || {}; m.codexPaid = m.codexPaid || 0;
  for (const id in s.techs) if (!TECHS[id]) delete s.techs[id];
  s.subs = (s.subs || []).filter(id => id in s.techs);
  if (!TECHS[s.tech] || !isMainType(TECHS[s.tech].type)) {
    if (TECHS[s.tech] && !s.subs.length) s.subs.push(s.tech);   // 原本主修的煉體功法改成輔修
    s.techs.yinqi = s.techs.yinqi || 0; s.tech = 'yinqi';
  }
  for (const id in s.skills) if (!SKILLS[id]) delete s.skills[id];
  s.equip = s.equip.filter(id => id in s.skills);
  s.arts = s.arts || {}; s.gear = s.gear || {};
  if (!s.phys && !s.draw) s.draw = makeDraw(S.meta, s.root);   // 舊存檔補抽體質（原本的靈根留在選項裡）
  s.tox = s.tox || 0; s.body = s.body || 0;
  if (s.draw && !s.draw.rr) { s.draw.rr = { r: s.draw.rerolls, p: s.draw.rerolls }; delete s.draw.rerolls; }
  for (const k in s.gear) if (s.gear[k] && !artOk(s.gear[k], s)) s.gear[k] = null;   // 境界不夠的法寶先卸下
  // 神通上線前的存檔：稀有體質補天賦神通，已過化神的補本命神通
  s.shen = s.shen || []; s.flags = s.flags || {};
  if (!s.paths && !s.mortal) { s.paths = ['fa']; s.flags.pathFree = 1; }   // 修行路線上線前的存檔
  if (m.arcDone && m.arcDone.bei) { m.story = m.story || {}; m.story.n4 = 1; (m.codex.m = m.codex.m || {}).n4 = 1; }
  codexSync(s);   // 輪迴錄
  if (s.root) pathSkillCheck(s);
  if (s.phys && PHYS_SHEN[s.phys] && !s.flags.physShen) { s.flags.physShen = 1; gainShen(PHYS_SHEN[s.phys], `${PHYSIQUES[s.phys].name}血脈甦醒`, s); }
  if (s.root && s.stage >= 18 && !s.flags.benming) { s.flags.benming = 1; gainShen(benmingShen(s), '元神與天地相合', s); }
}

// ---------- 開局抽根骨 ----------
function rollPhys(dao, not = []) {
  const ids = Object.keys(PHYSIQUES).filter(id => !not.includes(id));
  return pickW(ids, id => { const r = PHYSIQUES[id].r; return PHYS_WEIGHT[r] * (r >= 3 ? 1 + dao * .04 : 1); });   // 道體以上，道心越高越容易出現
}
// 根骨選項：多看一眼 +1 個；天不負我保證好靈根和道體以上體質；先天聖體保證聖體以上體質
function drawRoots(meta, keep) {
  const t = id => meta.talents[id] || 0, n = 3 + t('duoxuan');
  const roots = keep ? [keep] : [];
  while (roots.length < n) roots.push(rollRoot(meta.dao));
  if (t('baodi') && !roots.some(r => ROOT_TYPES.find(x => x.id === r.type).good)) {
    do { roots[n - 1] = rollRoot(meta.dao); } while (!ROOT_TYPES.find(x => x.id === roots[n - 1].type).good);
  }
  return roots;
}
function drawPhys(meta) {
  const t = id => meta.talents[id] || 0, n = 3 + t('duoxuan'), phys = [];
  for (let i = 0; i < n; i++) phys.push(rollPhys(meta.dao, phys));
  const need = t('xiantian') ? 4 : t('baodi') ? 3 : 0;
  if (need && !phys.some(id => PHYSIQUES[id].r >= need)) phys[n - 1] = pick(Object.keys(PHYSIQUES).filter(id => PHYSIQUES[id].r >= need && !phys.includes(id)));
  return phys;
}
function makeDraw(meta, keepRoot) {
  return { roots: drawRoots(meta, keepRoot), phys: drawPhys(meta), r: -1, p: -1, rr: rerollN(meta) };
}
// 靈根、體質各自有重抽次數
function rerollN(meta) { const n = 1 + Math.floor(meta.dao / 15) + (meta.talents.chongchou || 0); return { r: n, p: n }; }
function pickDraw(kind, i) { L().draw[kind] = i; render(); }
function rerollDraw(kind) {
  const d = L().draw; if (d.rr[kind] <= 0) return;
  d.rr[kind]--;
  if (kind === 'r') { d.roots = drawRoots(S.meta); d.r = -1; } else { d.phys = drawPhys(S.meta); d.p = -1; }
  render();
}
function confirmDraw() {
  const s = L(), d = s.draw; if (d.r < 0 || d.p < 0) return;
  const first = !s.root;
  s.root = d.roots[d.r]; s.phys = d.phys[d.p]; s.draw = null;
  codexAdd('p', s.phys); codexAdd('r', s.root.type); s.root.elems.forEach(e => codexAdd('el', e));
  if (PHYS_SHEN[s.phys] && !s.flags.physShen) { s.flags.physShen = 1; gainShen(PHYS_SHEN[s.phys], `${PHYSIQUES[s.phys].name}血脈甦醒`); }   // 天賦神通
  if (s.mortal) { s.mortal.phase = 'path'; s.mortal.pick = []; lastNow = Date.now(); save(); render(); return; }   // 凡人篇：測完靈根，先擇道再感氣
  log(first && S.meta.lives === 1 ? `你在青竹林外的一間茅屋醒來。十六歲，剛學會引氣。路過的老道說你身負${rootName()}、${PHYSIQUES[s.phys].name}。`
    : first ? `第 ${S.meta.lives} 世。你在一個陌生的村子醒來，心裡卻記得一些不該記得的事。這一世，你身負${rootName()}、${PHYSIQUES[s.phys].name}。`
    : `你看清了自己的根骨：${rootName()}、${PHYSIQUES[s.phys].name}。`);
  lastNow = Date.now(); save(); render();
}

// ---------- 凡人篇 ----------
// 每一世從凡人開始：做事累積入道前的底子 → 仙緣三選一 → 測靈根 → 感氣 → 練氣一層
const MORTAL_YEARS = 2;   // 幾年後仙緣上門（線上 2 年 = 4 分鐘）
// 凡人能做的事：acts 裡記的是「做了多少」（已乘上出身加成），入道時結算
const MORTAL_ACTS = {
  farm:  { name: '務農做工', desc: '攢下銀兩，入道後換成靈石', gain: n => `靈石 +${Math.floor(n * 2)}` },
  trade: { name: '跑商',     desc: '賺得比務農多一倍，但偶爾會被搶、賠本', gain: n => `靈石 +${Math.floor(n * 4)}` },
  wu:    { name: '習武',     desc: '打熬筋骨，入道後氣血、攻擊、防禦略高', gain: n => `體魄 +${(n * .04).toFixed(1)}%` },
  book:  { name: '讀書',     desc: '開闊心智，入道後主修功法起步較快', gain: n => `功法進度 +${Math.floor(n * 2)}` },
  herb:  { name: '採藥',     desc: '在山裡認草藥，入道時換成聚氣丹', gain: n => `聚氣丹 +${Math.floor(n / 30)}` },
  story: { name: '聽說書',   desc: '茶館裡聽仙人的傳說，仙緣上門時選項更多', gain: n => `仙緣選項 +${storyFates(n)}` },
};
const storyFates = n => n >= 160 ? 2 : n >= 60 ? 1 : 0;
const FATES = {
  sect:   { name: '仙門收徒', desc: '仙門下山到鎮上測靈根收徒。入門後有宗門發的靈石和丹藥。',
            test: '仙師取出一塊巴掌大的測靈石，讓你把手按上去。石頭亮了起來。',
            enter: '你被收入仙門，成了外門弟子', give: s => { s.stone += 300; addItem('juqi', 2); addItem('heal', 2); return '宗門發下靈石 300、聚氣丹 2 顆、療傷丹 2 顆'; } },
  scroll: { name: '山中殘卷', desc: '在山洞裡撿到半卷古書。沒有師門照應，但得到一部偏門功法。',
            test: '殘卷末頁畫著一套感氣的法門。照著練了幾夜，你隱約看見了自己體內的靈根。',
            enter: '你照著殘卷自己摸索，踏上了仙途', give: s => { const id = randomUnowned('tech', [2]); if (!id) return ''; learnTech(id); return `從殘卷裡悟出《${TECHS[id].name}》`; } },
  sanxiu: { name: '散修收徒', desc: '一個背著酒葫蘆的怪老頭說你骨頭不錯。他會教你一門術法。',
            test: '老頭捏了捏你的手骨，又按了按你的眉心，嘖了一聲。',
            enter: '你跟著怪老頭走了，他沒說自己叫什麼', give: s => { const id = randomUnowned('skill', [2]); if (!id) return ''; learnSkill(id); return `老頭教了你${SKILLS[id].name}`; } },
  fruit:  { name: '誤食異果', desc: '在深山吃了一顆通紅的怪果子。體質必有道體以上，但開局帶傷。',
            test: '異果的藥力在體內亂竄，痛得你在地上打滾。等它平息下來，你第一次看清了自己的身體。',
            enter: '你靠著異果的藥力硬生生打通了經脈', give: s => { injure(240); return '藥力太猛，經脈帶傷'; } },
  herb:   { name: '藥鋪學徒', desc: '鎮上藥鋪的老掌櫃收你當學徒。他年輕時好像煉過丹，會送你一些丹藥。',
            test: '老掌櫃把一株靈草放在你掌心，盯著它是枯萎還是抽芽。',
            enter: '老掌櫃教你認藥、引氣，你在藥香裡入了門', give: s => { addItem('juqi', 5); addItem('heal', 3); return '老掌櫃送了聚氣丹 5 顆、療傷丹 3 顆'; } },
  ferry:  { name: '渡口艄公', desc: '渡口那個划了幾十年船的老艄公，忽然問你想不想活得久一點。',
            test: '老艄公讓你把手伸進河裡。河水繞著你的手指打轉，他點了點頭。',
            enter: '老艄公把你渡到了河的另一邊，那裡是修士的地界', give: s => { addItem('yanshou'); return '臨別時他塞給你一顆延壽丹'; } },
  beast:  { name: '靈鹿報恩', desc: '你救下一隻被獸夾夾傷的白鹿。牠的眼睛像人一樣。',
            test: '白鹿領你到一處山洞，洞壁上的石頭被你一碰就發出微光。',
            enter: '白鹿領著你找到一座無主的洞府', give: s => { s.stone += 500; return '洞府裡有前人留下的靈石 500'; } },
  dream:  { name: '夢中授法', desc: '連著好幾夜，你夢見一個看不清臉的人在教你呼吸。',
            test: '夢裡那人在你眉心點了一下。醒來時，你感覺得到身體裡有東西在流動。',
            enter: '照著夢裡學的法子，你自己引氣入體', give: s => { s.techs[s.tech] += 600; addItem('wudao'); return '主修功法起步更快，枕邊還多了一顆悟道丹'; } },
};
// 出身：每一世開頭抽 4 個選 1。r 稀有度（越高越少見）、mul 哪件事做得比較好、enter 入道時的額外好處
const ORIGINS = {
  nong:    { name: '農家子弟', r: 1, mul: { farm: 1.5 }, desc: '從小跟著下田。務農做工 +50%。' },
  lie:     { name: '獵戶之子', r: 1, mul: { wu: 1.5 }, desc: '跟著父親進山打獵。習武 +50%。' },
  gu:      { name: '街頭孤兒', r: 1, mul: {}, extraFate: 1, desc: '無牽無掛，哪裡都去得。仙緣選項 +1。' },
  yu:      { name: '漁家兒女', r: 1, mul: { farm: 1.2, herb: 1.2 }, desc: '在水邊長大。務農做工、採藥 +20%。' },
  yaonong: { name: '藥農之後', r: 1, mul: { herb: 1.5 }, desc: '家裡世代採藥。採藥 +50%。' },
  shu:     { name: '書香門第', r: 2, mul: { book: 1.5 }, desc: '家裡藏書不少。讀書 +50%。' },
  shang:   { name: '商賈之家', r: 2, mul: { trade: 1.3 }, enter: s => { s.stone += 300; return '家裡給的盤纏換成靈石 300'; }, desc: '家境殷實。跑商 +30%，入道時多帶靈石 300。' },
  yi:      { name: '醫館之後', r: 2, mul: { book: 1.2, herb: 1.2 }, enter: s => { addItem('heal', 3); return '帶著家傳的療傷丹 3 顆'; }, desc: '家裡開醫館。讀書、採藥 +20%，入道時帶療傷丹 3 顆。' },
  biao:    { name: '鏢局之子', r: 2, mul: { trade: 1.5, wu: 1.2 }, safe: 1, desc: '跟著鏢車走南闖北。跑商 +50% 而且不會被搶，習武 +20%。' },
  xi:      { name: '戲班出身', r: 2, mul: { story: 2 }, desc: '台上演的都是神仙故事。聽說書的效果加倍。' },
  wuguan:  { name: '武館少主', r: 3, mul: { wu: 2 }, desc: '自幼在武館長大。習武收穫翻倍。' },
  xianyi:  { name: '落魄仙裔', r: 3, mul: { book: 1.2 }, rr: 1, desc: '祖上出過修士，家道早已中落。讀書 +20%，測靈根時靈根、體質各多重抽一次。' },
  daoguan: { name: '道觀雜役', r: 3, mul: { book: 1.2 }, fastQi: 1, desc: '在山上道觀掃了幾年地，聽慣了早晚課。讀書 +20%，感氣快一倍。' },
  wangzu:  { name: '沒落王族', r: 4, mul: { farm: 1.3, trade: 1.3, wu: 1.3, book: 1.3, herb: 1.3, story: 1.3 }, enter: s => { s.stone += 500; return '變賣祖傳的玉佩，得靈石 500'; }, desc: '前朝王族的遺孤。做什麼都 +30%，入道時多帶靈石 500。' },
  yixiang: { name: '天生異象', r: 4, mul: {}, rr: 1, goodPhys: 1, desc: '出生那夜滿天星斗亂墜。測靈根時必有道體以上體質，靈根、體質各多重抽一次。' },
};
const ORIGIN_W = { 1: 6, 2: 3, 3: 1.5, 4: .5 };
function drawOrigins() { const ids = []; while (ids.length < 4) ids.push(pickW(Object.keys(ORIGINS).filter(id => !ids.includes(id)), id => ORIGIN_W[ORIGINS[id].r])); return ids; }
const mortalYears = () => tl('xianyuan') >= 2 ? 0 : MORTAL_YEARS / (1 + tl('xianyuan'));
// 感氣要幾秒：靈根越好越快
const qiNeed = (s = L()) => tl('xianyuan') >= 2 ? 0 : Math.max(5, Math.round(40 / rootRate(s) / (s.mortal && ORIGINS[s.mortal.origin]?.fastQi ? 2 : 1)));
function newMortal(start) { return { phase: 'birth', origins: drawOrigins(), origin: null, act: 'farm', start, acts: Object.fromEntries(Object.keys(MORTAL_ACTS).map(k => [k, 0])), fates: null, fate: null, qi: 0, robT: 30 }; }
function chooseOrigin(id) {
  const s = L(), m = s.mortal; if (m.phase !== 'birth' || !m.origins.includes(id)) return;
  m.origin = id; m.phase = 'live'; m.start = s.age; save(); render();
}
function setAct(a) { L().mortal.act = a; render(); }
function mortalTick(dt) {
  const s = L(), m = s.mortal;
  if (m.phase === 'live') {
    const o = ORIGINS[m.origin];
    s.age += dt / YEAR_SEC; m.acts[m.act] += dt * (o.mul[m.act] || 1);
    if (m.act === 'trade' && !o.safe && (m.robT -= dt) <= 0) { m.robT = 30; if (pct(.2)) m.acts.trade *= .7; }   // 跑商偶爾被搶
    if (s.age - m.start >= mortalYears()) {
      const n = 3 + (o.extraFate || 0) + storyFates(m.acts.story);
      m.phase = 'fate'; m.fates = Object.keys(FATES).sort(() => Math.random() - .5).slice(0, n); dirty = true;
    }
  } else if (m.phase === 'qi') {
    m.qi += dt; if (m.qi >= qiNeed()) enterPath();
  }
}
function chooseFate(id) {
  const s = L(), m = s.mortal; if (m.phase !== 'fate' || !m.fates.includes(id)) return;
  const o = ORIGINS[m.origin];
  m.fate = id; m.phase = 'test'; s.draw = makeDraw(S.meta);
  if (o.rr) { s.draw.rr.r++; s.draw.rr.p++; }
  if ((id === 'fruit' || o.goodPhys) && !s.draw.phys.some(p => PHYSIQUES[p].r >= 3)) s.draw.phys[0] = pick(Object.keys(PHYSIQUES).filter(p => PHYSIQUES[p].r >= 3 && !s.draw.phys.includes(p)));
  save(); render();
}
// 感氣完成：凡人時做的事、出身和仙緣的好處在這時結算，正式成為練氣一層
function enterPath() {
  if (!L().paths) { L().paths = ['fa']; L().flags.pathFree = 1; }
  const s = L(), m = s.mortal, f = FATES[m.fate], o = ORIGINS[m.origin], a = m.acts;
  s.stone += Math.floor(a.farm * 2 + a.trade * 4); s.body += a.wu * .0004; s.techs[s.tech] += Math.floor(a.book * 2);
  if (a.herb >= 30) addItem('juqi', Math.floor(a.herb / 30));
  const gift = [o.enter ? o.enter(s) : '', f.give(s)].filter(Boolean).join('；'), age = Math.floor(s.age);
  s.mortal = null;
  const intro = S.meta.lives === 1 ? `${age} 歲那年，${f.enter}。` : `第 ${S.meta.lives} 世。${age} 歲那年，${f.enter}，心裡卻記得一些不該記得的事。`;
  log(`${intro}你出身${o.name}，身負${rootName()}、${PHYSIQUES[s.phys].name}。引氣入體的那一刻，你成了練氣一層的修士。${gift ? gift + '。' : ''}`);
  save(); dirty = true;
}
// 擇道：第一條是主路線；兼修天賦可以多選
const pathMax = () => 1 + tl('jianxiu');
function pickPath(id) {
  const m = L().mortal, i = m.pick.indexOf(id);
  if (i >= 0) m.pick.splice(i, 1); else if (m.pick.length < pathMax()) m.pick.push(id);
  render();
}
function confirmPath() {
  const s = L(), m = s.mortal; if (!m || m.phase !== 'path' || !m.pick.length) return;
  s.paths = m.pick.slice(); S.meta.lastPaths = s.paths.slice();
  starterSwap(s);
  m.phase = 'qi'; m.qi = 0; lastNow = Date.now(); save(); render();
}
// 體修、魂修的入門功法和入門術法（還沒練過才換）
const STARTER = { ti: ['duangu', 'bengshan'], hun: ['ningshen', 'shennian'] };
function starterSwap(s = L()) {
  const st = STARTER[s.paths[0]]; if (!st) return;
  if (s.tech === 'yinqi' && !s.techs.yinqi) { delete s.techs.yinqi; s.techs[st[0]] = 0; s.tech = st[0]; }
  if ('qijin' in s.skills && !s.skills.qijin) { delete s.skills.qijin; s.skills[st[1]] = 0; s.equip = s.equip.map(k => k === 'qijin' ? st[1] : k); }
}
// 路線專屬大招：金丹、化神時領悟（兼修的路線也算）
const PATH_SKILLS = { ti: [['fatian', 2], ['santou', 4]], hun: [['shenhun', 2], ['wannian', 4]] };
function pathSkillCheck(s = L()) {
  if (!s.paths) return;
  for (const p of s.paths) for (const [id, mj] of PATH_SKILLS[p] || []) if (stg(s).major >= mj && !(id in s.skills)) { learnSkill(id); log(`你領悟了${PATHS[p].name}的大神通「${SKILLS[id].name}」！`); }
}
// 舊存檔：這一世還沒擇道，可以在根骨頁選一次
function choosePathLate(id) {
  const s = L(); if (!s.flags.pathFree) return;
  s.paths = [id]; s.flags.pathFree = 0; log(`你定下了修行的路：${PATHS[id].name}。`); save(); render();
}
function renderMortal() {
  const s = L(), m = s.mortal;
  const head = `<header><h1>長生閒記</h1><span class="muted">第 ${S.meta.lives} 世 · 凡人${speedCtl()}<button class="mini" onclick="goTitle()">首頁</button></span></header>`;
  if (m.phase === 'birth') return `${head}<section class="panel card"><b>出身</b>
    <p>${S.meta.lives === 1 ? '你降生在山腳下的一個小鎮。聽說山裡住著會飛的仙人，但沒有人真的見過。' : '你又一次生在凡人家裡，前世的事像一場記不清的夢。'}這一世，你生在什麼樣的人家？</p>
    <div class="opts">${m.origins.map(id => { const o = ORIGINS[id]; return `<button class="opt" onclick="chooseOrigin('${id}')"><b class="g${o.r}">${o.name}</b><span class="small">${o.desc}</span></button>`; }).join('')}</div></section>`;
  if (m.phase === 'fate') return `${head}<section class="panel card"><b>仙緣</b>
    <p>${Math.floor(s.age)} 歲這年，平靜的日子起了波瀾。你只能抓住其中一個機會。</p>
    <div class="opts">${m.fates.map(id => `<button class="opt" onclick="chooseFate('${id}')"><b>${FATES[id].name}</b><span class="small">${FATES[id].desc}</span></button>`).join('')}</div></section>`;
  if (m.phase === 'path') return `${head}<section class="panel card"><b>擇道</b>
    <p>測過靈根，引你入門的人問你：往後要走哪一條路？${pathMax() > 1 ? `前世的體悟讓你可以兼修，最多選 ${pathMax()} 條，第一條是主路，其他的效果減半。` : '選定之後，這一世就不能再改。'}</p>
    <div class="opts">${Object.entries(PATHS).map(([id, x]) => { const i = m.pick.indexOf(id); return `<button class="opt ${i >= 0 ? 'on' : ''}" onclick="pickPath('${id}')"><b>${x.name}${i === 0 && pathMax() > 1 ? '（主）' : i > 0 ? '（兼修）' : ''}</b><span class="small">${x.desc}</span></button>`; }).join('')}</div>
    <div class="btns"><button class="primary" ${m.pick.length ? '' : 'disabled'} onclick="confirmPath()">就走這條路</button></div></section>`;
  if (m.phase === 'qi') return `${head}<section class="panel card"><b>感氣</b>
    <p>${FATES[m.fate].test.split('。')[0]}。如今你身負${rootName()}，正盤坐著感應天地間的靈氣。</p>
    <div class="row small"><span>感氣</span><span id="qitxt"></span></div>${bar('xiu', 0, 'qibar')}
    <p class="small muted">靈根越好，感氣越快。感氣完成就能踏入練氣一層。</p></section>`;
  const yrs = mortalYears(), left = Math.max(0, m.start + yrs - s.age);
  return `${head}<section class="panel card"><b>凡人 · ${ORIGINS[m.origin].name} · <span id="mage">${Math.floor(s.age)}</span> 歲</b>
    <p class="small muted">仙緣還沒到。在那之前，先做點凡人能做的事，入道後都用得上。隨時可以換。</p>
    <div class="opts">${Object.entries(MORTAL_ACTS).map(([k, a]) => `<button class="opt ${m.act === k ? 'on' : ''}" onclick="setAct('${k}')"><b>${a.name}</b><span class="small">${a.desc}</span><span class="small same" id="act_${k}">${a.gain(m.acts[k])}</span></button>`).join('')}</div>
    <div class="row small"><span>仙緣將至</span><span id="ftxt">約 ${left.toFixed(1)} 年</span></div>${bar('xiu', 0, 'fbar')}</section>`;
}
function updateMortal() {
  const s = L(), m = s.mortal;
  if (m.phase === 'live' && $('fbar')) {
    const yrs = mortalYears() || 1, left = Math.max(0, m.start + mortalYears() - s.age);
    $('fbar').firstChild.style.width = Math.min(100, (s.age - m.start) / yrs * 100) + '%';
    $('ftxt').textContent = `約 ${left.toFixed(1)} 年`; $('mage').textContent = Math.floor(s.age);
    for (const k in MORTAL_ACTS) $('act_' + k).textContent = MORTAL_ACTS[k].gain(m.acts[k]);
  }
  if (m.phase === 'qi' && $('qibar')) {
    const need = qiNeed() || 1;
    $('qibar').firstChild.style.width = Math.min(100, m.qi / need * 100) + '%';
    $('qitxt').textContent = `${Math.floor(Math.min(100, m.qi / need * 100))}%`;
  }
}

// ---------- 時間加速（光陰如梭）----------
const gameSpeed = () => Math.max(1, Math.min(S.meta.speed || 1, 1 + tl('guangyin')));
function setSpeed(v) { S.meta.speed = +v; save(); render(); }
const speedCtl = () => tl('guangyin') ? `<select class="mini" onchange="setSpeed(this.value)">${Array.from({ length: 1 + tl('guangyin') }, (_, i) => i + 1).map(v => `<option value="${v}" ${gameSpeed() === v ? 'selected' : ''}>×${v}</option>`).join('')}</select>` : '';

// ---------- 小工具 ----------
const L = () => S.life;
const stg = (s = L()) => STAGES[s.stage];
const pct = p => Math.random() < p;
const pick = a => a[Math.floor(Math.random() * a.length)];
function pickW(list, w) { let x = Math.random() * list.reduce((a, o) => a + w(o), 0); return list.find(o => (x -= w(o)) < 0) || list[list.length - 1]; }
function fmt(n) { n = Math.floor(n); return n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '萬' : String(n); }
function log(text) { const s = L(); s.log.unshift({ age: Math.floor(s.age), text }); if (s.log.length > 120) s.log.length = 120; dirty = true; }
const place = (s = L()) => PLACES.find(p => p.id === s.place);
const placeLv = () => place().lv;
const stoneUnit = (lv = placeLv()) => Math.round(4 * Math.pow(lv, 1.4));
const auctionPrice = () => Math.round(400 * Math.pow(1.3, Math.max(0, L().stage - 5)));
const pillDisc = () => (1 - .1 * tl('zhekou')) * (L().sect && L().sect.id === 'dan' ? .7 : 1);   // 丹房熟客
const healPrice = () => Math.round(20 * (1 + L().stage) * pillDisc());
const mpPillPrice = () => Math.round(15 * (1 + L().stage) * pillDisc());
const cavePrice = () => 80 * Math.pow(2, L().cave);
const xiuPillPrice = () => Math.round(25 * Math.pow(1.5, L().stage) * pillDisc());
const itemPrice = id => {
  const st = L().stage, k = ITEMS[id].kind, f = Math.pow(1 + st, 1.5);
  return k === 'heal' ? healPrice() : k === 'mp' ? mpPillPrice() : k === 'xiu' ? xiuPillPrice() : k === 'tc' ? tcPrice(id) : k === 'root' ? ESSENCE_PRICE : k === 'dan' ? Math.round(ITEMS[id].base * f * pillDisc()) : Math.round(pillDisc() * (k === 'brk' ? BRK_PILL_PRICE[ITEMS[id].major]
    : { life: 200, body: 500, tech: 150 }[k] * f));
};
// 賣給坊市：原價七成。原價用丹藥本身的價位算，不跟著現在的境界漲
const SELL_RATE = .7;
// 天材地寶：對應突破丹的三倍價（不打丹房折扣）
const ESSENCE_PRICE = 30000;   // 五行之精
const tcPrice = id => BRK_PILL_PRICE[ITEMS[id].major] * 3;
// 下一個大境界要用的天材地寶（渡劫以後沒有）
const tcNext = (s = L()) => s.stage < STAGES.length - 1 ? TC_ITEMS[stg(s).major] : null;
const tcBuyPrice = () => Math.round(tcPrice(tcNext()) * .8);
function addTc() { const id = tcNext(); if (!id) return ''; addItem(id); return ITEMS[id].name; }
const sellItemPrice = id => {
  const it = ITEMS[id], k = it.kind;
  const base = k === 'tc' ? tcPrice(id) : k === 'root' ? ESSENCE_PRICE : k === 'dan' ? it.base : k === 'brk' ? BRK_PILL_PRICE[it.major] : k === 'xiu' ? 25 * Math.pow(1.5, STAGES.findIndex(x => x.major === it.major))
    : k === 'heal' ? 20 : k === 'mp' ? 15 : { life: 200, body: 500, tech: 150 }[k];
  return Math.max(1, Math.round(base * SELL_RATE));
};
const sellArtPrice = id => Math.round(ART_PRICE[ARTS[id].grade] * SELL_RATE);
function sellItem(id) { const s = L(); if (!count(id)) return; s.items[id]--; s.stone += sellItemPrice(id); save(); render(); }
function sellArt(id) {
  const s = L(); if (!(id in s.arts) || isOn(id)) return;
  if (armed !== 'sell:' + id) { armed = 'sell:' + id; render(); return; }
  armed = ''; const p = sellArtPrice(id); delete s.arts[id]; s.stone += p;
  log(`把${ARTS[id].name}賣給了坊市，得靈石 ${fmt(p)}。`); save(); render();
}
const refreshPrice = () => Math.round(20 * Math.pow(1.4, L().stage));
// ---------- 修行路線（法修、體修、魂修）：入道時選，兼修天賦可多選，第二條起五折 ----------
// gain 隨大境界成長（練氣 ×0.6 → 渡劫 ×1.6）；cost 不隨境界變；sub 對應輔修類型效果 ×1.5
const PATHS = {
  fa:  { name: '法修', desc: '主流的修法，主修吐納功法、用法力施法：法術威力 +30%、法力 +50%、每回合多回 4% 法力；氣血 -10%。悟性類輔修效果 ×1.5。',
         gain: { mp: .5, faUp: .3, mpRegen: .04 }, cost: { hp: -.1 }, sub: ['悟性'] },
  ti:  { name: '體修', desc: '苦修肉身，主修鍛體功法、用血氣施展體術：氣血 +50%、防禦 +40%、普通攻擊 +60%（體術也吃一半）；血氣開戰只有兩成，要越打越多，大境界突破要額外花靈石淬體。靈根的修煉倍率只算三成，鍛體功法不挑靈根。輔修鍛體功法效果 ×1.5。',
         gain: { hp: .5, def: .4, normalAtk: .6 }, cost: {}, sub: ['鍛體'] },
  hun: { name: '魂修', desc: '修神魂，主修觀想功法、用神識施展神魂術（耗得少、威力 +30%、控制機率 ×1.5，但神識回得慢）：神通威力 +40%、暴擊 +10%、功法精進 +30%、奇遇 +20%；氣血 -15%，戰敗負傷時間加倍。靈根的修煉倍率只算一半。悟性、長生類輔修效果 ×1.5。',
         gain: { shenUp: .4, hunUp: .3, crit: .1, techXp: .3, evRate: .2 }, cost: { hp: -.15, injury: 1 }, sub: ['悟性', '長生'] },
};
// 路線的凡界境界名（法修用原名）、體修練氣九層各練一處
const PATH_REALM = { ti: ['淬體', '銅皮', '鐵骨', '金身', '琉璃', '寶血', '法身', '聖軀', '不滅'], hun: ['凝魂', '識海', '神念', '元神', '陰神', '陽神', '千念', '通神', '不朽'] };
const TI_QI = ['煉皮', '煉肉', '煉筋', '煉骨', '煉髓', '煉血', '煉臟', '易筋', '洗髓'];
// 大境界突破時的紀事（築基～渡劫）
const PATH_FLAVOR = {
  ti: ['', '皮膜堅韌如銅，尋常刀劍已難破開', '骨骼沉重如鐵，一拳能碎山石', '周身泛起淡淡金光，法寶難傷', '肉身通透如琉璃，經脈清晰可見', '血液化作寶血，一滴落地重若千鈞', '肉身與法力相融，舉手便是神通', '肉身成聖，百邪不侵', '只要一滴血還在，就能重塑肉身'],
  hun: ['', '識海初開，神識能看清十丈內的一草一木', '神念可以離體，悄無聲息地探查四方', '元神凝實，肉身受創也不致身死', '陰神能夜遊出竅，看得見常人看不見的東西', '陽神能在白日顯形，一念之間化出身影', '同時轉動千般念頭，分心萬用', '神魂與天地相通，冥冥中能感知禍福', '神魂不朽，縱然肉身成灰，真靈也不散'],
};
const pathList = (s = L()) => (s.paths || []).map((id, i) => [id, i ? .5 : 1]);
const pathGrow = (s = L()) => .6 + .125 * Math.min(8, stg(s).major);
// 路線對某個效果的總和：gain 乘權重和境界成長，cost 只乘權重
function pathEff(key, s = L()) {
  if (!s.paths) return 0;
  const f = pathGrow(s);
  return pathList(s).reduce((a, [id, w]) => a + (PATHS[id].gain[key] || 0) * w * f + (PATHS[id].cost[key] || 0) * w, 0);
}
// 輔修類型對上路線：效果 ×1.5（兼修的五折）
// 體質對上修行路線：效果 ×1.3（兼修那條 ×1.15）
const physMul = (s = L()) => { const pp = s.phys && PHYSIQUES[s.phys].path; return 1 + pathList(s).reduce((a, [id, w]) => a + (id === pp ? .3 * w : 0), 0); };
const subBoost = (id, s = L()) => 1 + pathList(s).reduce((a, [p, w]) => a + (PATHS[p].sub.includes(TECHS[id].type) ? .5 * w : 0), 0);
// 境界顯示：修為滿了顯示大圓滿；體修、魂修顯示自己的境界名，括號帶統一境界
function realmName(s = L()) {
  const st = stg(s), mj = MAJORS[st.major], sub = st.name.slice(mj.name.length);
  const full = isMajorNext(s) && s.xiu >= st.need, subTxt = full ? '大圓滿' : sub, unified = mj.name + subTxt;
  const main = s.paths && s.paths[0];
  if (!main || main === 'fa' || st.major > 8) return unified;
  if (st.major === 0) return `${full ? PATH_REALM[main][0] + '圓滿' : main === 'ti' ? TI_QI[mj.subs.indexOf(sub)] : '凝魂' + sub}（${unified}）`;
  return `${PATH_REALM[main][st.major]}境・${subTxt}（${unified}）`;
}
const isMajorNext = (s = L()) => s.stage < STAGES.length - 1 && STAGES[s.stage + 1].major !== stg(s).major;
const count = id => L().items[id] || 0;
function addItem(id, n = 1) { const s = L(); s.items[id] = (s.items[id] || 0) + n; }

// ---------- 靈根 ----------
function rollRoot(dao) {
  const t = pickW(ROOT_TYPES, r => r.w * (r.good ? 1 + dao * .04 : 1));
  const pool = [...t.pool].sort(() => Math.random() - .5);
  return { type: t.id, elems: t.id === 'void' ? [] : pool.slice(0, t.n) };
}
const rootType = (s = L()) => ROOT_TYPES.find(r => r.id === s.root.type);
// 靈根的修煉倍率：法修全算，體修只算三成（靠氣血肉身），魂修算一半（看神魂）；兼修照主路線
const ROOT_WEIGHT = { fa: 1, ti: .3, hun: .5 };
const rootRate = (s = L()) => +(1 + (rootType(s).rate - 1) * ROOT_WEIGHT[myPaths(s)[0]]).toFixed(3);
// ---------- 靈根後期路線（化神後啟動） ----------
// five 五行圓滿（金木水火土齊全）、pure 靈根化道（天靈根、變異靈根）、void 萬法歸空（空靈根）
const PATH_STAGE = 18;
const ROOT_PATHS = {
  five: { name: '五行圓滿', desc: '修煉 ×2、大境界突破率 +10%、氣血攻擊防禦 +20%、五行術法親和 +30%' },
  pure: { name: '靈根化道', desc: '同屬性主修修煉 ×1.3，同屬性術法威力 ×1.5，同屬性神通的一擊威力 ×1.5' },
  void: { name: '萬法歸空', desc: '無屬性主修修煉 ×1.3，無屬性術法威力 ×1.5，無屬性神通的一擊威力 ×1.5，受到的屬性攻擊再減兩成' },
};
function rootPathOf(s = L()) {
  const t = s.root && s.root.type;
  if (!t) return null;
  if (t === 'void') return 'void';
  if (t === 'heaven' || t === 'mutant') return 'pure';
  return FIVE.every(e => s.root.elems.includes(e)) ? 'five' : null;
}
const pathOn = (s = L()) => s.stage >= PATH_STAGE ? rootPathOf(s) : null;
// 五行之精能不能用：變異、空靈根不能補；已經有這個屬性也不行
function essenceBlock(id, s = L()) {
  const t = s.root.type, e = ITEMS[id].elem;
  if (t === 'mutant') return '變異靈根超脫五行，補不進去';
  if (t === 'void') return '空靈根容不下任何屬性';
  if (s.root.elems.includes(e)) return `靈根已有${e}屬性`;
  return '';
}
// 功法分頁靈根區的說明：走哪條後期路線、啟動了沒；雜靈根就提示還缺哪些屬性
function pathLine(s = L()) {
  const p = rootPathOf(s);
  if (p) return `後期路線：<b class="same">${ROOT_PATHS[p].name}</b>（${s.stage >= PATH_STAGE ? '已啟動' : '踏入化神後啟動'}）：${ROOT_PATHS[p].desc}`;
  const miss = FIVE.filter(e => !s.root.elems.includes(e));
  return `<span class="muted">靈根不全，沒有後期路線。煉化五行之精補齊${miss.join('、')}，踏入化神後可得五行圓滿（靈根越雜，前期修煉越慢）。</span>`;
}
function useEssence(id) {
  const s = L(); if (!count(id) || essenceBlock(id)) return;
  // 天靈根會失去純度，要按兩次確認
  if (s.root.type === 'heaven' && armed !== 'ess:' + id) { armed = 'ess:' + id; render(); return; }
  armed = '';
  const before = rootName();
  s.items[id]--; s.root.elems.push(ITEMS[id].elem);
  s.root.type = ['', 'heaven', 'dual', 'triple', 'quad', 'five'][s.root.elems.length];
  codexAdd('r', s.root.type); codexAdd('el', ITEMS[id].elem);
  log(`煉化${ITEMS[id].name}，靈根由${before}化為${rootName()}。${rootPathOf(s) === 'five' ? '五行齊全，踏入化神後可得五行圓滿。' : ''}`);
  save(); render();
}
// 下一個能補的五行之精（給事件、坊市、掉落用）；靈根補不了就回 null
function essenceNext(s = L()) {
  if (!s.root || ['mutant', 'void', 'five'].includes(s.root.type)) return null;
  const ids = ROOT_ITEMS.filter(id => !s.root.elems.includes(ITEMS[id].elem));
  return ids.length ? pick(ids) : null;
}
function addEssence() { const id = essenceNext(); if (!id) return ''; addItem(id); return ITEMS[id].name; }
function rootName(s = L()) {
  const t = rootType(s), e = s.root.elems.join('');
  return t.id === 'void' || t.id === 'five' ? t.name : t.id === 'heaven' ? e + '天靈根' : t.id === 'mutant' ? e + '變異靈根' : e + t.name;
}
// 這個屬性是否和靈根契合（空靈根只親和無屬性）
const rootFits = (elem, s = L()) => elem === '無' ? s.root.type === 'void' : s.root.elems.includes(elem);
// 術法是否享有靈根親和（萬象歸元體什麼屬性都算）
const skillFits = (elem, s = L()) => rootFits(elem, s) || (s.phys && PHYSIQUES[s.phys].allAff);
// 主修類型：法修吐納、體修鍛體、魂修觀想；兼修了哪條路就能主修哪類
const PATH_MAIN = { fa: '吐納', ti: '鍛體', hun: '觀想' };
const MAIN_PATH = { 吐納: 'fa', 鍛體: 'ti', 觀想: 'hun' };
const isMainType = ty => ty in MAIN_PATH;
// 能不能輔修：非主修類都行，鍛體也行（輔修時不算修煉速度）
const subOk = t => !isMainType(t.type) || t.type === '鍛體';
const myPaths = (s = L()) => s.paths && s.paths.length ? s.paths : ['fa'];
const pathOk = (id, s = L()) => myPaths(s).includes(MAIN_PATH[TECHS[id].type]);
function canMain(id, s = L()) { const t = TECHS[id]; return isMainType(t.type) && pathOk(id, s) && (t.grade < 3 || t.elem === '無' || t.type === '鍛體' || rootFits(t.elem, s)); }   // 鍛體借外力淬身，不挑靈根
// 修不了的原因（給介面用）
const mainBlock = (id, s = L()) => !pathOk(id, s) ? `需走${PATHS[MAIN_PATH[TECHS[id].type]].name}` : `需${TECHS[id].elem}屬性靈根`;

// ---------- 功法效果 ----------
const equipped = (s = L()) => [s.tech, ...s.subs];
// ---------- 雙主修（悟道樹「兩儀同修」） ----------
// 副主修的修煉和加成打折：五行相生五成、其他三成；相剋不能同修
const SHENG = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
const clash = (a, b) => (COUNTERS[a] || []).includes(b) || (COUNTERS[b] || []).includes(a);
function dualFactor(id, main = L().tech) {
  const a = TECHS[main].elem, b = TECHS[id].elem;
  if (a !== '無' && b !== '無' && clash(a, b)) return 0;
  return SHENG[a] === b || SHENG[b] === a ? .5 : .3;
}
const dualOn = (s = L()) => s.tech2 && tl('liangyi') ? s.tech2 : null;
// ---------- 自創功法：化神後主修、副主修都圓滿，融合成一部 ----------
// 效果是兩部相加打八折，直接從第 9 層開始；自創的功法存在 s.custom，讀檔時再登記回 TECHS
const FUSE_SKIP = ['name', 'grade', 'type', 'elem', 'custom'];
const FUSE_TAIL = /[訣經錄法功典篇圖心術譜]+$/;
const canFuse = (s = L()) => !!dualOn(s) && s.stage >= PATH_STAGE && techLayer(s.tech, s) >= 9 && techLayer(s.tech2, s) >= 9;
function fuseName(a, b) {
  const ca = [...a.replace(FUSE_TAIL, '')], cb = [...b.replace(FUSE_TAIL, '')], names = new Set(Object.values(TECHS).map(t => t.name));
  for (let i = 0; i < 30; i++) { const n = pick(ca) + pick(cb) + pick(['訣', '經', '錄', '真解']); if (!names.has(n) && n[0] !== n[1]) return n; }
  return ca[0] + cb[0] + '合道經';
}
function fuseTech() {
  const s = L(); if (!canFuse(s)) return;
  if (armed !== 'fuse') { armed = 'fuse'; render(); return; }
  armed = '';
  const a = TECHS[s.tech], b = TECHS[s.tech2];
  const d = { name: fuseName(a.name, b.name), grade: Math.max(a.grade, b.grade), type: a.type, elem: a.elem !== '無' ? a.elem : b.elem, custom: 1 };
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!FUSE_SKIP.includes(k)) d[k] = +(((a[k] || 0) + (b[k] || 0)) * .8).toFixed(3);
  const id = 'zc' + Date.now().toString(36);
  TECHS[id] = d; (s.custom = s.custom || {})[id] = d;
  s.techs[id] = techNeed(id, 9); s.tech = id; s.tech2 = null;
  log(`融會《${a.name}》與《${b.name}》，自創《${d.name}》，一出手便是圓滿之境！`);
  save(); render();
}
// 設副主修：換掉原本的副主修要散功（兩次確認）；再點一次同一部就卸下
function setDual(id) {
  const s = L();
  if (s.tech2 === id) { s.tech2 = null; log(`放下副主修《${TECHS[id].name}》。`); save(); render(); return; }
  if (!tl('liangyi') || !canMain(id) || id === s.tech || !dualFactor(id)) return;
  if (s.tech2 && armed !== 'dual:' + id) { armed = 'dual:' + id; render(); return; }
  armed = '';
  if (s.tech2) { s.xiu /= 2; log(`散功改修，副主修換成《${TECHS[id].name}》，修為折半。`); }
  else log(`兩儀同修，以《${TECHS[id].name}》為副主修。`);
  s.tech2 = id; s.subs = s.subs.filter(x => x !== id); save(); render();
}
function techNeed(id, l) { return l * l * 60 * TECHS[id].grade; }
function techLayer(id, s = L()) { return Math.min(9, Math.floor(Math.sqrt((s.techs[id] || 0) / (60 * TECHS[id].grade)))); }
function techMul(id, s = L()) { const l = techLayer(id, s); return 1 + .1 * l + (l >= 9 ? .1 : 0); }
function effOf(id, key, s = L()) { const v = TECHS[id][key] || 0; return NO_SCALE.includes(key) ? v : v * techMul(id, s); }
// 法寶祭煉倍率
const artMul = (id, s = L()) => 1 + .15 * (s.arts[id] || 0);
// 所有加成來源：主修＋輔修功法、法寶（隨祭煉放大）、體質
function eff(key, s = L()) {
  let v = equipped(s).reduce((a, id, i) => a + (i && key === 'rate' ? 0 : effOf(id, key, s) * (i ? subBoost(id, s) : 1)), 0) + pathEff(key, s);   // 輔修不算修煉速度
  const t2 = dualOn(s); if (t2) v += effOf(t2, key, s) * dualFactor(t2, s.tech);   // 副主修打折
  for (const id of gearIds(s)) v += (ARTS[id][key] || 0) * (NO_SCALE.includes(key) ? 1 : artMul(id, s));
  if (s.phys) v += (PHYSIQUES[s.phys][key] || 0) * physMul(s);
  return v + talentEff(key) + buffEff(key, s) + sectEff(key, s);
}
// ---------- 限時藥效（s.buffs：丹藥 id → 剩幾秒） ----------
const buffOn = (id, s = L()) => !!(s.buffs && s.buffs[id] > 0);
function buffEff(key, s = L()) {
  if (!s.buffs) return 0;
  switch (key) {
    case 'rate': return buffOn('julingdan', s) ? .5 : 0;
    case 'techXp': return buffOn('qizhidan', s) ? 1 : 0;
    case 'atk': return buffOn('kuangxue', s) ? .3 : 0;
    case 'def': return (buffOn('kuangxue', s) ? -.1 : 0) + (buffOn('jingangdan', s) ? .4 : 0);
    case 'mp': return buffOn('ningshendan', s) ? .5 : 0;
    case 'evRate': return buffOn('yinyuan', s) ? 1 : 0;
    case 'drop': return buffOn('xunbaodan', s) ? 1 : 0;
  }
  return 0;
}
function tickBuffs(sec, s = L()) { if (s.buffs) for (const k in s.buffs) if ((s.buffs[k] -= sec) <= 0) delete s.buffs[k]; }
// 悟道樹提供的加成
function talentEff(key) {
  const fu = tl('tianming');
  switch (key) {
    case 'rate': return .05 * tl('suhui');
    case 'atk': case 'hp': return .05 * tl('zhanyi');
    case 'dodge': return .02 * tl('shenqing');
    case 'stone': return .1 * tl('caiyun') + fu;
    case 'drop': return .2 * tl('diaoluo') + fu;
    case 'evRate': return .25 * tl('qiyu');
    case 'pillEff': return .1 * tl('yaoli');
    case 'techXp': return .1 * tl('tianren');
    case 'lifePct': return .05 * tl('shouyuan');
  }
  return 0;
}
const maxEquip = () => 4 + tl('slot5') + tl('slot6');
const maxSubs = () => 2 + tl('fuxiu');
const maxBrkPills = () => 3 + tl('sidan');
function lifespan(s = L()) { return (MAJORS[stg(s).major].life + eff('life', s) + s.lifeBonus) * (1 + eff('lifePct', s)); }
function skillLv(id, s = L()) { const u = s.skills[id] || 0; return MASTERY_USES.filter(x => u >= x).length - 1; }
const toxFactor = (s = L()) => Math.max(.1, 1 - s.tox / 100);
const toxRes = () => Math.min(.8, eff('toxRes'));
function rate(s = L(), mode = s.mode) {
  const main = TECHS[s.tech];
  return (1 + .2 * s.stage) * rootRate(s) * (main.elem !== '無' && rootFits(main.elem, s) ? 1.15 : 1)
    * (1 + eff('rate', s)) * (mode === 'closed' ? 1 + .15 * s.cave : 1) * (1 + .03 * S.meta.dao)
    * (s.age / lifespan(s) > .7 ? 1 + eff('lateRate', s) : 1)
    * (s.injury > 0 ? .5 : 1) * (mode === 'travel' ? .5 : 1) * (1 + qualBonus(s)) * pathRate(s);
}
// 靈根後期路線的修煉倍率
function pathRate(s = L()) {
  const p = pathOn(s), el = TECHS[s.tech].elem;
  return p === 'five' ? 2 : p === 'pure' && el === s.root.elems[0] ? 1.3 : p === 'void' && el === '無' ? 1.3 : 1;
}
// 靈根化道、萬法歸空：同路線屬性的術法、神通威力
const pathElem = (s = L()) => { const p = pathOn(s); return p === 'pure' ? s.root.elems[0] : p === 'void' ? '無' : null; };
function stats(s = L()) {
  const k = 1 + .5 * s.stage, b = (1 + s.body) * (1 + qualBonus(s)) * (pathOn(s) === 'five' ? 1.2 : 1);   // 突破品質也加氣血、攻擊、防禦
  return {
    hp: Math.round(100 * k * (1 + eff('hp')) * b), mp: Math.round(50 * k * techMul(s.tech, s) * (1 + eff('mp'))), atk: 10 * k * (1 + eff('atk')) * b, def: 5 * k * (1 + eff('def')) * b,
    spd: Math.max(1, Math.round(10 + 2 * s.stage + eff('spd'))), crit: .05 + eff('crit'), critDmg: 1.5 + eff('critDmg'),
    dodge: eff('dodge'), regen: eff('regen'), lifesteal: eff('lifesteal'),
  };
}
function brkPillsUsed(s = L()) { return isMajorNext(s) ? Math.min(count(BRK_PILLS[stg(s).major]), maxBrkPills()) : 0; }
// mode：大境界的突破方式，safe 穩紮穩打、all 全力一搏（成功率打七五折）
function brkChance(s = L(), mode = s.brkMode) {
  if (s.stage >= STAGES.length - 1) return 0;
  let p = isMajorNext(s) ? MAJORS[stg(s).major].brk + .05 * tl('pojing') : .92 - .03 * stg(s).major;
  p += eff('brk', s) + s.brkBonus + (s.found || 0) + BRK_PILL_BONUS.slice(0, brkPillsUsed(s)).reduce((a, b) => a + b, 0);
  if (isMajorNext(s)) p += Math.min(.3, S.meta.dao * .0015);   // 道心越深，大境界越穩（最多 +30%）
  if (isMajorNext(s) && pathOn(s) === 'five') p += .1;   // 五行圓滿
  if (isMajorNext(s) && mode === 'all') p *= .75;
  return Math.max(.01, Math.min(.98, p));
}
// ---------- 突破品質（大境界成功時決定，這一世永久加成修煉、氣血、攻擊） ----------
const QUAL_BONUS = [0, .05, .1, .2];
const QUAL_RANK = ['下品', '中品', '上品', '極品'];
// 依新境界的大境界編號（1 築基、2 金丹、3 元嬰、4 以後是法相）
const QUAL_NAMES = {
  1: ['下品道基', '中品道基', '上品道基', '無瑕道基'],
  2: ['下品金丹', '中品金丹', '上品金丹', '九竅金丹'],
  3: ['無異象', '霞光滿天', '紫氣東來', '萬象來朝'],
};
const qualName = (major, q) => (QUAL_NAMES[major] || ['虛影法相', '凝實法相', '通明法相', '不滅法相'])[q];
const qualBonus = (s = L()) => Object.values(s.qual || {}).reduce((a, q) => a + QUAL_BONUS[q], 0);
// 品質分數：根基、靈根、突破丹、全力一搏、天材地寶，再加一點運氣；沒有天材地寶最多上品
function rollQual(s, found, used, mode, tc) {
  const rt = rootType(s).id, root = ['heaven', 'mutant', 'void'].includes(rt) ? .3 : rt === 'dual' ? .15 : 0;
  const sc = found / .3 + root + used * .1 + (mode === 'all' ? .5 : 0) + (tc ? .6 : 0) + Math.random() * 1.2;
  return sc >= 2.6 && tc ? 3 : sc >= 1.8 ? 2 : sc >= 1 ? 1 : 0;
}
// 路數威力：本路法術吃法修加成、本路體術吃一半普攻加成；別路 ×0.6
function schPow(id, s = L()) {
  if (!ownSch(id, s)) return .6;
  const c = schOf(id); return c === 'fa' ? 1 + pathEff('faUp', s) : c === 'ti' ? 1 + .5 * eff('normalAtk', s) : 1 + pathEff('hunUp', s);
}
function skillPow(id, s = L()) {
  const sk = SKILLS[id], same = sk.elem !== '無' && sk.elem === TECHS[s.tech].elem;
  const ph = s.phys && PHYSIQUES[s.phys], boost = ph && (ph.boost === sk.elem || (ph.boosts || []).includes(sk.elem)) ? ph.boostAmt || 1.3 : 1;
  return sk.pow * (1 + .25 * skillLv(id, s)) * (same ? 1.2 : 1) * (1 + (skillFits(sk.elem, s) ? (pathOn(s) === 'five' ? .3 : rootType(s).aff) : 0)) * boost * (pathElem(s) === sk.elem ? 1.5 : 1) * (1 + eff('skillUp', s)) * schPow(id, s);
}
// 術法耗法力：看品階和境界（法力上限 50×境界係數×主修層數，每回合回 8%）
const SKILL_COST = [0, 1, 1.5, 2, 2.6];
// 路數：本路（有那條路線）耗本路資源，神魂術耗費 ×0.5；別路的從主路資源轉換，耗費 ×1.5、威力 ×0.6
const schOf = id => skillSchool(SKILLS[id]);
const ownSch = (id, s = L()) => myPaths(s).includes(schOf(id));
const skillCost = (id, s = L()) => SKILLS[id].kind === 'mana' ? 0 : Math.round(10 * (1 + .5 * s.stage) * SKILL_COST[SKILLS[id].grade] * (!ownSch(id, s) ? 1.5 : schOf(id) === 'hun' ? .5 : 1));
// 這招從哪條資源條扣
const skillRes = (id, s = L()) => ownSch(id, s) ? schOf(id) : myPaths(s)[0];
// 神魂術的控制機率：魂修 ×1.5（兼修 ×1.25），沒走魂修 ×0.6
function ctrlMul(id, s = L()) {
  if (schOf(id) !== 'hun') return 1;
  const i = myPaths(s).indexOf('hun'); return i < 0 ? .6 : i ? 1.25 : 1.5;
}
// 各資源上限：主路線全額，兼修六成
function resMax(p, s = L(), st = stats(s)) { const ps = myPaths(s), i = ps.indexOf(p); return i < 0 ? 0 : Math.round(st.mp * (i ? .6 : 1)); }
// 屬性相剋倍率：a 攻、d 守
// mine：是不是你在出手（看破五行只強化你這一方）
function elemMul(a, d, mine = true) {
  if (!a || !d || a === '無' || d === '無') return 1;
  const k = mine && tl('kanpo');
  return COUNTERS[a] && COUNTERS[a].includes(d) ? (k ? 1.6 : 1.3) : COUNTERS[d] && COUNTERS[d].includes(a) ? (k ? .9 : .75) : 1;
}

// ---------- 給事件用的獎懲 ----------
function addStone(n) { n = Math.max(0, Math.round(n)); L().stone += n; return n; }
// 厚積薄發：修為滿了還在閉關，多出來的修為化為根基；多修出一整個境界的量就攢滿 +30% 突破率
function addFound(amount) { const s = L(); s.found = Math.min(.3, (s.found || 0) + amount / stg().need * .3); }
function addXiu(frac) { const s = L(), need = stg().need, g = Math.min(need - s.xiu, Math.round(need * frac * .35)); s.xiu += Math.max(0, g); return Math.max(0, g); }
// 給當前境界用得上的突破丹（化神期沒有突破丹，改給修為丹），回傳丹名
function addPill(n) { const m = stg().major, id = BRK_PILLS[m] || XIU_PILLS[m]; addItem(id, n); return ITEMS[id].name; }
function addHeal(n) { addItem('heal', n); }
function addXiuPill(n) { const id = XIU_PILLS[stg().major]; addItem(id, n); return ITEMS[id].name; }
// 主修功法精進，sec 相當於修煉幾秒的進度
function addTechXp(sec) { const s = L(); s.techs[s.tech] += sec; return TECHS[s.tech].name; }
function addLife(n) { L().lifeBonus += n; }
function injure(sec) { const s = L(); s.injury = Math.max(s.injury, sec * (1 - .25 * tl('liaoshang'))); }
function learnTech(id) { const s = L(); if (!(id in s.techs)) s.techs[id] = 0; codexAdd('t', id); }
function learnSkill(id) { const s = L(); if (!(id in s.skills)) { s.skills[id] = 0; if (s.equip.length < maxEquip()) s.equip.push(id); } codexAdd('k', id); }
// ---------- 輪迴錄：歷世見過的東西都記在 meta.codex；每收錄 20 項給 2 道果 ----------
// t 功法、k 術法、a 法寶、s 神通、p 體質、r 靈根種類、el 靈根屬性、v 遊歷事件；人物結局直接看 meta.arcDone
const CODEX_STEP = 20, CODEX_GUO = 2;
function codexAdd(kind, id) {
  const m = S.meta; m.codex = m.codex || {}; const c = m.codex[kind] = m.codex[kind] || {};
  if ((kind === 't' && (!TECHS[id] || TECHS[id].custom)) || c[id]) return;
  c[id] = 1; codexPay();
}
const codexCount = (m = S.meta) => Object.values(m.codex || {}).reduce((a, c) => a + Object.keys(c).length, 0) + Object.keys(m.arcDone || {}).length;
function codexPay() {
  const m = S.meta, due = Math.floor(codexCount() / CODEX_STEP);
  while ((m.codexPaid || 0) < due) { m.codexPaid = (m.codexPaid || 0) + 1; m.guo += CODEX_GUO; if (S.life) log(`輪迴錄收錄滿 ${m.codexPaid * CODEX_STEP} 項，悟得道果 ${CODEX_GUO}。`); }
}
// 這一世身上的東西全部補記一次（讀檔、上線前的存檔用）
function codexSync(s = L()) {
  for (const id in s.techs) codexAdd('t', id);
  for (const id in s.skills) codexAdd('k', id);
  for (const id in s.arts || {}) codexAdd('a', id);
  for (const id of s.shen || []) codexAdd('s', id);
  if (s.phys) codexAdd('p', s.phys);
  if (s.root) { codexAdd('r', s.root.type); s.root.elems.forEach(e => codexAdd('el', e)); }
  const sn = S.meta.evSeen = S.meta.evSeen || {};
  for (const k in s.flags || {}) if (k.startsWith('ev_')) { codexAdd('v', k.slice(3)); if (!sn[k.slice(3)]) sn[k.slice(3)] = S.meta.lives; }
  codexPay();
}
// 輪迴錄分頁：第一排選類別，功法、術法、法寶再分第二排；有品階的照天地玄黃分段排成格子
const GRADE_NAMES = ['', '黃階', '玄階', '地階', '天階'];
const LUN_TABS = [['m', '主線'], ['t', '功法'], ['k', '術法'], ['a', '法寶'], ['s', '神通'], ['p', '體質'], ['r', '靈根'], ['v', '事件'], ['j', '人物']];
let codexTab = 't', codexSub = '';
function setCodexView(k, v) { if (k === 'tab') { codexTab = v; codexSub = ''; } else codexSub = v; render(); }
function renderCodex() {
  const c = S.meta.codex || {}, has = (k, id) => !!(c[k] && c[k][id]), n = codexCount(), next = (Math.floor(n / CODEX_STEP) + 1) * CODEX_STEP;
  const nav = (items, cur, k) => `<nav class="wrap">${items.map(([v, name]) => `<button class="${cur === v ? 'on' : ''}" onclick="setCodexView('${k}', '${v}')">${name}</button>`).join('')}</nav>`;
  const cell = (k, id, name, cls) => has(k, id) ? `<span class="${cls}">${name}</span>` : '<span class="muted">？？？</span>';
  const section = (title, cls, k, ids, nameOf) => ids.length ? `<div class="row small" style="margin-top:8px"><b class="${cls}">${title}</b><span class="muted">${ids.filter(id => has(k, id)).length}/${ids.length}</span></div>
    <div class="codex">${ids.map(id => cell(k, id, nameOf(id), cls)).join('')}</div>` : '';
  // 有品階的：依第二排分組，再照天地玄黃分段
  const graded = (P, key, keys) => {
    if (!keys.includes(codexSub)) codexSub = keys[0];
    const ids = Object.keys(P).filter(id => P[id][key] === codexSub && !P[id].custom);
    return nav(keys.map(g => { const l = Object.keys(P).filter(id => P[id][key] === g && !P[id].custom); return [g, `${g} ${l.filter(id => has(codexTab, id)).length}/${l.length}`]; }), codexSub, 'sub')
      + [4, 3, 2, 1].map(g => section(GRADE_NAMES[g], 'g' + g, codexTab, ids.filter(id => P[id].grade === g), id => P[id].name)).join('');
  };
  let body = '';
  if (codexTab === 't') body = graded(TECHS, 'type', TECH_TYPES);
  else if (codexTab === 'k') body = graded(SKILLS, 'elem', SKILL_ELEMS);
  else if (codexTab === 'a') body = graded(ARTS, 'slot', ART_SLOTS);
  else if (codexTab === 's') body = [...new Set(Object.values(SHENS).map(x => x.type))].map(ty => section(ty, 'g4', 's', Object.keys(SHENS).filter(id => SHENS[id].type === ty), id => SHENS[id].name)).join('');
  else if (codexTab === 'p') body = [5, 4, 3, 2, 1].map(r => section(PHYS_RANK[r], 'g' + r, 'p', Object.keys(PHYSIQUES).filter(id => PHYSIQUES[id].r === r), id => PHYSIQUES[id].name)).join('');
  else if (codexTab === 'r') body = section('靈根種類', 'g3', 'r', ROOT_TYPES.map(x => x.id), id => ROOT_TYPES.find(x => x.id === id).name)
    + section('靈根屬性', 'g2', 'el', [...FIVE, ...MUTANT], e => e + '靈根');
  else if (codexTab === 'm') body = section('碑與名', 'g4', 'm', STORY_NODES.map(x => x[0]), id => STORY_NODES.find(x => x[0] === id)[1]) + '<p class="muted small">主線的線索散落在一世又一世裡。</p>';
  else if (codexTab === 'v') body = section('遊歷事件', 'g2', 'v', EVENTS.map(e => e.id), id => EVENTS.find(e => e.id === id).title);
  else body = `<div class="small" style="margin-top:8px">${Object.keys(ARCS).map(id => { const end = S.meta.arcDone[id];
      return `<div class="row item"><b class="who">${ARCS[id].name}</b><span>${end ? ARC_END_LABEL[end] || end : '<span class="muted">未結緣</span>'}</span></div>`; }).join('')}</div>
      <p class="muted small">重要人物整個遊戲只會遇見一次，走到哪個結局就是哪個。</p>`;
  return `<p class="small">已收錄 ${n} 項。每收錄 ${CODEX_STEP} 項悟得道果 ${CODEX_GUO}，下一次在 ${next} 項。</p>
    ${nav(LUN_TABS.map(([k, name]) => [k, name]), codexTab, 'tab')}${body}`;
}
function randomUnowned(kind, grades) {
  const s = L(), pool = { tech: TECHS, skill: SKILLS, art: ARTS }[kind], owned = { tech: s.techs, skill: s.skills, art: s.arts }[kind];
  const ids = Object.keys(pool).filter(id => grades.includes(pool[id].grade) && !(id in owned) && id !== 'hunyuan' && id !== 'xueying' && !pool[id].boss && !pool[id].sect && !pool[id].only);
  return ids.length ? (kind === 'tech' ? pickTech(ids, s) : pick(ids)) : null;
}
// 抽功法：三成五機會從自己路線修得了的主修類功法裡抽（鍛體、觀想功法比吐納少，免得一直撿不到）
function pickTech(ids, s = L()) { const own = ids.filter(id => isMainType(TECHS[id].type) && pathOk(id, s)); return own.length && Math.random() < .35 ? pick(own) : pick(ids); }
function tryDrop(p) {
  if (!pct(p * (1 + eff('drop')))) return '';
  const pl = place(), r = Math.random();
  if (r < .4) { const id = randomUnowned('tech', pl.grades); if (id) { learnTech(id); return `，還有一卷《${TECHS[id].name}》`; } }
  if (r < .8) { const id = randomUnowned('skill', pl.grades); if (id) { learnSkill(id); return `，還有一本《${SKILLS[id].name}》秘籍`; } }
  const id = randomUnowned('art', pl.grades); if (id) { gainArt(id); return `，還有一件${ARTS[id].slot}「${ARTS[id].name}」`; }
  return '';
}
// 法寶：得到時如果那一格空著就直接裝上
// 法寶境界門檻（依品階）：玄階築基、地階金丹、天階元嬰
const ART_REALM = [0, 0, 9, 12, 15], ART_REALM_NAME = ['', '', '築基', '金丹', '元嬰'];
const artOk = (id, s = L()) => s.stage >= ART_REALM[ARTS[id].grade];
// 身上的欄位：武器、護甲各一格，飾品格數看「萬寶隨身」
const accKeys = () => ['飾品', '飾品2', '飾品3'].slice(0, 1 + tl('wanbao'));
const gearKeys = () => ['武器', '護甲', ...accKeys()];
const gearIds = (s = L()) => gearKeys().map(k => s.gear[k]).filter(Boolean);
const isOn = (id, s = L()) => gearKeys().some(k => s.gear[k] === id);
// 這件法寶能放的空格（武器、護甲直接換掉；飾品找空著的格子，滿了就回 null）
const freeKey = (id, s = L()) => ARTS[id].slot !== '飾品' ? ARTS[id].slot : accKeys().find(k => !s.gear[k]) || null;
function gainArt(id) { const s = L(); codexAdd('a', id); if (!(id in s.arts)) { s.arts[id] = 0; const k = freeKey(id, s); if (k && !s.gear[k] && artOk(id, s)) s.gear[k] = id; } }
function equipArt(id) {
  const s = L(), on = gearKeys().find(k => s.gear[k] === id);
  if (on) s.gear[on] = null;
  else { const k = freeKey(id); if (!k || !artOk(id)) return; s.gear[k] = id; }
  save(); render();
}
const refinePrice = id => Math.round(ART_PRICE[ARTS[id].grade] * .4 * Math.pow(1.6, L().arts[id]));
function refineArt(id) {
  const s = L(), p = refinePrice(id); if (s.stone < p || s.arts[id] >= ART_MAX_REFINE) return;
  s.stone -= p; s.arts[id]++; log(`「${ARTS[id].name}」祭煉到第 ${s.arts[id]} 重。`);
  // 器靈神通：天階法寶祭煉圓滿
  if (s.arts[id] >= ART_MAX_REFINE && ARTS[id].grade === 4 && !s.flags['shenA_' + id]) { s.flags['shenA_' + id] = 1; gainShen(randShen(), `「${ARTS[id].name}」器靈甦醒`); }
  save(); render();
}

// ---------- 戰鬥（自動回合制） ----------
function hit(atk, def) { return Math.max(atk * .15, atk - def * .6) * (.9 + Math.random() * .2); }
function fight(foe) {
  const s = L(), p = stats(), myElem = TECHS[s.tech].elem, isVoid = s.root.type === 'void' || !!(s.phys && PHYSIQUES[s.phys].noCounter);
  // 從上一場剩下的氣血、法力開始打（連戰會越打越虛）
  let php = p.hp * Math.max(.05, s.hpNow ?? 1), ehp = foe.hp, shield = 0, dodgeT = 0, dodgePow = 0, r = 0, charge = 1;
  let burn = 0, burnT = 0, brkT = 0, brkV = 0, skip = 0, reflT = 0, reflV = 0, buffT = 0, buffV = 0, pill = false;
  const cd = {}, used = {};
  // 三種資源：法力帶上一場剩的、血氣每場從兩成開始越打越多、神識帶上一場剩的且幾乎不回
  const R = {}; for (const k of myPaths(s)) { const m = resMax(k, s, p); R[k] = { m, v: m * (k === 'fa' ? s.mpNow ?? 1 : k === 'hun' ? s.snNow ?? 1 : .2) }; }
  const RB = { fa: .08, ti: 0, hun: .04 }, mainR = R[myPaths(s)[0]];
  const pool = k => R[skillRes(k, s)], addR = (k, f) => { const x = R[k]; if (x) x.v = Math.min(x.m, x.v + x.m * f); };
  // 神通：領域類整場生效，其他記下來等時機
  const shens = (s.shen || []).map(id => SHENS[id]), shUsed = [], clones = [];
  const twice = !!s.flags.xingshen; if (twice) s.flags.xingshen = 0;   // 醒神丹
  let faAtk = 1, faDef = 1, faT = 0, reflAll = 0, mpRegen = eff('mpRegen', s), skillUp = 0, fled = false;
  const sm = 1 + eff('shenUp', s), na = 1 + eff('normalAtk', s);   // 魂修神通、體修普攻
  for (const x of shens.filter(x => x.trig === 'field')) {
    shUsed.push(x.name);
    if (x.foeAtk) foe = { ...foe, atk: foe.atk * x.foeAtk };
    if (x.foeDef !== undefined) foe = { ...foe, def: foe.def * x.foeDef };
    p.regen += x.regen || 0; p.dodge += x.dodge || 0; p.lifesteal += x.steal || 0; p.crit += x.crit || 0;
    reflAll += x.reflect || 0; mpRegen += x.mpRegen || 0; skillUp += x.skillUp || 0; if (x.mpFull) for (const k in R) R[k].v = R[k].m;
  }
  const strike = (atk, elem, drain = 0, defMul = 1) => {
    let m = elemMul(elem, foe.elem); if (isVoid) m = Math.max(1, m);
    let d = hit(atk * m * (buffT > 0 ? 1 + buffV : 1) * (faT > 0 ? faAtk : 1), foe.def * defMul * (brkT > 0 ? 1 - brkV : 1));
    if (pct(p.crit)) d *= p.critDmg;
    ehp -= d; php = Math.min(p.hp, php + d * (p.lifesteal + drain));
  };
  while (php > 0 && ehp > 0 && r < 30) {
    r++;
    // 開場神通：第一回合先發動（靈根化道、萬法歸空：同屬性神通一擊 ×1.5）
    const pe = pathElem(s);
    if (r === 1 || (twice && r === 3)) for (const x of shens.filter(x => x.trig === 'open')) {
      shUsed.push(x.name);
      if (x.brk) { brkT = 3; brkV = Math.max(brkV, x.brk); }
      const nk = (x.nuke || 0) * sm * (pe && (x.elem === pe || (pe === '無' && x.elem === 'void')) ? 1.5 : 1);
      if (nk) { if (x.pierce) ehp -= p.atk * nk; else strike(p.atk * nk, '無'); }
      if (x.burn) { burn = p.atk * x.burn * sm; burnT = 4; }
      if (x.stun) skip = Math.max(skip, x.stun);
      if (x.fa) { faAtk = x.fa[0]; faDef = x.fa[1]; faT = x.fa[2]; }
      if (x.shield) shield += p.hp * x.shield * sm;
      if (x.clone) clones.push({ v: x.clone[0] * sm, t: x.clone[1], n: x.clone[2] });
    }
    // 冷卻好的術法；回法要法力不到一半才放，增益還在就不重複放
    const ready = s.equip.filter(k => !(cd[k] > 0) && !(SKILLS[k].kind === 'mana' && pool(k).v > pool(k).m * .5) && !(SKILLS[k].kind === 'buff' && (buffT > 0 || (SKILLS[k].fa && faT > 0))));
    // 資源不夠放招、又傷到一半：自動服回氣丹（每場一顆，回主路線的資源）
    if (!pill && ready.length && ready.every(k => skillCost(k) > pool(k).v) && php < p.hp * .5 && count('huiqi')) {
      s.items.huiqi--; S.meta.pills++; pill = true; mainR.v = Math.min(mainR.m, mainR.v + mainR.m * .6);
    }
    const id = ready.find(k => skillCost(k) <= pool(k).v);
    if (id) {
      const sk = SKILLS[id], pw = skillPow(id) * (1 + skillUp), cm = ctrlMul(id, s);
      pool(id).v -= skillCost(id); cd[id] = sk.cd + 1; s.skills[id] += 1 + .5 * tl('shulian'); used[id] = (used[id] || 0) + 1;
      if (sk.kind === 'dmg' || sk.kind === 'multi') {
        // 先上破防再打，打完才結算灼燒和控制
        if (sk.brk) { brkT = 3; brkV = Math.max(brkV, sk.brk); }
        for (let h = 0; h < (sk.hits || 1); h++) strike(p.atk * pw * charge, sk.elem, sk.drain || 0, sk.pierce ? 0 : 1);
        charge = 1; addR('ti', .1);
        if (sk.burn) { burn = p.atk * sk.burn * (pw / sk.pow); burnT = 3; }
        if ((sk.freeze && pct(sk.freeze * cm)) || (sk.stun && pct(sk.stun * cm))) skip = Math.max(skip, sk.stunT || 1);
      }
      else if (sk.kind === 'heal') php = Math.min(p.hp, php + p.hp * .12 * pw);
      else if (sk.kind === 'shield') { shield += p.hp * .12 * pw; if (sk.reflect) { reflT = 3; reflV = sk.reflect; } }
      else if (sk.kind === 'charge') charge = 2 * (1 + .25 * skillLv(id));
      else if (sk.kind === 'buff') { if (sk.fa) { faAtk = sk.fa[0]; faDef = sk.fa[1]; faT = sk.fa[2]; if (sk.shieldX) shield += p.hp * sk.shieldX; } else { buffT = 3; buffV = .15 * pw; } }
      else if (sk.kind === 'mana') { const x = pool(id); x.v = Math.min(x.m, x.v + x.m * .2 * pw); }
      else { dodgeT = 3; dodgePow = pw; }
    } else strike(p.atk * charge * na, myElem), charge = 1, addR('ti', .1);
    for (const c of clones) if (c.t > 0) { for (let h = 0; h < c.n; h++) strike(p.atk * c.v, myElem, 0, .3); c.t--; }   // 分身追擊（神通之力，大半無視防禦）
    for (const k in cd) cd[k]--;
    if (burnT > 0) { ehp -= burn; burnT--; }
    brkT--;
    if (ehp <= 0) break;
    if (skip > 0) skip--;   // 冰凍或麻痺：敵人這回合動不了
    else {
      const evade = Math.min(.75, Math.max(.03, .05 + (p.spd - foe.spd) * .01 + p.dodge + (dodgeT > 0 ? .35 * dodgePow : 0)));
      if (!pct(evade)) {
        let m = elemMul(foe.elem, myElem, false); if (isVoid) m = Math.min(1, m);
        if (pathOn(s) === 'void' && foe.elem !== '無') m *= .8;
        const d = hit(foe.atk * m, p.def * (faT > 0 ? faDef : 1)), a = Math.min(shield, d); shield -= a; php -= d - a; addR('ti', .08);
        ehp -= d * ((reflT > 0 ? reflV : 0) + reflAll);
      }
    }
    // 保命神通：受到致命傷時發動（不滅回血、遁法直接走人）
    if (php <= 0) {
      const x = shens.find(x => x.trig === 'lethal' && shUsed.filter(n => n === x.name).length < (twice ? 2 : 1));
      if (x) { shUsed.push(x.name); if (x.flee) { fled = true; php = p.hp * .05; break; } php = p.hp * x.revive; }
    }
    dodgeT--; reflT--; buffT--; faT--;
    php = Math.min(p.hp, php + p.hp * p.regen);
    for (const k in R) addR(k, RB[k] + mpRegen);
  }
  if (R.hun) s.snNow = R.hun.v / R.hun.m;
  return { win: ehp <= 0, fled, rounds: r, used: Object.keys(used).map(k => SKILLS[k].name).join('、'), shen: shUsed.join('、'), pill, hp: Math.max(0, php) / p.hp, mp: R.fa ? R.fa.v / R.fa.m : s.mpNow ?? 1 };
}
// ---------- 秘境：每個大境界一座，三層（兩層精英、一層頭目），連戰不回血；有冷卻，戰敗重傷退出 ----------
const SECRETS = [
  { id: 'yaogu',   mj: 1, name: '荒古藥谷', elem: '木', elites: ['毒藤傀儡', '藥谷守衛'], boss: '千年藤妖', uniq: ['art', 'tengxin'], desc: '谷裡的藥草長了一萬年，守谷的藤妖也活了一萬年。' },
  { id: 'huoku',   mj: 2, name: '赤焰火窟', elem: '火', elites: ['熔岩蟲群', '火窟獄卒'], boss: '焰甲火蜥', uniq: ['skill', 'huoxitu'], desc: '地火從石縫裡噴出來，空氣燙得能烤熟人。' },
  { id: 'shuifu',  mj: 3, name: '沉淵水府', elem: '水', elites: ['水府蝦兵', '沉淵巡海夜叉'], boss: '沉淵蛟王', uniq: ['art', 'jiaolin'], desc: '一座沉在深淵裡的古水府，蛟王在裡面睡了三千年。' },
  { id: 'leidian', mj: 4, name: '雷鳴古殿', elem: '雷', elites: ['雷殿傀儡', '持戟雷將'], boss: '雷殿守將', uniq: ['skill', 'dianqian'], desc: '殿裡沒有人，雷聲卻從來沒停過。' },
  { id: 'micheng', mj: 5, name: '虛空迷城', elem: '無', elites: ['迷城幻影', '無面守衛'], boss: '迷城之主', uniq: ['art', 'michengyao'], desc: '一座漂在虛空裡的城，進去的人很少走得出來。' },
  { id: 'jianfen', mj: 6, name: '萬劍墳', elem: '金', elites: ['殘劍劍靈', '斷劍劍奴'], boss: '劍塚老魔', uniq: ['art', 'wanjianxia'], desc: '上萬把劍插在地上，每一把都曾經有主人。' },
  { id: 'bingyuan', mj: 7, name: '寒天冰淵', elem: '冰', elites: ['冰魄行屍', '寒淵冰魔'], boss: '冰淵古龍', uniq: ['skill', 'longxi'], desc: '冰淵底下封著一條龍，龍還沒死。' },
  { id: 'jiexu',   mj: 8, name: '劫火天墟', elem: '火', elites: ['劫灰', '劫火遊魂'], boss: '劫火化身', uniq: ['art', 'jiehuoxin'], desc: '歷代渡劫失敗的修士，劫火都燒到了這裡。' },
];
const SECRET_CD = 30;   // 冷卻（遊戲年）
// 各秘境的難度倍率：前期角色弱、後期角色強，所以前低後高
const SECRET_SCALE = [0, .8, .85, .9, 1.2, 1.4, 1.6, 1.85, 2.1];
const secretOpen = (x, s = L()) => stg(s).major >= x.mj;
const secretWait = (x, s = L()) => { const t = s.flags['sj_' + x.id]; return t === undefined ? 0 : Math.max(0, Math.ceil(t + SECRET_CD - s.age)); };
// 第 floor 層（0、1 精英，2 頭目）的強度
function secretFoe(x, floor, s = L()) {
  const lv = s.stage + 1 + floor, mult = [1.1, 1.2, 1.4][floor] * SECRET_SCALE[x.mj], k = 1 + .5 * (lv - 1), hpX = floor === 2 ? 1.8 : 1;
  return { hp: 115 * k * mult * hpX, atk: 11.5 * k * mult, def: 4.5 * k * mult, spd: 10 + 2 * (lv - 1), elem: x.elem };
}
let showSecret = false;
function toggleSecret() { showSecret = !showSecret; render(); }
function enterSecret(id) {
  const s = L(), x = SECRETS.find(q => q.id === id);
  if (!x || !secretOpen(x) || secretWait(x) || s.injury > 0) return;
  s.flags['sj_' + id] = s.age;
  const names = [...x.elites, x.boss];
  for (let f = 0; f < 3; f++) {
    const res = fight(secretFoe(x, f));
    s.hpNow = res.hp; s.mpNow = res.mp;
    if (!res.win) {
      injure(res.fled ? 200 : 600);
      log(`【${x.name}】${f === 2 ? '頭目' : `第 ${f + 1} 層的`}${names[f]}太強，你${res.fled ? '遁走' : '重傷'}退出了秘境（${res.rounds} 回合）。`);
      save(); render(); return;
    }
    log(`【${x.name}】擊敗${names[f]}（${res.rounds} 回合，剩氣血 ${Math.round(res.hp * 100)}%）。`);
  }
  // 頭目獎勵：天材地寶、高階寶物、靈石丹藥，第一次通關必掉專屬，之後四分之一
  const lv = s.stage + 3, gr = x.mj >= 4 ? [4] : [3, 4], got = [];
  const tc = x.mj === stg().major ? addTc() : ''; if (tc) got.push(tc);   // 天材地寶只有當前境界的秘境才給，免得低階秘境被反覆刷
  got.push(pick([giftArt, giftTech, giftSkill])(gr));
  got.push(`靈石 ${addStone(stoneUnit(lv) * 30)}`, `${addPill(2)} 2 顆`);
  const first = !s.flags['sjc_' + id]; s.flags['sjc_' + id] = 1;
  const [kind, uid] = x.uniq, owned = kind === 'art' ? uid in s.arts : uid in s.skills;
  if (!owned && (first || Math.random() < .25)) { if (kind === 'art') gainArt(uid); else learnSkill(uid); got.push(`頭目專屬「${(kind === 'art' ? ARTS : SKILLS)[uid].name}」`); }
  log(`【${x.name}】你斬了${x.boss}！得到：${got.join('、')}。`);
  save(); render();
}
function renderSecret() {
  const s = L();
  return `<section class="panel card"><div class="row"><b>秘境</b><button class="mini" onclick="toggleSecret()">收起</button>
        <button class="${showSect ? 'on' : ''}" onclick="toggleSect()">宗門</button></div>
    <p class="small muted">三層連戰，中間氣血、法力不回滿。前兩層是精英，第三層是頭目；打敗頭目必得高階寶物（闖的是當前境界的秘境，還會得到天材地寶），第一次通關還有頭目專屬掉落。戰敗會重傷退出，不會身死。每座秘境闖完要等 ${SECRET_CD} 年。</p>
    ${SECRETS.map(x => { const open = secretOpen(x), w = open ? secretWait(x) : 0;
      return `<div class="item"><div class="row"><b>${x.name}</b><span class="small muted">${MAJORS[x.mj].name}以上 · 頭目：${x.boss}${s.flags['sjc_' + x.id] ? ' · 已通關' : ''}</span></div>
        <div class="row small"><span class="muted">${x.desc}</span><span>${!open ? `<span class="muted">需${MAJORS[x.mj].name}</span>` : w ? `<span class="muted">還要 ${w} 年</span>` : s.injury > 0 ? '<span class="hurt">傷勢未癒</span>' : `<button class="mini" onclick="enterSecret('${x.id}')">闖秘境</button>`}</span></div></div>`; }).join('')}</section>`;
}
// ---------- 宗門：每個大境界最多兩次招收；任務換貢獻，貢獻換功法丹藥，累積貢獻晉升；定期大比 ----------
// eff：每升一階身分多一份的被動加成；types：藏經閣能換的功法類型
const SECTS = {
  jian: { name: '凌霄劍宗', desc: '劍修聖地，弟子出劍快、準、狠。', eff: { atk: .04, crit: .01 }, types: ['劍修', '身法'], excl: 'lingxiaojue' },
  dan:  { name: '百草丹宗', desc: '以丹立宗，弟子買丹打七折，藏經閣能換突破丹。', eff: { pillEff: .05, toxRes: .03 }, types: ['丹道', '長生'], excl: 'baicaogy', pills: 1 },
  ti:   { name: '金剛門', desc: '體修宗門，門規只有一條：先學會挨打。', eff: { hp: .05, def: .04 }, types: ['鍛體', '殺伐'], excl: 'jingangbh', path: 'ti' },
  hun:  { name: '觀神宗', desc: '修神魂的隱世宗門，弟子多半沉默寡言。', eff: { techXp: .06, crit: .01 }, types: ['觀想', '悟性', '尋寶'], excl: 'guanshenlu', path: 'hun' },
  dao:  { name: '太清道門', desc: '正統道門，吐納功法傳承最全。', eff: { rate: .04, mp: .04 }, types: ['吐納'], excl: 'taiqingxy', path: 'fa' },
};
const SECT_RANK = ['外門弟子', '內門弟子', '真傳弟子', '長老'];
const RANK_NEED = [0, 200, 900, 3000];      // 晉升要的累積貢獻
const RANK_STAGE = [0, 9, 12, 15];          // 晉升要的境界：內門要築基、真傳要金丹、長老要元嬰
const SECT_PAY = 10, SECT_DUTY = 30, SECT_BIGBI = 30;   // 俸祿每 10 年、30 年沒做任務會被降級、大比每 30 年
const TECH_CONTRIB = [0, 30, 120, 500, 2000];
const sectOf = (s = L()) => s.sect && SECTS[s.sect.id];
// 宗門加成；散修（築基起）遊歷靈石、奇遇 +20%
function sectEff(key, s = L()) {
  if (s.sect) return (SECTS[s.sect.id].eff[key] || 0) * (s.sect.rank + 1);
  return s.stage >= 9 && (key === 'stone' || key === 'evRate') ? .2 : 0;
}
// 招收：還沒有宗門、這個大境界被問不到兩次；修行路線對得上的宗門比較容易來
function recruitCands(s = L()) {
  if (s.sect || s.stage < 1 || (s.flags['rc_' + stg(s).major] || 0) >= 2) return [];
  return Object.keys(SECTS);
}
function joinSect(id) {
  const s = L(); s.sect = { id, rank: 0, contrib: 0, total: 0, pay: s.age + SECT_PAY, duty: s.age, bigbi: s.age + 5 };
  log(`你拜入${SECTS[id].name}，成了外門弟子。`);
}
function leaveSect() {
  const s = L(); if (!s.sect) return;
  if (armed !== 'leaveSect') { armed = 'leaveSect'; render(); return; }
  armed = ''; log(`你離開了${SECTS[s.sect.id].name}，又成了散修。`); s.sect = null; s.flags['rc_' + stg().major] = 2; save(); render();
}
// 宗門任務：做完要等 5 年才能再接
const SECT_TASKS = [
  { id: 'hunt', name: '討伐妖獸', desc: '宗門附近有妖獸作亂。', run(s, g) { if (battle('作亂的妖獸', placeLv() + 1, 1.1)) return g * 1.5; return 0; } },
  { id: 'herb', name: '採集靈藥', desc: '替丹房採一批靈藥，有機會失手受傷。', run(s, g) { if (Math.random() < .8) return g; injure(120); return 0; } },
  { id: 'guard', name: '護送弟子', desc: '護送一批新弟子回山，路上可能遇襲。', run(s, g) { if (Math.random() < .5 || battle('劫道的散修', placeLv(), 1)) { addStone(stoneUnit() * 2); return g * 1.2; } return 0; } },
];
const sectTaskGain = (s = L()) => Math.round(10 * (1 + stg(s).major) * (1 + .25 * s.sect.rank));
function doSectTask(tid) {
  const s = L(); if (!s.sect || s.injury > 0 || (s.sect.task || 0) > s.age) return;
  const k = SECT_TASKS.find(x => x.id === tid), g = Math.round(k.run(s, sectTaskGain(s)));
  s.sect.task = s.age + 5; s.sect.duty = s.age;
  if (g) { s.sect.contrib += g; s.sect.total += g; log(`宗門任務「${k.name}」完成，得貢獻 ${g}。`); sectPromote(); } else log(`宗門任務「${k.name}」失敗了。`);
  save(); render();
}
function sectPromote() {
  const s = L(), r = s.sect.rank + 1;
  if (r < 4 && s.sect.total >= RANK_NEED[r] && s.stage >= RANK_STAGE[r]) { s.sect.rank = r; log(`你晉升為${SECTS[s.sect.id].name}${SECT_RANK[r]}。`); }
}
// 藏經閣：宗門專長類型的功法（身分夠的品階）、專屬功法（真傳起）、丹宗的突破丹
function sectShop(s = L()) {
  const x = SECTS[s.sect.id], maxG = s.sect.rank + 1, list = [];
  Object.keys(TECHS).filter(id => x.types.includes(TECHS[id].type) && !TECHS[id].sect && !TECHS[id].custom && TECHS[id].grade <= maxG && !(id in s.techs))
    .sort((a, b) => TECHS[b].grade - TECHS[a].grade).slice(0, 6).forEach(id => list.push({ k: 'tech', id, cost: TECH_CONTRIB[TECHS[id].grade] }));
  if (!(x.excl in s.techs)) list.unshift({ k: 'tech', id: x.excl, cost: 800, need: 2 });
  if (x.pills && BRK_PILLS[stg(s).major]) list.push({ k: 'item', id: BRK_PILLS[stg(s).major], cost: 60 * (1 + stg(s).major) });
  return list;
}
function sectBuy(i) {
  const s = L(), o = sectShop(s)[i]; if (!o || s.sect.contrib < o.cost || (o.need && s.sect.rank < o.need)) return;
  s.sect.contrib -= o.cost; if (o.k === 'tech') learnTech(o.id); else addItem(o.id);
  log(`用貢獻 ${o.cost} 換得${o.k === 'tech' ? '《' + TECHS[o.id].name + '》' : ITEMS[o.id].name}。`); save(); render();
}
// 宗門大比：三場連戰，依贏幾場給貢獻和靈石
function sectBigbi() {
  const s = L(); if (!s.sect || s.injury > 0 || s.sect.bigbi > s.age) return;
  s.sect.bigbi = s.age + SECT_BIGBI; s.hpNow = s.mpNow = s.snNow = 1;
  let w = 0;
  for (let i = 0; i < 3; i++) { const r = fight({ ...secretFoe({ elem: '無', mj: Math.max(1, stg().major) }, i), hp: 115 * (1 + .5 * (s.stage + i)) * (1 + .1 * i) }); s.hpNow = r.hp; s.mpNow = r.mp; if (!r.win) break; w++; }
  const g = Math.round(sectTaskGain(s) * [1, 3, 6, 12][w]);
  s.sect.contrib += g; s.sect.total += g; addStone(stoneUnit() * 3 * (w + 1));
  log(`宗門大比，你${w === 3 ? '奪得魁首' : `贏了 ${w} 場`}，得貢獻 ${g}${w === 3 ? `，宗主親賜${giftArt([Math.min(4, 2 + s.sect.rank)])}` : ''}。`);
  sectPromote(); save(); render();
}
// 每一跳：發俸祿、檢查有沒有偷懶
function sectTick(s = L()) {
  if (!s.sect) return;
  if (s.age >= s.sect.pay) { s.sect.pay += SECT_PAY; const n = addStone(stoneUnit() * [2, 4, 8, 15][s.sect.rank]); s.sect.contrib += 5 * (s.sect.rank + 1); log(`${SECTS[s.sect.id].name}發下俸祿：靈石 ${n}。`); }
  if (s.age - s.sect.duty > SECT_DUTY) {
    s.sect.duty = s.age;
    if (s.sect.rank > 0) { s.sect.rank--; log(`你太久沒做宗門任務，被降為${SECT_RANK[s.sect.rank]}。`); }
    else { log(`你太久沒做宗門任務，被${SECTS[s.sect.id].name}除名了。`); s.sect = null; s.flags['rc_' + stg().major] = 2; }
  }
}
let showSect = false;
function toggleSect() { showSect = !showSect; render(); }
function renderSect() {
  const s = L(), x = sectOf(s);
  if (!x) return `<section class="panel card"><div class="row"><b>宗門</b><button class="mini" onclick="toggleSect()">收起</button></div><p class="small">你是散修。${s.stage >= 9 ? '散修自由自在：遊歷靈石、奇遇 +20%。' : ''}每個大境界最多會有兩次宗門來招收，遇到了再決定要不要加入。</p></section>`;
  const sh = sectShop(s), r = s.sect.rank, nx = r < 3 ? `下一階「${SECT_RANK[r + 1]}」：累積貢獻 ${s.sect.total}/${RANK_NEED[r + 1]}、需${MAJORS[STAGES[RANK_STAGE[r + 1]].major].name}` : '已是長老';
  const tw = Math.max(0, Math.ceil((s.sect.task || 0) - s.age)), bw = Math.max(0, Math.ceil(s.sect.bigbi - s.age));
  return `<section class="panel card"><div class="row"><b>${x.name}・${SECT_RANK[r]}</b><span><button class="mini ${armed === 'leaveSect' ? 'danger' : ''}" onclick="leaveSect()">${armed === 'leaveSect' ? '確定退出？貢獻會清空' : '退出宗門'}</button><button class="mini" onclick="toggleSect()">收起</button></span></div>
    <p class="small muted">${x.desc} 身分加成：${effText(Object.fromEntries(Object.entries(x.eff).map(([k, v]) => [k, v * (r + 1)])))}。每 ${SECT_PAY} 年發俸祿；${SECT_DUTY} 年沒做任務會被降級。</p>
    <div class="row small"><span>貢獻 <b class="same">${s.sect.contrib}</b></span><span class="muted">${nx}</span></div>
    <h3>宗門任務</h3>${s.injury > 0 ? '<p class="small hurt">傷勢未癒，先養傷。</p>' : tw ? `<p class="small muted">剛做完任務，${tw} 年後可以再接。</p>` : SECT_TASKS.map(k => `<div class="item row small"><span><b>${k.name}</b>　<span class="muted">${k.desc}</span></span><button class="mini" onclick="doSectTask('${k.id}')">接下（貢獻約 ${sectTaskGain(s)}）</button></div>`).join('')}
    <h3>宗門大比</h3><div class="item row small"><span class="muted">三場連戰，贏越多場貢獻越多，奪魁還有宗主賞賜。</span>${bw || s.injury > 0 ? `<span class="muted">${s.injury > 0 ? '傷勢未癒' : `${bw} 年後舉辦`}</span>` : '<button class="mini" onclick="sectBigbi()">參加</button>'}</div>
    <h3>藏經閣</h3>${sh.map((o, i) => { const nm = o.k === 'tech' ? `《${TECHS[o.id].name}》` : ITEMS[o.id].name, sub = o.k === 'tech' ? gradeTag(TECHS[o.id].grade, TECHS[o.id].type + (TECHS[o.id].sect ? ' · 宗門專屬' : '')) : '';
      return `<div class="item row small"><span><b>${nm}</b> ${sub}${o.k === 'tech' ? `<br><span class="muted">${effText(TECHS[o.id])}</span>` : ''}</span>${o.need && r < o.need ? `<span class="muted">需${SECT_RANK[o.need]}</span>` : `<button class="mini" ${s.sect.contrib >= o.cost ? '' : 'disabled'} onclick="sectBuy(${i})">${o.cost} 貢獻</button>`}</div>`; }).join('') || '<p class="muted small">能換的都換過了。</p>'}</section>`;
}
// lv：敵人相當於第幾個小境界（1 起算），mult：強度倍率，elem：敵人屬性
function battle(name, lv, mult = 1, loot = false, elem = '無') {
  const s = L(), i = lv - 1, k = 1 + .5 * i, rr = (.85 + Math.random() * .3) * mult;
  const res = fight({ hp: 115 * k * rr, atk: 11.5 * k * rr, def: 4.5 * k * mult, spd: 10 + 2 * i, elem });
  s.hpNow = res.hp; s.mpNow = res.mp;
  const how = `${res.rounds} 回合${res.shen ? '，神通' + res.shen : ''}${res.used ? '，施展' + res.used : ''}${res.pill ? '，服了一顆回氣丹' : ''}`;
  if (res.fled) { log(`不敵${name}，一念千里遁走了（${how}）。`); return false; }
  if (res.win) {
    s.wins++; S.meta.wins++;
    let msg = `擊敗${name}（${how}）`;
    const kx = eff('killXiu') + shenSum('winXiu');
    if (kx) { const g = Math.min(stg().need - s.xiu, Math.round(stg().need * kx)); s.xiu += Math.max(0, g); }
    if (loot) {
      msg += `，得靈石 ${addStone(stoneUnit(lv) * (.8 + Math.random() * .4) * (1 + eff('stone')) * (1 + shenSum('loot')))}${tryDrop(.04 * (1 + shenSum('dropUp')))}`;
      if (s.place !== 'bamboo' && pct(.01 * (1 + eff('drop')))) msg += `，還撿到一顆${addPill(1)}`;
      if (tcNext() && pct(.004 * (1 + eff('drop')))) msg += `，竟然還有一份${addTc()}`;   // 天材地寶：極少掉落
      if (essenceNext() && pct(.002 * (1 + eff('drop')))) msg += `，還凝出一團${addEssence()}`;   // 五行之精：更少
    }
    log(msg + '。');
  } else { injure(90 * (1 + pathEff('injury', s))); log(`不敵${name}，負傷退走（${how}）。`); }
  return res.win;
}

// ---------- 每秒推進 ----------
function growTechs(sec) {
  const s = L(), mul = 1 + eff('techXp');
  equipped().forEach((id, i) => {
    const before = techLayer(id);
    s.techs[id] += sec * mul * (i === 0 ? 1 : .5);
    const l = techLayer(id);
    if (l > before) log(`《${TECHS[id].name}》修至第 ${l} 層${l >= 9 ? '，功法圓滿' : ''}。`);
    techShenCheck(id, l);
  });
  // 副主修精進速度跟輔修一樣是一半
  const t2 = dualOn(s);
  if (t2) { const before = techLayer(t2); s.techs[t2] += sec * mul * .5; const l = techLayer(t2); if (l > before) log(`副主修《${TECHS[t2].name}》修至第 ${l} 層${l >= 9 ? '，功法圓滿' : ''}。`); techShenCheck(t2, l); }
}
// 功法專屬神通：天階功法圓滿時覺醒它自己的那門（已經有了就不重複給）
function techShenCheck(id, l) {
  const s = L(), sid = TECH_SHEN[id];
  if (l < 9 || !sid || hasShen(sid, s)) return;
  gainShen(sid, `《${TECHS[id].name}》功法圓滿`);
}
function tick(dt) {
  const s = L(); if (s.dead || s.draw) return;   // 還在抽根骨時不算時間
  if (s.mortal) { mortalTick(dt); return; }      // 還是凡人
  s.age += dt / YEAR_SEC;
  const heal = s.mode === 'closed' ? 2 : 1;   // 閉關時養傷、排毒加倍
  if (s.injury > 0) s.injury = Math.max(0, s.injury - dt * heal);
  sectTick(s);
  tickBuffs(dt, s);
  if (s.tox > 0) s.tox = Math.max(0, s.tox - dt / 6 * (1 + .5 * tl('jiedu')) * heal);
  // 目前氣血、法力（比例），下一場戰鬥從這裡開始；戰鬥外約 40 秒回滿，閉關快一倍
  s.hpNow = Math.min(1, (s.hpNow ?? 1) + dt / 40 * heal); s.mpNow = Math.min(1, (s.mpNow ?? 1) + dt / 40 * heal); s.snNow = Math.min(1, (s.snNow ?? 1) + dt / 60 * heal);   // 神識回得慢
  if (s.xiu < stg().need) s.xiu = Math.min(stg().need, s.xiu + rate() * dt);
  else if (s.mode === 'closed') addFound(rate() * dt);
  growTechs(dt * (s.mode === 'travel' ? .5 : 1));
  const evGap = () => (90 + Math.random() * 90) / (1 + eff('evRate'));
  if (s.mode === 'travel') {
    s.encT -= dt;
    if (s.encT <= 0) { s.encT = 12 + Math.random() * 8; encounter(); }
    if (!s.ev) { s.evT -= dt; if (s.evT <= 0) { s.evT = evGap(); popEvent(false); } }
  } else {
    if (!s.ev) { s.evT -= dt * .5; if (s.evT <= 0) { s.evT = evGap(); popEvent(true); } }
    if (pct(dt / 300 * (1 + tl('dunwu')))) {
      const g = addXiu(.3);   // 約當前境界一成的修為；修為已滿就化為根基
      if (g) log(`閉關中豁然開朗，頓悟了，修為 +${fmt(g)}。`); else { addFound(stg().need * .1); log('閉關中頓悟，修為已滿，化為根基。'); }
    }
  }
  autoActs();
  if (s.age >= lifespan()) {
    if (tl('jiuzhuan') && !s.revived) {   // 九轉還魂：每一世一次
      s.revived = 1; s.lifeBonus += lifespan() * .2 / (1 + eff('lifePct'));
      log(`壽元將盡之際，一縷藥力護住心脈。你還魂了，壽元延長到 ${Math.floor(lifespan())} 年。`);
    } else die();
  }
}
// 隨緣應變的選法：看選項內容判斷。會打架、受傷、看機率、扣靈石修為的算有風險；拿到東西的算收益
const EV_RISK = /battle\(|injure\(|pct\(|stone -=|xiu \*|brkBonus -=|tox/;
const EV_GAIN = /addStone|addXiu|addPill|addHeal|addTc|addEssence|addLife|addTechXp|tryDrop|learnTech|learnSkill|gainArt|giftTech|giftArt|brkBonus \+=|techs\[|skills\[|lifeBonus/g;
const EV_MODES = { gain: '收益最多', safe: '無風險', rand: '隨機' };
function autoChoose() {
  const ch = visible(curEvent()), src = c => c.run.toString(), mode = S.meta.evMode || 'safe';
  let i;
  if (mode === 'rand') i = Math.floor(Math.random() * ch.length);
  else if (mode === 'safe') { i = ch.findIndex(c => !EV_RISK.test(src(c))); if (i < 0) i = ch.length - 1; }
  else { const sc = ch.map(c => (src(c).match(EV_GAIN) || []).length); i = sc.indexOf(Math.max(...sc)); }
  choose(i);
}
function setEvMode(v) { S.meta.evMode = v; save(); }
// 化身天賦：開著網頁時每秒檢查一次
function autoActs() {
  const s = L(), need = stg().need;
  if (autoOn('a_heal') && s.injury > 0 && count('heal')) usePill('heal');
  const xp = XIU_PILLS[stg().major];
  if (autoOn('a_xiu') && s.tox < 30 && s.xiu < need && count(xp)) usePill(xp);
  if (autoOn('a_main')) {
    const best = Object.keys(s.techs).filter(id => canMain(id)).sort((a, b) => (TECHS[b].rate || 0) - (TECHS[a].rate || 0))[0];
    if (best && (TECHS[best].rate || 0) > (TECHS[s.tech].rate || 0)) switchTech(best, true);
  }
  // 隨緣應變：普通事件 30 秒沒選就自動選（人物劇情、前世羈絆不算）
  if (autoOn('a_event') && s.ev && s.ev.ev && (s.ev.w = (s.ev.w || 0) + 1) >= 30) autoChoose();
  if (autoOn('a_refine')) for (const id of gearIds()) { if (s.arts[id] < ART_MAX_REFINE && s.stone > refinePrice(id) * 3) refineArt(id); }
  if (s.xiu >= need && s.stage < STAGES.length - 1) {
    if (isMajorNext() ? autoOn('a_major') && brkChance() >= S.meta.autoMajor : autoOn('a_minor')) breakthrough();
  }
}
// 自動轉世：坐化後自動轉世，測根骨時挑修煉倍率最高的靈根、最稀有的體質
function autoLife() {
  if (!autoOn('a_rebirth')) return;
  const s = L();
  if (s.dead) { rebirth(); return; }
  const m = s.mortal;   // 凡人篇：挑最稀有的出身、第一個仙緣
  if (m && m.phase === 'birth') chooseOrigin([...m.origins].sort((a, b) => ORIGINS[b].r - ORIGINS[a].r)[0]);
  if (m && m.phase === 'fate') chooseFate(m.fates[0]);
  if (m && m.phase === 'path') { m.pick = (S.meta.lastPaths || ['fa']).filter(id => PATHS[id]).slice(0, pathMax()); if (!m.pick.length) m.pick = ['fa']; confirmPath(); }
  if (s.draw) {
    const d = s.draw, rt = r => ROOT_TYPES.find(x => x.id === r.type).rate;
    d.r = d.roots.indexOf([...d.roots].sort((a, b) => rt(b) - rt(a))[0]);
    d.p = d.phys.indexOf([...d.phys].sort((a, b) => PHYSIQUES[b].r - PHYSIQUES[a].r)[0]);
    confirmDraw();
  }
}
function encounter() {
  const s = L(), pl = place(), r = Math.random();
  if (r < .6) {
    const [name, elem] = pick(pl.foes);
    if (s.injury > 0) log(`傷勢未癒，你避開了${name}。`);
    else battle(name, pl.lv, pl.mult, true, elem);
  } else if (r < .85) log(`在${pl.name}拾得靈石 ${addStone(stoneUnit() * .5 * (1 + eff('stone')))}。`);
}

// ---------- 事件 ----------
function arc(id) { const s = L(); return s.arcs[id] || (s.arcs[id] = { step: 0, aff: 0 }); }
function arcEnd(id, end) { arc(id).ended = 1; S.meta.arcDone[id] = end; S.meta.arcLife[id] = S.meta.lives; if (id === 'bei') storyMark('n4'); codexPay(); }
function popEvent(storyOnly) {
  const s = L(), m = S.meta, c = [];
  for (const id in ARCS) {
    const a = arc(id), step = ARCS[id].steps[a.step];
    if (!m.arcDone[id] && !a.ended && step && s.stage >= step.min) c.push({ ref: { arc: id }, w: 4 });
  }
  for (const e of MEMORIES) if (!m.memSeen[e.id] && m.arcDone[e.bond] === e.end && m.arcLife[e.bond] < m.lives && s.stage >= e.min) c.push({ ref: { mem: e.id }, w: 6 });
  // 一般事件一世只發生一次；標了 repeat 的可以重複，但一世最多 4 次，而且要隔 40 年
  if (!storyOnly) for (const e of EVENTS) {
    const seen = s.flags['ev_' + e.id], times = s.flags['evn_' + e.id] || 0;
    if (s.stage < (e.min || 0) || (e.cond && !e.cond(s)) || (seen !== undefined && !e.free && (!e.repeat || times >= 4 || s.age - seen < 40))) continue;
    c.push({ ref: { ev: e.id }, w: 1 });
  }
  for (const e of STORY) if (e.cond(s)) c.push({ ref: { story: e.id }, w: 8 });
  if (!storyOnly && recruitCands(s).length) c.push({ ref: { recruit: pick(recruitCands(s)) }, w: 2 });   // 宗門招收   // 主線，閉關時也會夢到
  if (!c.length) return;
  s.ev = pickW(c, o => o.w).ref;
  dirty = true;
}
function curEvent() {
  const r = L().ev; if (!r) return null;
  if (r.arc) return { ...ARCS[r.arc].steps[arc(r.arc).step], who: ARCS[r.arc].name };
  if (r.mem) { const e = MEMORIES.find(x => x.id === r.mem); return { ...e, who: ARCS[e.bond].name }; }
  if (r.story) return { ...STORY.find(x => x.id === r.story), who: '主線' };
  if (r.recruit) { const x = SECTS[r.recruit]; return { title: `${x.name}招收`, who: '宗門', text: `${x.name}的長老找上你：「${x.desc}你的資質不錯，願不願意入我門下？」入了宗門有俸祿、能換功法，但要定期做宗門任務；散修則自由自在。`,
    choices: [{ t: '拜入宗門', run() { joinSect(r.recruit); return '你成了外門弟子，領了一塊身分玉牌。'; } }, { t: '婉拒，繼續當散修', run() { return '長老點點頭：「仙路漫長，若改了主意再說。」'; } }] }; }
  const e = EVENTS.find(x => x.id === r.ev);
  // 前世遇過、這一世還沒遇過：換成第二個版本
  const seen = (S.meta.evSeen || {})[r.ev];
  return EVENT_ALTS[r.ev] && seen && seen < S.meta.lives ? { ...e, ...EVENT_ALTS[r.ev] } : e;
}
const val = (v, s) => typeof v === 'function' ? v(s) : v;
const visible = e => e.choices.filter(c => !c.cond || c.cond(L()));
function choose(i) {
  const s = L(), e = curEvent(); if (!e) return;
  const ch = visible(e)[i]; if (!ch) return;
  const ref = s.ev; s.ev = null;
  if (ref.ev) { codexAdd('v', ref.ev); const sn = S.meta.evSeen = S.meta.evSeen || {}; if (!sn[ref.ev]) sn[ref.ev] = S.meta.lives; }
  if (ref.ev === 'tiancai') s.flags['tc_' + stg().major] = 1;   // 天材地寶現世：這個大境界的機會用掉了
  if (ref.ev) { s.flags['ev_' + ref.ev] = s.age; s.flags['evn_' + ref.ev] = (s.flags['evn_' + ref.ev] || 0) + 1; }   // 年齡和次數，給重複冷卻用
  if (ref.mem) S.meta.memSeen[ref.mem] = 1;
  if (ref.recruit) s.flags['rc_' + stg().major] = (s.flags['rc_' + stg().major] || 0) + 1;
  if (ref.story) { storyMark(ref.story); if (ref.story === 'n1') s.flags.n1 = 1; }
  const res = ch.run(s);
  if (ref.arc && !arc(ref.arc).ended) arc(ref.arc).step++;
  log(`【${e.title}】${res}`);
  save(); render();
}

// ---------- 玩家操作 ----------
function setMode(m) { L().mode = m; L().encT = 8; dirty = true; render(); }
function setPlace(id) { L().place = id; dirty = true; render(); }
function breakthrough() {
  const s = L(); if (s.stage >= STAGES.length - 1) { tribulation(); return; } if (s.xiu < stg().need || s.stage >= STAGES.length - 1) return;
  log(tryBreak().msg); save(); render();
}
// 衝擊下一個境界（手動和離線共用同一套規則），回傳結果文字
// ---------- 神通的取得 ----------
// 本命（化神，依靈根）、極品突破、天賦（稀有體質）、功法圓滿、法寶器靈、宿世（前世帶來）
const hasShen = (id, s = L()) => (s.shen || []).includes(id);
const randShen = (s = L()) => { const ids = Object.keys(SHENS).filter(id => !SHENS[id].tech && !hasShen(id, s)); return ids.length ? pick(ids) : null; };
// 身上神通某個欄位的總和（機緣類：loot、dropUp、winXiu）
const shenSum = (key, s = L()) => (s.shen || []).reduce((a, id) => a + (SHENS[id][key] || 0), 0);
const benmingShen = (s = L()) => s.root.type === 'void' ? 'guixu' : Object.keys(SHENS).find(id => SHENS[id].elem === s.root.elems[0]);
// 指定的那門已經有了，就改給一門隨機的
function gainShen(id, why, s = L()) {
  if (id && hasShen(id, s)) id = randShen(s);
  if (!id) return;
  (s.shen = s.shen || []).push(id); codexAdd('s', id);
  log(`${why}，覺醒神通「${SHENS[id].name}」：${SHENS[id].desc}。`);
}
function setBrkMode(v) { L().brkMode = v; save(); updateDyn(); }
// offline：離線自動突破一律穩紮穩打
function tryBreak(offline = false) {
  const s = L(), major = isMajorNext(), mode = major && !offline ? s.brkMode : 'safe';
  // 體修淬體：大境界突破要額外花靈石（突破丹價的一半），不夠就成功率打八折
  const tiW = major ? pathList(s).filter(([id]) => id === 'ti').reduce((a, [, w]) => a + w, 0) : 0, tiCost = Math.round(BRK_PILL_PRICE[Math.min(7, stg().major)] * .5 * tiW);
  const tiShort = tiW && s.stone < tiCost; if (tiW && !tiShort) s.stone -= tiCost;
  const pz = !major && s.flags.pozhang;   // 破障丹
  if (pz) s.flags.pozhang = 0;
  const p = pz ? 1 : brkChance(s, mode) * (tiShort ? .8 : 1), used = brkPillsUsed(), pill = major ? ITEMS[BRK_PILLS[stg().major]].name : '', found = s.found || 0;
  const hard = mode === 'all' ? 1.5 : 1;   // 全力一搏失敗更慘
  if (used) s.items[BRK_PILLS[stg().major]] -= used;
  // 天材地寶：衝大境界時自動用掉（成敗都會消耗）
  const tcId = major && TC_ITEMS[stg().major], tc = tcId && count(tcId) > 0;
  if (tc) s.items[tcId]--;
  s.brkBonus = 0; s.found = 0;
  if (pct(p)) {
    s.stage++; s.xiu = 0; s.peak = Math.max(s.peak, s.stage); S.meta.best = Math.max(S.meta.best, s.stage);
    let ql = '';
    if (major) {
      const q = rollQual(s, found, used, mode, tc), mj = stg().major;
      if (tc) ql = `煉化${ITEMS[tcId].name}，`; s.qual = s.qual || {}; s.qual[mj] = q;
      ql += mj === 3 ? `元嬰出世，${qualName(mj, q)}。` : `成就${qualName(mj, q)}。`;
      if (q === 3) gainShen(randShen(s), `${qualName(mj, q)}，天地共鳴`);
      const pm = s.paths && s.paths[0]; if (PATH_FLAVOR[pm] && mj <= 8) ql += `你突破到${PATH_REALM[pm][mj]}境，${PATH_FLAVOR[pm][mj]}。`;
      if (mj === 4 && !s.flags.benming) { s.flags.benming = 1; gainShen(benmingShen(s), '踏入化神，元神與天地相合'); }
      pathSkillCheck(s);
    }
    return { ok: true, major, msg: `突破成功${used ? `（服下${pill} ${used} 顆）` : ''}，晉入${stg().name}！` + (major ? `${ql}壽元增至 ${Math.floor(lifespan())} 年。` : '') };
  } else {
    const loss = Math.min(.9, (major ? .5 : .3) * hard * (eff('risk') ? 2 : 1) * (tl('wenxin') ? .5 : 1));
    s.xiu = Math.floor(s.xiu * (1 - loss));
    let extra = '';
    if (major) {
      // 大境界失敗：經脈受創、折損壽元，還可能跌落一個小境界。境界越高越兇險；道心穩固全部減半
      const half = tl('wenxin') ? .5 : 1, mj = stg().major;
      injure(120);
      const hm = s.flags.humai; s.flags.humai = 0;   // 護脈丹
      const yrs = hm ? 0 : Math.round(MAJORS[mj].life * .03 * half * hard); s.age += yrs;
      extra = hm ? '，幸好護脈丹護住了經脈與壽元' : `，經脈受創，折壽 ${yrs} 年`;
      if (!hm && pct(Math.min(.6, (.1 + .05 * mj) * half * hard))) {
        s.stage--; s.xiu = Math.floor(stg().need * .5);
        if (place().min > s.stage) s.place = PLACES.filter(p => s.stage >= p.min).pop().id;
        extra += `，境界跌回${stg().name}`;
      }
    }
    return { ok: false, major, msg: `突破失敗${used ? `（${pill} ${used} 顆也沒能撐住）` : ''}${tc ? `，${ITEMS[tcId].name}白白耗去` : ''}，修為散去 ${Math.round(loss * 100)}%${extra}。` };
  }
}
// 換主修要散功：目前修為折半（各功法自己的層數保留）。手動換要按兩次確認
function switchTech(id, force) {
  const s = L(); if (!canMain(id) || id === s.tech) return;
  if (!force && armed !== 'tech:' + id) { armed = 'tech:' + id; render(); return; }
  armed = ''; s.xiu /= 2; s.tech = id; s.subs = s.subs.filter(x => x !== id);
  log(`散功重修，改以《${TECHS[id].name}》為主修，修為折半。`);
  // 副主修變成主修，或跟新主修相剋，就只能放下
  if (s.tech2 && (s.tech2 === id || !dualFactor(s.tech2))) { if (s.tech2 !== id) log(`《${TECHS[s.tech2].name}》與新主修相剋，只能放下。`); s.tech2 = null; }
  save(); render();
}
function toggleSub(id) {
  const s = L(), i = s.subs.indexOf(id);
  if (i >= 0) s.subs.splice(i, 1); else if (s.subs.length < maxSubs() && subOk(TECHS[id]) && id !== s.tech && id !== s.tech2) s.subs.push(id);
  save(); render();
}
function toggleEquip(id) {
  const s = L(), i = s.equip.indexOf(id);
  if (i >= 0) s.equip.splice(i, 1); else if (s.equip.length < maxEquip()) s.equip.push(id);
  save(); render();
}
function moveEquip(id, d) { const e = L().equip, i = e.indexOf(id), j = i + d; if (j < 0 || j >= e.length) return; [e[i], e[j]] = [e[j], e[i]]; save(); render(); }
function buy(kind, id) {
  const s = L();
  const price = kind === 'heal' ? healPrice() : kind === 'mp' ? mpPillPrice() : kind === 'xiu' ? xiuPillPrice() : cavePrice();
  if (s.stone < price || (kind === 'cave' && s.cave >= 8)) return;
  s.stone -= price;
  if (kind === 'heal') addItem('heal');
  else if (kind === 'mp') addItem('huiqi');
  else if (kind === 'xiu') addItem(XIU_PILLS[stg().major]);
  else s.cave++;
  save(); render();
}
function usePill(id) {
  const s = L(), it = ITEMS[id], need = stg().need;
  if (!count(id)) return;
  const pe = 1 + eff('pillEff'), tf = toxFactor(), addTox = n => { s.tox = Math.min(100, s.tox + n * (1 - toxRes())); };
  let msg;
  if (it.kind === 'heal') { if (!s.injury && (s.hpNow ?? 1) >= 1) return; s.injury = 0; s.hpNow = 1; msg = '服下療傷丹，傷勢痊癒，氣血回滿。'; }
  else if (it.kind === 'xiu') {
    if (s.xiu >= need) return;
    const diff = stg().major - it.major;
    const low = diff === 1 && tl('danxin') ? .5 : Math.pow(.25, diff);   // 丹心通明：低一階也有一半效果
    let amt = .25 * pe * tf * (diff > 0 ? low : 1);
    if (diff < 0) { amt = .5 * tf; injure(150); }
    const g = Math.min(need - s.xiu, Math.round(need * amt)); s.xiu += g; addTox(20);
    msg = `服下${it.name}，修為 +${fmt(g)}${diff > 0 ? '（丹藥品級太低，效果甚微）' : diff < 0 ? '。藥力太猛，經脈受損' : ''}${tf < .9 ? '，丹毒積累，藥效打了折扣' : ''}。`;
  } else if (it.kind === 'life') { const n = Math.round(15 * pe * tf); s.lifeBonus += n; addTox(30); msg = `服下延壽丹，壽元 +${n}。`; }
  else if (it.kind === 'body') { s.body += .03 * tf; if (!tl('xisuiwudu')) addTox(30); msg = '服下洗髓丹，筋骨一陣劇痛，氣血、攻擊、防禦永久提升。'; }
  else if (it.kind === 'dan') { msg = useDan(id, it, addTox); if (!msg) return; }
  else if (it.kind === 'tech') { s.techs[s.tech] += 600 * pe; msg = `服下悟道丹，對《${TECHS[s.tech].name}》的領悟更深一層。`; }
  else return;
  s.items[id]--; S.meta.pills++; log(msg); save(); render();
}
// 雜丹的效果；不能用時回空字串（不會吃掉）
function useDan(id, it, addTox) {
  const s = L();
  switch (it.fx) {
    case 'buff': (s.buffs = s.buffs || {})[id] = it.dur; addTox(it.tox); return `服下${it.name}，${it.desc.replace('接下來', '接下來的')}`;
    case 'guben': if ((s.found || 0) >= .3) return ''; s.found = Math.min(.3, (s.found || 0) + .1); addTox(it.tox); return `服下固本丹，根基更加穩固（根基 +${Math.round(s.found * 100)}%）。`;
    case 'huichun': if ((s.hpNow ?? 1) >= 1 && (s.mpNow ?? 1) >= 1) return ''; s.hpNow = s.mpNow = s.snNow = 1; return '服下回春丹，氣血、法力都回滿了。';
    case 'qingxin': if (s.tox < 1) return ''; s.tox = Math.max(0, s.tox - 30); return '服下清心丹，體內的丹毒散去不少。';
    case 'pozhang': if (s.flags.pozhang) return ''; s.flags.pozhang = 1; return '服下破障丹，下一次小境界突破必定成功。';
    case 'humai': if (s.flags.humai) return ''; s.flags.humai = 1; return '服下護脈丹，經脈被一層藥力護住。';
    case 'zhuyan': if (s.age < 26) return ''; s.age -= 10; addTox(it.tox); return '服下駐顏丹，鬢角的白髮轉黑，年齡 -10 歲。';
    case 'xingshen': if (s.flags.xingshen) return ''; s.flags.xingshen = 1; return '服下醒神丹，神魂清明，下一場戰鬥神通可以再發動一次。';
    case 'tianji': if (s.flags.tianji) return ''; s.flags.tianji = 1; return '服下天機丹，隱約算到坊市下一批貨裡有好東西。';
  }
  return '';
}
function useHeal() { usePill('heal'); }
function setTab(t) { tab = t; armed = ''; render(); }

// ---------- 坊市貨架 ----------
// 坊市品階權重：「奇珍滿架」讓地階、天階更常出現
const shopWeight = g => GRADE_WEIGHT[g] * (g === 3 ? 1 + .5 * tl('qizhen') : g === 4 ? 1 + tl('qizhen') : 1);
function restock() {
  const s = L(), slots = [], per = SHOP_PER + tl('huojia'), tj = !!s.flags.tianji;
  s.flags.tianji = 0;
  const grades = [1, 2, 3, 4].filter(g => s.stage >= GRADE_MIN_STAGE[g]);
  // 功法、術法、法寶各擺 per 格，各有自己的圖鑑和價格表；抽到的品階沒貨就從其他品階補
  const kinds = { tech: [TECHS, s.techs, TECH_PRICE], skill: [SKILLS, s.skills, SKILL_PRICE], art: [ARTS, s.arts, ART_PRICE] };
  for (const k in kinds) {
    const [pool, owned, prices] = kinds[k];
    const unowned = gs => Object.keys(pool).filter(id => gs.includes(pool[id].grade) && !(id in owned) && id !== 'hunyuan' && id !== 'xueying' && !pool[id].boss && !pool[id].sect && !pool[id].only && !slots.some(x => x.id === id));
    for (let i = 0; i < per; i++) {
      // 第一格保證玄階以上（玄階還沒解鎖就照常抽）
      const low = tj && grades.some(g => g >= 3) ? 3 : 2;   // 天機丹：保證地階以上
      const gs = i === 0 && grades.some(g => g >= low) ? grades.filter(g => g >= low) : grades;
      let ids = unowned([pickW(gs, shopWeight)]);
      if (!ids.length) ids = unowned(grades);
      if (!ids.length) break;   // 這一類都學完了，就少擺幾格
      const id = k === 'tech' ? pickTech(ids, s) : pick(ids);
      slots.push({ k, id, price: Math.round(prices[pool[id].grade] * (.8 + Math.random() * .4)) });
    }
  }
  // 丹藥：延壽、洗髓、悟道固定有，另有一格珍品（突破丹、天材地寶，沒抽到就不擺）；櫃台有賣的不上貨架
  const m = stg().major;
  // 珍品格：突破丹、天材地寶、五行之精，都沒抽到就擺一顆珍品雜丹；其他格從常見丹藥裡輪替
  const rare = BRK_PILLS[m] && pct(.3) ? BRK_PILLS[m] : tcNext() && pct(.12) ? tcNext() : essenceNext() && pct(.1) ? essenceNext() : pick(DAN_RARE);
  const common = [...DAN_COMMON].sort(() => Math.random() - .5);
  for (const id of [rare, ...common].slice(0, per)) slots.push({ k: 'item', id, price: itemPrice(id) });
  for (const slot of slots) if (pct(.12 * (1 + tl('qihuo')))) { slot.deal = 1; slot.price = Math.round(slot.price * .6); }
  s.shop = { next: Date.now() + shopRefresh() * 1000, slots };
}
const shopRefresh = () => SHOP_REFRESH - 120 * tl('jinhuo');
function ensureShop() { const s = L(); if (!s.shop || Date.now() >= s.shop.next) { restock(); return true; } return false; }
function manualRefresh() { const s = L(), p = refreshPrice(); if (s.stone < p) return; s.stone -= p; restock(); save(); render(); }
// 貨架分四類：功法、術法、法寶、丹藥，同類裡高品階在前，賣掉的放最後（buySlot 仍用原本的格子編號）
const SHELF_GROUPS = [['tech', '功法'], ['skill', '術法'], ['art', '法寶'], ['item', '丹藥']];
function shelfRank(o) {
  if (o.k === 'item') { const k = ITEMS[o.id].kind; return k === 'tc' ? 3 : k === 'brk' ? 2 : 1; }
  return ({ tech: TECHS, skill: SKILLS, art: ARTS })[o.k][o.id].grade;
}
// 貨架分頁，跟悟道樹一樣切換
let shopTab = 'tech';
function setShopTab(k) { shopTab = k; render(); }
function shelf(slots, render1) {
  const list = slots.map((o, i) => [o, i]).filter(([o]) => o.k === shopTab).sort(([a], [b]) => (a.sold ? 1 : 0) - (b.sold ? 1 : 0) || shelfRank(b) - shelfRank(a));
  return `<nav>${SHELF_GROUPS.map(([k, name]) => `<button class="${shopTab === k ? 'on' : ''}" onclick="setShopTab('${k}')">${name}</button>`).join('')}</nav>`
    + (list.map(([o, i]) => render1(o, i)).join('') || '<p class="muted small">這一類已經沒有你還沒有的貨了。</p>');
}
function buySlot(i) {
  const s = L(), slot = s.shop.slots[i];
  if (!slot || slot.sold || s.stone < slot.price) return;
  s.stone -= slot.price; slot.sold = 1;
  if (slot.k === 'tech') learnTech(slot.id);
  else if (slot.k === 'skill') learnSkill(slot.id);
  else if (slot.k === 'art') gainArt(slot.id);
  else addItem(slot.id);
  save(); render();
}

// ---------- 死亡與轉世 ----------
function daoGain(s = L()) { return Math.max(1, Math.round((s.peak + 1) * (s.peak + 1) / 20)); }
// ---------- 主線（碑與名）：節點記在 meta.story，也收進輪迴錄「主線」 ----------
const STORY_NODES = [['n1', '殘夢'], ['n2', '似曾相識'], ['n3', '碑的傳說'], ['n4', '守碑人'], ['n4a', '被劃掉的名字'], ['n5', '第九道天雷'], ['n6', '刻名']];
function storyMark(id) { const m = S.meta; m.story = m.story || {}; if (!m.story[id]) { m.story[id] = 1; codexAdd('m', id); } }
// 主線事件：n1 每一世一次（夢會越來越清楚），n2、n3 整個遊戲一次；閉關時也會出現
const STORY = [
  { id: 'n1', title: '殘夢', life: 1, cond: s => s.stage <= 11 && !s.flags.n1,
    text: () => S.meta.lives === 1 ? '閉關到深夜，你做了一個夢：一塊比山還高的石碑立在虛無裡，碑上刻滿了名字。你想看清其中一個，它卻像被水洇開一樣模糊。醒來時，指尖還留著石頭的涼意。'
      : S.meta.lives < 4 ? '又是那個夢。石碑、名字、看不清的那一個。這一次你注意到，那個名字上有一道很深的劃痕。'
      : '夢裡的石碑近得伸手就能碰到。那個被劃掉的名字，你幾乎要念出來了，卻在開口的那一刻醒來。',
    choices: [
      { t: '把夢記下來', run() { return `你把夢裡的每個細節都寫了下來。說也奇怪，寫完之後，對《${addTechXp(300)}》的體悟反而清楚了一些。`; } },
      { t: '當作心魔，壓下去', run(s) { s.brkBonus += .03; return '你靜坐片刻，把雜念壓了下去。心境更穩了，下次突破成功率 +3%。'; } }] },
  { id: 'n2', title: '似曾相識', cond: s => S.meta.lives >= 2 && !(S.meta.story || {}).n2,
    text: '路過一座從沒去過的小鎮，你卻知道下一個轉角有一口井，井邊有棵歪脖子樹。走過去一看，分毫不差。這段記憶不屬於這一世，也不屬於你記得的任何一世。',
    choices: [
      { t: '在井邊坐一會兒', run() { return `井水映出你的臉，看久了竟有點陌生。你坐到天黑才走，修為 +${fmt(addXiu(.2))}。`; } },
      { t: '快步離開', run() { return '你沒有回頭。可那棵歪脖子樹，後來常常出現在你的夢裡。'; } }] },
  { id: 'n3', title: '碑的傳說', cond: s => s.stage >= 12 && s.stage <= 17 && !(S.meta.story || {}).n3,
    text: '茶館裡，一個醉醺醺的老散修拍著桌子說：「你們知道嗎？每個飛升的人，名字都會刻在虛空裡的一塊碑上。可那碑上，有些名字是被劃掉的……」說到這裡，他忽然停住，盯著你看了很久。',
    choices: [
      { t: '請他喝酒，聽他說完', run(s) { s.stone = Math.max(0, s.stone - stoneUnit() * 2); return '老散修喝乾了酒，只說了一句：「被劃掉的，就回來了。」然後醉倒在桌上，再也叫不醒。'; } },
      { t: '一笑置之', run() { return '你付了茶錢離開。身後傳來他含糊的聲音：「你身上……有碑的味道。」'; } }] },
];
// 守碑人「碑上的名字」那段：第 3 世起多一句（節點 4a）
function beiNameExtra() { if (S.meta.lives < 3) return ''; storyMark('n4a'); return '其中一個被劃掉的名字，筆跡跟你自己寫字一模一樣。'; }

// ---------- 飛升：渡劫後期修為滿、道心夠、走完守碑人的劇情 → 九道天雷 ----------
const ASCEND_DAO = 80;
const TRIB_ELEMS = ['金', '木', '水', '火', '土', '雷', '冰', '風', '無'];
const NUM9 = '一二三四五六七八九';
function ascendWhy(s = L()) {
  const why = [];
  if (s.stage < STAGES.length - 1 || s.xiu < stg(s).need) why.push('渡劫後期修為圓滿');
  if (S.meta.dao < ASCEND_DAO) why.push(`道心 ${S.meta.dao}/${ASCEND_DAO}`);
  if (!S.meta.arcDone.bei) why.push('走完守碑人的故事');
  return why;
}
// 第 i 道天雷的強度（i = 0～8，一道比一道強）
function tribFoe(s, i) {
  const lv = s.stage + 1 + Math.floor(i / 2), mult = 1 + TRIB_STEP * i, k = 1 + .5 * (lv - 1);
  return { hp: 150 * k * mult, atk: 11.5 * k * mult, def: 4.5 * k * mult, spd: 10 + 2 * (lv - 1), elem: TRIB_ELEMS[i] };
}
const TRIB_STEP = .08;
function tribulation() {
  const s = L(); if (ascendWhy(s).length) return;
  if (armed !== 'trib') { armed = 'trib'; render(); return; }
  armed = ''; s.hpNow = s.mpNow = s.snNow = 1;
  log('你引動了九天雷劫。雷雲壓城，方圓千里一片死寂。');
  for (let i = 0; i < 9; i++) {
    if (i === 8 && !(S.meta.story || {}).n5) { storyMark('n5'); log('第九道天雷落下的那一瞬，雷光裡閃過一幕：你站在雲端的仙宮前，身上穿著仙袍——然後腳下一空，墜了下去。'); }
    // 一道比一道強；中間氣血、法力不回滿
    const res = fight(tribFoe(s, i));
    s.hpNow = res.hp; s.mpNow = res.mp;
    if (!res.win || res.fled) { log(`第${NUM9[i]}道天雷落下，你沒能撐住${res.fled ? '——天劫之下，無處可逃' : ''}，在雷光中化為飛灰。`); s.tribFail = 1; die(); save(); render(); return; }
    log(`第${NUM9[i]}道天雷，你撐過去了（${res.rounds} 回合，剩氣血 ${Math.round(res.hp * 100)}%）。`);
  }
  // 飛升成功：刻名（節點 6），額外再給一份道心道果，這一世結束
  s.ascended = 1; S.meta.ascends = (S.meta.ascends || 0) + 1; storyMark('n6');
  const bonus = daoGain(s); S.meta.dao += bonus; S.meta.guo += bonus; s.ascendBonus = bonus;
  log('九道天雷散去，天門洞開。你飛升了。');
  die(); save(); render();
}
function die() {
  const s = L(); s.dead = true;
  S.meta.history.push({ life: S.meta.lives, stageName: STAGES[s.peak].name + (s.ascended ? '・飛升' : s.tribFail ? '・渡劫失敗' : ''), age: Math.floor(s.age), root: s.root ? rootName(s) + (s.phys ? '、' + PHYSIQUES[s.phys].name : '') : '' });
  S.meta.keepTech = { id: s.tech, xp: s.techs[s.tech], def: TECHS[s.tech].custom ? TECHS[s.tech] : null };   // 給「前世功法」天賦用（自創的連定義一起帶）
  S.meta.lastShen = (s.shen || []).slice();                // 給「宿世神通」天賦用
  // 坐化當下就拿到道心和道果，轉世前可以先在悟道樹上花掉
  s.daoGot = daoGain(); S.meta.dao += s.daoGot; S.meta.guo += s.daoGot;
  save(); dirty = true;
}
function rebirth() {
  const g = L().daoGot || 0; S.life = newLife(S.meta);
  log(`上一世的感悟化為道心 +${g}、道果 +${g}。`);
  armed = ''; deathView = 'sum'; save(); render();
}
function setDeathView(v) { deathView = v; render(); scrollTo(0, 0); }
function arm(what) {
  if (armed !== what) { armed = what; render(); return; }
  armed = '';
  if (what === 'rebirth') { log('你散去一身修為，兵解轉世。'); die(); render(); }
  if (what === 'reset') { localStorage.removeItem(SAVE_KEY); S = null; load(); title = true; render(); }
}

// ---------- 離線收益 ----------
const offlineCap = () => tl('yinian') ? Infinity : (2 + L().cave + eff('offline') + 2 * tl('lixian')) * 3600;
const offRate = () => OFFLINE_RATE + .1 * tl('lixianxiao');   // 神遊太虛：滿級 100%
function applyOffline(sec) {
  const s = L(); if (s.dead || s.draw || s.mortal || sec < 30) return;
  s.hpNow = s.mpNow = s.snNow = 1;   // 離線回來一律回滿
  const off = Math.min(sec, offlineCap());
  // 離線突破：小境界要有「水到渠成」，大境界要有「順勢破境」且成功率夠；規則和手動突破一樣
  const stage0 = s.stage;
  let left = off * offRate(), gained = 0;
  while (left > 0) {
    const r = rate(s, 'closed'), t = (stg().need - s.xiu) / r;
    if (t > left) { s.xiu += r * left; gained += r * left; break; }
    left -= t; gained += stg().need - s.xiu; s.xiu = stg().need;
    if (s.stage >= STAGES.length - 1) break;
    // 不能自動突破就停在這裡，剩下的時間化為根基
    if (isMajorNext() ? !(autoOn('a_major') && brkChance(s, 'safe') >= S.meta.autoMajor) : !autoOn('a_minor')) { addFound(left * r); break; }
    const res = tryBreak(true);
    if (!res.ok && res.major) { log('閉關時衝擊大境界，' + res.msg); break; }   // 大境界失敗就停下等你回來
  }
  if (s.stage > stage0) log(`閉關期間突破到了${stg().name}。`);
  growTechs(off * offRate());
  s.injury = Math.max(0, s.injury - off);
  tickBuffs(off, s);   // 離線期間藥效照樣過
  s.age += off * OFFLINE_AGE / YEAR_SEC;   // 離線也會變老，但比較慢
  s.tox = Math.max(0, s.tox - off / 6 * (1 + .5 * tl('jiedu')));
  const stones = s.mode === 'travel' ? addStone(off / 16 * .6 * stoneUnit() * .5 * (1 + eff('stone'))) : 0;
  s.offline = { sec: Math.round(sec), off: Math.round(off), xiu: Math.round(gained), stones, up: s.stage > stage0 ? stg().name : '' };
  dirty = true;
}
function closeOffline() { L().offline = null; render(); }
function dur(sec) { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h} 小時 ${m} 分` : `${m} 分`; }

// ---------- 畫面 ----------
const $ = id => document.getElementById(id);
function bar(cls, ratio, id = '') { return `<div class="bar ${cls}"${id ? ` id="${id}"` : ''}><div style="width:${Math.min(100, Math.max(0, ratio) * 100).toFixed(1)}%"></div></div>`; }
// id 有給就用功法的層數放大；mul 給法寶的祭煉倍率
function effText(t, id, mul = 1) {
  return Object.keys(EFF_LABEL).filter(k => t[k]).map(k => {
    if (k === 'risk') return `<span class="hurt">${EFF_LABEL[k]}</span>`;
    const v = id ? effOf(id, k) : NO_SCALE.includes(k) ? t[k] : t[k] * mul;
    const n = k === 'life' ? `${Math.round(v)} 年` : k === 'offline' ? `${v} 小時` : FLAT_EFF.includes(k) ? Math.round(v) : k === 'killXiu' ? (v * 100).toFixed(1) + '%' : Math.round(v * 100) + '%';
    return `${EFF_LABEL[k]}${v < 0 ? '' : '+'}${n}`;
  }).join(' · ');
}
const gradeTag = (g, extra) => `<span class="g${g} small">${GRADES[g]}${extra ? ' · ' + extra : ''}</span>`;
const TABS = [['cult', '修行'], ['skill', '術法'], ['art', '法寶'], ['bag', '行囊'], ['shop', '坊市'], ['log', '紀事'], ['dao', '道途']];
const physDesc = id => { const x = PHYSIQUES[id]; return (x.desc || [x.boost ? `${x.boost}屬性術法 +30%` : '', effText(x)].filter(Boolean).join(' · ')) + (x.path ? ` · 適合${PATHS[x.path].name}（對上效果 ×1.3）` : '') + (PHYS_SHEN[id] ? ` · 天賦神通「${SHENS[PHYS_SHEN[id]].name}」` : ''); };
function rootDesc(root) {
  const t = ROOT_TYPES.find(r => r.id === root.type);
  return `修煉 ×${t.rate}（體修只算三成、魂修一半）${t.aff ? ` · 親和術法 +${Math.round(t.aff * 100)}%` : ''}${t.desc ? ' · ' + t.desc : ''}`;
}
function renderDraw() {
  const s = L(), d = s.draw, fake = r => rootName({ root: r });
  const intro = s.mortal ? FATES[s.mortal.fate].test : S.meta.lives === 1 ? '踏上仙途之前，先看看自己生來帶著什麼。' : '新的一世，根骨也重新來過。';
  const opt = (kind, i, on, title, cls, desc) => `<button class="opt ${on ? 'on' : ''}" onclick="pickDraw('${kind}',${i})"><b class="${cls}">${title}</b><span class="small">${desc}</span></button>`;
  const rootCls = r => ({ heaven: 'g4', mutant: 'g4', void: 'g4', dual: 'g3', triple: 'g2', quad: 'g1', five: 'g1' })[r.type];
  return `<header><h1>長生閒記</h1><span class="muted">第 ${S.meta.lives} 世 · 道心 ${S.meta.dao}<button class="mini" onclick="goTitle()">首頁</button></span></header>
    <section class="panel card"><b>${s.mortal ? '測靈根' : '測根骨'}</b>
      <p>${intro}</p>
      <p class="small">靈根、體質各選一個。靈根、體質各能重抽 ${d.rr.r}／${d.rr.p} 次（道心越高次數越多，好根骨也越常出現）。</p>
      <div class="row"><h3>靈根</h3><button class="mini" ${d.rr.r ? '' : 'disabled'} onclick="rerollDraw('r')">重抽靈根</button></div>
      <div class="opts">${d.roots.map((r, i) => opt('r', i, d.r === i, fake(r), rootCls(r), rootDesc(r))).join('')}</div>
      <div class="row"><h3>體質</h3><button class="mini" ${d.rr.p ? '' : 'disabled'} onclick="rerollDraw('p')">重抽體質</button></div>
      <div class="opts">${d.phys.map((id, i) => opt('p', i, d.p === i, `${PHYSIQUES[id].name} <span class="small">${PHYS_RANK[PHYSIQUES[id].r]}</span>`, 'g' + PHYSIQUES[id].r, physDesc(id))).join('')}</div>
      <div class="choices"><button class="primary" ${d.r >= 0 && d.p >= 0 ? '' : 'disabled'} onclick="confirmDraw()">就是這副根骨</button></div>
    </section>`;
}

function render() {
  dirty = false;
  const s = L(), app = $('app');
  if (title) { app.innerHTML = renderTitle(); return; }
  if (s.dead) { app.innerHTML = renderDeath(); return; }
  if (s.draw) { app.innerHTML = renderDraw(); return; }
  if (s.mortal) { app.innerHTML = renderMortal(); updateMortal(); return; }
  if (tab === 'shop') ensureShop();
  app.innerHTML = `
    <header><h1>長生閒記</h1><span class="muted">第 ${S.meta.lives} 世 · 道心 ${S.meta.dao}${speedCtl()}<button class="mini" onclick="goTitle()">首頁</button></span></header>
    <section class="panel">
      <div class="row"><span><b class="realm" id="realm">${realmName()}</b> <span class="root">${rootName()}</span></span><span class="muted" id="age"></span></div>
      ${bar('life', 0, 'lifebar')}
      <div class="row"><span>修為</span><span id="xtxt"></span></div>
      ${bar('xiu', 0, 'xbar')}
      <div class="vit small"><div><div class="row"><span>氣血</span><span id="hptxt"></span></div>${bar('hp thin', 1, 'hpbar')}</div>
        <div><div class="row"><span id="mplbl">法力</span><span id="mptxt"></span></div>${bar('mp thin', 1, 'mpbar')}</div></div>
      <div class="row small"><span id="res"></span><span id="inj"></span></div>
      <div class="small same" id="buffs"></div>
      <div class="btns">
        <button class="${s.mode === 'closed' ? 'on' : ''}" onclick="setMode('closed')">閉關</button>
        <button class="${s.mode === 'travel' ? 'on' : ''}" onclick="setMode('travel')">遊歷</button>
        <button class="${showSecret ? 'on' : ''}" onclick="toggleSecret()" ${stg().major >= 1 ? '' : 'disabled'}>秘境</button>
        <select onchange="setPlace(this.value)" ${s.mode === 'travel' ? '' : 'disabled'}>
          ${PLACES.filter(p => s.stage >= p.min).map(p => `<option value="${p.id}" ${p.id === s.place ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
        <span style="margin-left:auto;display:flex;gap:8px;align-items:center">${isMajorNext() ? `<select class="mini" onchange="setBrkMode(this.value)" title="大境界突破方式">${[['safe', '穩紮穩打'], ['all', '全力一搏']].map(([k, n]) => `<option value="${k}" ${(s.brkMode || 'safe') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}
        <button id="brk" class="primary" onclick="breakthrough()"></button></span>
      </div>
      <ul class="recent" id="recent"></ul>
    </section>
    ${s.offline ? renderOffline() : ''}
    ${showSect ? renderSect() : ''}
    ${showSecret ? renderSecret() : ''}
    ${s.ev ? renderEvent() : ''}
    <nav>${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="setTab('${k}')">${n}</button>`).join('')}</nav>
    <section class="panel">${({ cult: renderCult, skill: renderSkill, art: renderArt, bag: renderBag, shop: renderShop, log: renderLog, dao: renderDao })[tab]()}</section>`;
  updateDyn();
}

// 主畫面的藥效列：限時藥效顯示剩餘時間，一次性的顯示「待發動」
function buffText(s = L()) {
  const a = Object.entries(s.buffs || {}).map(([id, t]) => `${ITEMS[id].name} ${dur2(t)}`);
  for (const [f, id] of [['pozhang', 'pozhang'], ['humai', 'humai'], ['xingshen', 'xingshen'], ['tianji', 'tianjidan']]) if (s.flags[f]) a.push(`${ITEMS[id].name}（待發動）`);
  return a.length ? '藥效：' + a.join(' · ') : '';
}
function updateDyn() {
  const s = L(); if (s.mortal && !s.draw) { updateMortal(); return; }
  if (s.dead || !$('xtxt')) return;
  const need = stg().need, life = lifespan();
  $('age').textContent = `${Math.floor(s.age)} 歲 / 壽元 ${Math.floor(life)}`;
  $('lifebar').firstChild.style.width = Math.min(100, s.age / life * 100) + '%';
  $('lifebar').classList.toggle('warn', life - s.age < 10);
  $('xtxt').textContent = `${fmt(s.xiu)} / ${fmt(need)}（+${rate().toFixed(1)}/秒）`;
  $('xbar').firstChild.style.width = Math.min(100, s.xiu / need * 100) + '%';
  const st = stats(), hp = s.hpNow ?? 1, mp = s.mpNow ?? 1;
  $('hptxt').textContent = `${fmt(Math.round(st.hp * hp))} / ${fmt(st.hp)}`; $('hpbar').firstChild.style.width = hp * 100 + '%';
  { const ps = myPaths(s), fr = k => k === 'fa' ? mp : k === 'hun' ? s.snNow ?? 1 : .2, m0 = ps[0];
    $('mplbl').textContent = RES_NAME[m0] + (m0 === 'ti' ? '（開戰兩成）' : '');
    $('mptxt').textContent = ps.map((k, i) => `${i ? RES_NAME[k] + ' ' : ''}${fmt(Math.round(resMax(k, s, st) * fr(k)))} / ${fmt(resMax(k, s, st))}`).join(' · ');
    $('mpbar').firstChild.style.width = fr(m0) * 100 + '%'; }
  { const atTop = s.stage >= STAGES.length - 1, w = atTop ? ascendWhy(s) : [], bt = buffText(s);
    $('buffs').textContent = bt + (atTop ? (bt ? '　' : '') + (w.length ? '飛升還差：' + w.join('、') : '九道天雷之後就能飛升，但失敗就會身死。') : ''); } $('realm').textContent = realmName(s);
  $('res').innerHTML = `靈石 ${fmt(s.stone)}${s.found >= .01 ? ` · <span class="same">根基 +${Math.round(s.found * 100)}%</span>` : ''}${s.tox >= 1 ? ` · <span class="${s.tox > 50 ? 'hurt' : ''}">丹毒 ${Math.ceil(s.tox)}%</span>` : ''}`;
  $('inj').innerHTML = s.injury > 0 ? `<span class="hurt">負傷 ${Math.ceil(s.injury)} 秒</span>${count('heal') ? ' <button class="mini" onclick="useHeal()">服療傷丹</button>' : ''}` : (s.mode === 'travel' ? `遊歷${place().name}` : '閉關中');
  const b = $('brk'), last = s.stage >= STAGES.length - 1, u = brkPillsUsed();
  const why = last ? ascendWhy(s) : [];
  b.disabled = last ? why.length > 0 : s.xiu < need;
  b.className = 'primary' + (armed === 'trib' ? ' danger' : '');
  b.textContent = last ? (why.length ? '飛升條件未滿' : armed === 'trib' ? '確定渡劫？失敗即身死' : '引動九天雷劫') : `突破 ${Math.round(brkChance() * 100)}%${u ? `（服${ITEMS[BRK_PILLS[stg().major]].name} ${u}）` : ''}`;
  $('recent').innerHTML = s.log.slice(0, 4).map(l => `<li>${l.text}</li>`).join('');
  if ($('shopT')) { if (ensureShop()) { render(); return; } $('shopT').textContent = dur2(Math.max(0, (s.shop.next - Date.now()) / 1000)); }
}
const dur2 = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

function renderEvent() {
  const e = curEvent(), s = L();
  return `<section class="panel card">
    <div class="row"><b>${e.title}</b>${e.who ? `<span class="who">${e.who}</span>` : ''}</div>
    <p>${val(e.text, s)}</p>
    <div class="choices">${visible(e).map((c, i) => `<button onclick="choose(${i})">${val(c.t, s)}</button>`).join('')}</div>
    ${autoOn('a_event') && s.ev.ev ? `<p class="muted small">隨緣應變：30 秒內沒選，會照「${EV_MODES[S.meta.evMode || 'safe']}」自動選。</p>` : ''}
  </section>`;
}
function renderOffline() {
  const o = L().offline;
  return `<section class="panel card"><b>閉關歸來</b>
    <p>你離開了 ${dur(o.sec)}${o.off < o.sec ? `（洞府只撐得住 ${dur(o.off)}）` : ''}。這段時間修為 +${fmt(o.xiu)}${o.up ? `，突破到了${o.up}` : ''}${o.stones ? `，遊歷所得靈石 ${fmt(o.stones)}` : ''}。</p>
    <div class="choices"><button onclick="closeOffline()">知道了</button></div></section>`;
}
// 功法屬性和靈根相符：標示「靈根親和」（主修吐納功法修煉再快 15%）
const techAff = t => t.elem !== '無' && rootFits(t.elem) ? ` · <span class="same">靈根親和${isMainType(t.type) ? '（主修時修煉 +15%）' : ''}</span>` : '';
function techCard(id, btns = '', hint = '') {
  const s = L(), t = TECHS[id], l = techLayer(id);
  return `<div class="item"><div class="row"><b>《${t.name}》</b>${gradeTag(t.grade, `${t.custom ? '自創 · ' : ''}${t.type} · ${t.elem} · 第 ${l} 層${l >= 9 ? '（圓滿）' : ''}`)}</div>
    <div class="row small"><span>${effText(t, id) || '<span class="muted">沒有特別加成</span>'}${techAff(t)}${hint ? ' · ' + hint : ''}</span><span>${btns}</span></div>
    ${l < 9 ? bar('xiu thin', ((s.techs[id] || 0) - techNeed(id, l)) / (techNeed(id, l + 1) - techNeed(id, l))) : ''}</div>`;
}
// ---------- 修行分頁：底下分「根骨」「功法」兩頁 ----------
let cultTab = 'gong';
function setCultTab(k) { cultTab = k; armed = ''; render(); }
function renderCult() {
  return `<nav>${[['gen', '根骨'], ['gong', '功法']].map(([k, n]) => `<button class="${cultTab === k ? 'on' : ''}" onclick="setCultTab('${k}')">${n}</button>`).join('')}</nav>`
    + (cultTab === 'gen' ? renderGen() : renderGong());
}
// 根骨：靈根、體質、境界品質、身體、神通（不太會變動的東西）
function renderGen() {
  const s = L(), st = stats(), rt = rootType(), shen = s.shen || [];
  return `<h3>靈根</h3>
    <div class="item"><div class="row"><b>${rootName()}</b><span class="small">修煉 ×${rootRate()}${rootRate() !== rt.rate ? `（${PATHS[myPaths()[0]].name}只算${ROOT_WEIGHT[myPaths()[0]] === .3 ? '三成' : '一半'}，原本 ×${rt.rate}）` : ''}${rt.aff ? ` · 親和屬性術法 +${Math.round(rt.aff * 100)}%` : ''}</span></div>
      <div class="muted small">${rt.desc || (s.root.elems.length ? `親和：${s.root.elems.join('、')}。主修同屬性功法再快 15%，地階以上只能修這些屬性（或無屬性）的功法${myPaths()[0] === 'ti' ? '；鍛體功法不挑靈根' : ''}。` : '')}</div>
      <div class="small">${pathLine(s)}</div></div>
    <h3>修行路線</h3>${pathSection(s)}
    <h3>體質</h3>
    <div class="item"><div class="row"><b class="g${PHYSIQUES[s.phys].r}">${PHYSIQUES[s.phys].name}</b><span class="small muted">${PHYS_RANK[PHYSIQUES[s.phys].r]}</span></div>
      <div class="small">${physDesc(s.phys)}</div></div>
    <h3>境界品質</h3>${Object.keys(s.qual || {}).length ? `<div class="item">${Object.entries(s.qual).map(([mj, q]) => `<div class="row small"><span>${MAJORS[mj].name}：<b class="g${q + 1}">${qualName(+mj, q)}</b></span><span class="muted">${QUAL_RANK[q]}${q ? ` · +${QUAL_BONUS[q] * 100}%` : ''}</span></div>`).join('')}
      <div class="small same">修煉、氣血、攻擊、防禦合計 +${Math.round(qualBonus() * 100)}%</div></div>` : '<p class="muted small">還沒突破過大境界。大境界突破成功時會決定品質：根基越厚、靈根越好、突破丹越多，品質越好；選「全力一搏」更容易出好品質，但成功率較低、失敗更慘。想要極品，還得有對應境界的天材地寶。</p>'}
    <h3>身體</h3>
    <div class="stats"><span>氣血 ${fmt(st.hp)}</span><span>法力 ${fmt(st.mp)}</span><span>攻擊 ${fmt(st.atk)}</span><span>防禦 ${fmt(st.def)}</span><span>身法 ${st.spd}</span>
      <span>暴擊 ${Math.round(st.crit * 100)}%</span><span>暴傷 ${Math.round(st.critDmg * 100)}%</span><span>閃避 ${Math.round(st.dodge * 100)}%</span><span>屬性 ${TECHS[s.tech].elem}</span></div>
    <h3>神通（${shen.length}）</h3>${shen.map(id => { const x = SHENS[id]; return `<div class="item"><div class="row"><b class="g4">${x.name}</b><span class="small muted">${x.type} · ${{ open: '開場發動', field: '整場生效', lethal: '危急時發動' }[x.trig]}</span></div><div class="small">${x.desc}</div></div>`; }).join('')
    || '<p class="muted small">還沒有神通。踏入化神時會依靈根覺醒本命神通；大境界突破出極品、稀有體質、天階功法圓滿（覺醒該功法專屬的神通）、天階法寶祭煉圓滿，也都會覺醒神通。每門神通一場戰鬥發動一次，不耗法力。</p>'}`;
}
// 已學功法的篩選：類型分頁、排序、只看修得了的
let techTab = '全部', techSort = 'grade', techUsable = false;
const TECH_TYPES = ['吐納', '鍛體', '觀想', '身法', '劍修', '長生', '丹道', '殺伐', '悟性', '尋寶'];
function setTechView(k, v) { if (k === 'tab') techTab = v; else if (k === 'sort') techSort = v; else techUsable = !techUsable; render(); }
// 好壞標示：吐納比主修快、輔修有空位、比同類輔修高階
function techHint(id) {
  const s = L(), t = TECHS[id];
  if (isMainType(t.type) && (t.type !== '鍛體' || canMain(id))) return canMain(id) && (t.rate || 0) > (TECHS[s.tech].rate || 0) ? '<span class="same">比主修快</span>' : '';
  if (s.subs.length < maxSubs()) return '<span class="same">輔修有空位</span>';
  const low = s.subs.filter(x => TECHS[x].type === t.type && TECHS[x].grade < t.grade)[0];
  return low ? `<span class="same">比輔修《${TECHS[low].name}》高階</span>` : '';
}
function pathSection(s = L()) {
  if (s.flags.pathFree) return `<p class="small">這一世還沒定下修行的路（目前照法修算），可以選一次，選了就不能改：</p><div class="btns">${Object.entries(PATHS).map(([id, x]) => `<button onclick="choosePathLate('${id}')">${x.name}</button>`).join('')}</div>`;
  return pathList(s).map(([id, w]) => `<div class="item"><div class="row"><b>${PATHS[id].name}</b><span class="small muted">${w < 1 ? '兼修（效果五折）' : '主修路線'} · 目前加成 ×${(pathGrow(s) * w).toFixed(2)}</span></div><div class="small">${PATHS[id].desc}</div></div>`).join('')
    + '<p class="muted small">路線的加成隨大境界成長（練氣 ×0.6，到渡劫 ×1.6）；代價不隨境界變。</p>';
}
function renderGong() {
  const s = L();
  const btnFor = id => {
    const t = TECHS[id];
    const sub = !subOk(t) ? '' : s.subs.length < maxSubs() ? `<button class="mini" onclick="toggleSub('${id}')">輔修</button>` : '<span class="muted">輔修已滿</span>';
    if (isMainType(t.type)) {
      if (!canMain(id)) return sub || `<span class="muted">${mainBlock(id)}</span>`;
      const main = `<button class="mini ${armed === 'tech:' + id ? 'danger' : ''}" onclick="switchTech('${id}')">${armed === 'tech:' + id ? '確定散功？修為減半' : '改為主修'}</button>`;
      if (!tl('liangyi')) return main + sub;
      const f = dualFactor(id);
      return main + sub + (!f ? '<span class="muted small">與主修相剋</span>' : `<button class="mini ${armed === 'dual:' + id ? 'danger' : ''}" onclick="setDual('${id}')">${armed === 'dual:' + id ? '確定散功？修為減半' : `副主修 ${f * 100}%`}</button>`);
    }
    return s.subs.length < maxSubs() ? `<button class="mini" onclick="toggleSub('${id}')">輔修</button>` : '<span class="muted">輔修已滿</span>';
  };
  const extra = id => `${btnFor(id)}${dropBtns('tech', id)}`;
  const all = Object.keys(s.techs).filter(id => !equipped().includes(id) && id !== s.tech2);
  const types = TECH_TYPES.filter(ty => all.some(id => TECHS[id].type === ty));
  if (techTab !== '全部' && !types.includes(techTab)) techTab = '全部';
  const list = all.filter(id => (techTab === '全部' || TECHS[id].type === techTab) && (!techUsable || subOk(TECHS[id]) || canMain(id)))
    .sort((a, b) => techSort === 'layer' ? techLayer(b) - techLayer(a) || TECHS[b].grade - TECHS[a].grade : TECHS[b].grade - TECHS[a].grade || techLayer(b) - techLayer(a));
  return `<h3>主修</h3>${techCard(s.tech)}
    ${tl('liangyi') ? `<h3>副主修</h3>${s.tech2 ? techCard(s.tech2, `<span class="small same">${dualFactor(s.tech2) === .5 ? '五行相生' : '同修'}，效果 ${dualFactor(s.tech2) * 100}%</span><button class="mini on" onclick="setDual('${s.tech2}')">卸下</button>`)
      : '<p class="muted small">空著。可以再修一部主修類功法：跟主修五行相生的效果五成，其他三成，相剋的不能同修。換副主修要散功。</p>'}
      ${s.tech2 ? (canFuse() ? `<div class="btns"><button class="mini ${armed === 'fuse' ? 'danger' : 'primary'}" onclick="fuseTech()">${armed === 'fuse' ? '確定融合？兩部功法會合為一部' : '融合自創功法'}</button></div>`
        : '<p class="muted small">踏入化神、主修和副主修都練到圓滿，就能把兩部融合成自創功法：效果兩部相加打八折，直接圓滿，副主修欄也會空出來。</p>') : ''}` : ''}
    <h3>輔修（${s.subs.length}/${maxSubs()}）</h3>${s.subs.map(id => techCard(id, `<button class="mini on" onclick="toggleSub('${id}')">卸下</button>`, TECHS[id].rate ? '<span class="muted">輔修時不算修煉速度</span>' : '')).join('') || '<p class="muted small">空著。鍛體、身法、劍修、長生、丹道、殺伐、悟性、尋寶類功法都能輔修，精進速度是主修的一半。</p>'}
    <div class="row"><h3>已學功法（${all.length}）</h3><span class="small">
      <select class="mini" onchange="setTechView('sort', this.value)">${[['grade', '品階高的在前'], ['layer', '層數高的在前']].map(([k, n]) => `<option value="${k}" ${techSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="mini ${techUsable ? 'on' : ''}" onclick="setTechView('usable')">只看修得了的</button></span></div>
    ${all.length ? `<nav class="wrap">${['全部', ...types].map(ty => `<button class="${techTab === ty ? 'on' : ''}" onclick="setTechView('tab', '${ty}')">${ty}</button>`).join('')}</nav>` : ''}
    ${list.map(id => techCard(id, extra(id), techHint(id))).join('') || '<p class="muted">沒有符合的功法。坊市、遊歷、奇遇都可能得到。</p>'}
    <p class="muted small">換功法不會損失層數。用不到的功法可以「參悟」化為主修的精進，或賣給坊市。戰鬥時普通攻擊帶主修功法的屬性；屬性相剋時傷害 ×1.3，被剋 ×0.75。</p>`;
}
// ---------- 術法分頁：屬性分頁、攻防輔篩選、排序 ----------
let skillTab = '全部', skillKind = '全部', skillSort = 'grade';
const SKILL_ELEMS = ['無', '金', '木', '水', '火', '土', '雷', '冰', '風'];
const KIND_GROUP = { dmg: '攻', multi: '攻', shield: '防', heal: '防', dodge: '防', buff: '輔', mana: '輔', charge: '輔' };
function setSkillView(k, v) { if (k === 'tab') skillTab = v; else if (k === 'kind') skillKind = v; else skillSort = v; render(); }
// 好壞標示：出招欄有空位，或比出招中同類（攻／防／輔）最弱的那個強
function skillHint(id) {
  const s = L(), g = KIND_GROUP[SKILLS[id].kind];
  if (s.equip.length < maxEquip()) return '<span class="same">出招欄有空位</span>';
  const same = s.equip.filter(x => KIND_GROUP[SKILLS[x].kind] === g).sort((a, b) => skillPow(a) - skillPow(b))[0];
  return same && SKILLS[id].kind !== 'charge' && skillPow(id) > skillPow(same) ? `<span class="same">比出招中的「${SKILLS[same].name}」強</span>` : '';
}
function renderSkill() {
  const s = L(), te = TECHS[s.tech].elem;
  const row = (id, hint = '') => { const k = SKILLS[id], on = s.equip.includes(id), lv = skillLv(id), nx = MASTERY_USES[lv + 1];
    return `<div class="item"><div class="row"><b>${k.name}</b>${gradeTag(k.grade, `${SCHOOL_NAME[skillSchool(k)]} · ${k.elem} · ${KIND_LABEL[k.kind]}`)}</div>
      <div class="small">${skillDesc(k)}${hint ? ' · ' + hint : ''}</div>
      <div class="row small"><span>${MASTERY[lv]}${nx ? `（${s.skills[id]}/${nx}）` : ''}${k.kind === 'charge' ? '' : ` · 威力 ${skillPow(id).toFixed(1)}`} · 冷卻 ${k.cd} · 耗${RES_NAME[skillRes(id)]} ${skillCost(id)}${ownSch(id) ? '' : ' · <span class="hurt">非本路：威力 -40%、耗費 ×1.5</span>'}${k.elem !== '無' && k.elem === te ? ' · <span class="same">與主修同屬性</span>' : ''}${skillFits(k.elem) ? ' · <span class="same">靈根親和</span>' : ''}</span>
      <span>${on ? `<button class="mini" onclick="moveEquip('${id}',-1)">↑</button><button class="mini" onclick="moveEquip('${id}',1)">↓</button>` : ''}<button class="mini ${on ? 'on' : ''}" onclick="toggleEquip('${id}')">${on ? '卸下' : '裝備'}</button>${on ? '' : dropBtns('skill', id)}</span></div></div>`; };
  const all = Object.keys(s.skills).filter(id => !s.equip.includes(id));
  const elems = SKILL_ELEMS.filter(e => all.some(id => SKILLS[id].elem === e));
  if (skillTab !== '全部' && !elems.includes(skillTab)) skillTab = '全部';
  const list = all.filter(id => (skillTab === '全部' || SKILLS[id].elem === skillTab) && (skillKind === '全部' || KIND_GROUP[SKILLS[id].kind] === skillKind))
    .sort((a, b) => skillSort === 'pow' ? skillPow(b) - skillPow(a) : skillSort === 'lv' ? s.skills[b] - s.skills[a] : SKILLS[b].grade - SKILLS[a].grade || skillPow(b) - skillPow(a));
  return `<p class="small">${myPaths().map(k => `${RES_NAME[k]} ${fmt(resMax(k))}（${{ fa: '每回合回 8%，帶到下一場', ti: '開戰只有兩成，出手 +10%、挨打 +8%', hun: '每回合只回 4%，帶到下一場，戰鬥外也回得慢' }[k]}）`).join('；')}。法術耗法力、體術耗血氣、神魂術耗神識；不是本路的術法從${RES_NAME[myPaths()[0]]}轉換，威力 -40%、耗費 ×1.5。兼修那條路就沒有懲罰。</p><h3>出招順序（最多 ${maxEquip()} 個）</h3>${s.equip.map(id => row(id)).join('') || '<p class="muted">沒有裝備術法，只會普通攻擊。</p>'}
    <div class="row"><h3>其他術法（${all.length}）</h3><span class="small">
      <select class="mini" onchange="setSkillView('kind', this.value)">${['全部', '攻', '防', '輔'].map(k => `<option value="${k}" ${skillKind === k ? 'selected' : ''}>${k === '全部' ? '攻防輔全部' : k === '攻' ? '只看攻擊' : k === '防' ? '只看防禦' : '只看輔助'}</option>`).join('')}</select>
      <select class="mini" onchange="setSkillView('sort', this.value)">${[['grade', '品階'], ['pow', '威力'], ['lv', '熟練度']].map(([k, n]) => `<option value="${k}" ${skillSort === k ? 'selected' : ''}>依${n}排序</option>`).join('')}</select></span></div>
    ${all.length ? `<nav class="wrap">${['全部', ...elems].map(e => `<button class="${skillTab === e ? 'on' : ''}" onclick="setSkillView('tab', '${e}')">${e}</button>`).join('')}</nav>` : ''}
    ${list.map(id => row(id, skillHint(id))).join('') || '<p class="muted">沒有符合的術法。</p>'}
    <p class="muted small">戰鬥時每回合由上往下找第一個冷卻好、法力也夠的術法施放；都放不了就普通攻擊。法力會延續到下一場，戰鬥外慢慢回滿；術法品階越高越耗法力，主修功法層數越高法力越多。用得越多越熟練，和主修同屬性威力 +20%。用不到的術法可以「參悟」化為出招中術法的熟練度，或賣給坊市。</p>`;
}
// ---------- 參悟、賣出用不到的功法和術法 ----------
const techSellPrice = id => Math.round(TECH_PRICE[TECHS[id].grade] * SELL_RATE);
const skillSellPrice = id => Math.round(SKILL_PRICE[SKILLS[id].grade] * SELL_RATE);
// 參悟功法：化為主修的精進（約 5 分鐘 × 品階平方，加上它原本一半的進度）
const techStudyGain = id => Math.round(300 * TECHS[id].grade ** 2 + (L().techs[id] || 0) * .5);
// 參悟術法：出招中的每個術法熟練度 +5 × 品階平方
const skillStudyGain = id => 5 * SKILLS[id].grade ** 2;
function dropBtns(kind, id) {
  const price = kind === 'tech' ? techSellPrice(id) : skillSellPrice(id);
  const a = armed === `study:${kind}:${id}`, b = armed === `sellx:${kind}:${id}`;
  return `<button class="mini ${a ? 'danger' : ''}" onclick="studyIt('${kind}','${id}')">${a ? '確定參悟？' : '參悟'}</button>`
    + `<button class="mini ${b ? 'danger' : ''}" onclick="sellIt('${kind}','${id}')">${b ? '確定賣出？' : `賣 ${fmt(price)}`}</button>`;
}
function canDrop(kind, id) {
  const s = L();
  return kind === 'tech' ? id in s.techs && !equipped().includes(id) && id !== s.tech2 : id in s.skills && !s.equip.includes(id);
}
function studyIt(kind, id) {
  const s = L(); if (!canDrop(kind, id)) return;
  if (armed !== `study:${kind}:${id}`) { armed = `study:${kind}:${id}`; render(); return; }
  armed = '';
  if (kind === 'tech') { const g = techStudyGain(id); s.techs[s.tech] += g; log(`參悟《${TECHS[id].name}》，心得化入《${TECHS[s.tech].name}》。`); delete s.techs[id]; }
  else { const g = skillStudyGain(id); for (const x of s.equip) s.skills[x] += g; log(`參悟《${SKILLS[id].name}》，出招中的術法熟練度各 +${g}。`); delete s.skills[id]; }
  save(); render();
}
function sellIt(kind, id) {
  const s = L(); if (!canDrop(kind, id)) return;
  if (armed !== `sellx:${kind}:${id}`) { armed = `sellx:${kind}:${id}`; render(); return; }
  armed = '';
  const p = kind === 'tech' ? techSellPrice(id) : skillSellPrice(id), name = kind === 'tech' ? TECHS[id].name : SKILLS[id].name;
  s.stone += p; if (kind === 'tech') delete s.techs[id]; else delete s.skills[id];
  log(`把《${name}》的抄本賣給坊市，得靈石 ${fmt(p)}。`); save(); render();
}
function renderArt() {
  const s = L();
  const card = id => {
    const a = ARTS[id], lv = s.arts[id], on = isOn(id), full = lv >= ART_MAX_REFINE, p = refinePrice(id);
    return `<div class="item"><div class="row"><b>${a.name}</b>${gradeTag(a.grade, `${a.slot} · 祭煉 ${lv} 重`)}</div>
      <div class="row small"><span>${effText(a, null, artMul(id))}</span><span>
        <button class="mini" ${full || s.stone < p ? 'disabled' : ''} onclick="refineArt('${id}')">${full ? '已祭煉圓滿' : `祭煉 ${fmt(p)} 靈石`}</button>
        ${on || (artOk(id) && freeKey(id)) ? `<button class="mini ${on ? 'on' : ''}" onclick="equipArt('${id}')">${on ? '卸下' : '裝備'}</button>` : !artOk(id) ? `<span class="muted">需${ART_REALM_NAME[a.grade]}</span>` : '<span class="muted">欄位已滿</span>'}
        ${on ? '' : `<button class="mini ${armed === 'sell:' + id ? 'danger' : ''}" onclick="sellArt('${id}')">${armed === 'sell:' + id ? '確定賣出？' : `賣 ${fmt(sellArtPrice(id))}`}</button>`}</span></div></div>`;
  };
  const owned = Object.keys(s.arts);
  return ART_SLOTS.map(slot => `<h3>${slot}${slot === '飾品' ? `（${accKeys().filter(k => s.gear[k]).length}/${accKeys().length}）` : ''}</h3>${owned.filter(id => ARTS[id].slot === slot).sort((a, b) => isOn(b) - isOn(a)).map(card).join('') || '<p class="muted small">還沒有。坊市、遊歷都可能得到。</p>'}`).join('')
    + '<p class="muted small">武器、護甲各一格，飾品一開始一格，悟道樹「萬寶隨身」最多加到三格。玄階法寶要築基、地階要金丹、天階要元嬰才驅使得動。祭煉每重讓效果 +15%，最多 9 重。</p>';
}
function renderBag() {
  const s = L(), ids = Object.keys(ITEMS).filter(id => count(id) > 0);
  const btn = id => {
    const k = ITEMS[id].kind;
    if (k === 'brk') return `<span class="muted small">${ITEMS[id].major === stg().major && isMajorNext() ? '突破時自動服用' : '突破對應大境界時自動服用'}</span>`;
    if (k === 'mp') return '<span class="muted small">戰鬥中自動服用</span>';
    if (k === 'root') {
      const why = essenceBlock(id);
      if (why) return `<span class="muted small">${why}</span>`;
      const warn = s.root.type === 'heaven' && armed === 'ess:' + id;
      return `<button class="mini ${warn ? 'danger' : ''}" onclick="useEssence('${id}')">${warn ? '確定？天靈根會失去純度' : '煉化'}</button>`;
    }
    if (k === 'tc') return `<span class="muted small">衝擊${MAJORS[ITEMS[id].major + 1].name}時自動使用</span>`;
    const ok = k === 'heal' ? s.injury > 0 || (s.hpNow ?? 1) < 1 : k === 'xiu' ? s.xiu < stg().need : true;
    return `<button class="mini" ${ok ? '' : 'disabled'} onclick="usePill('${id}')">服用</button>`;
  };
  const sell = id => `<button class="mini" onclick="sellItem('${id}')">賣 ${fmt(sellItemPrice(id))}</button>`;
  return `<h3>丹毒 ${Math.ceil(s.tox)}%</h3>${bar('tox', s.tox / 100)}
    <p class="muted small">修為丹、延壽丹、洗髓丹吃了會積累丹毒，丹毒越高藥效越差，每分鐘消退 10%。修為丹要配合境界：吃低階的效果甚微，吃高階的會經脈受損。用不到的丹藥可以按原價七成賣給坊市。</p>
    <h3>丹藥</h3>${ids.map(id => `<div class="item row"><span><b>${ITEMS[id].name}</b> ×${count(id)} <span class="muted small">${ITEMS[id].desc}</span></span><span>${btn(id)}${sell(id)}</span></div>`).join('') || '<p class="muted">行囊空空。</p>'}`;
}
function renderShop() {
  const s = L(), btn = (price, call, ok = true) => `<button class="mini" ${s.stone >= price && ok ? '' : 'disabled'} onclick="${call}">${fmt(price)} 靈石</button>`;
  const xp = ITEMS[XIU_PILLS[stg().major]];
  const slot = (o, i) => {
    if (o.sold) return `<div class="item row muted"><span>（已售出）</span></div>`;
    const deal = o.deal ? '<span class="deal">奇貨</span> ' : '';
    if (o.k === 'tech') { const t = TECHS[o.id]; return `<div class="item"><div class="row"><span>${deal}<b>《${t.name}》</b> ${gradeTag(t.grade, `${t.type} · ${t.elem}`)}</span>${btn(o.price, `buySlot(${i})`)}</div><div class="small">${effText(t) || '<span class="muted">沒有特別加成</span>'}${techAff(t)}${isMainType(t.type) && !canMain(o.id) ? (subOk(t) ? ' · <span class="muted">你只能輔修</span>' : ` · <span class="hurt">${mainBlock(o.id)}</span>`) : ''}</div></div>`; }
    if (o.k === 'skill') { const k = SKILLS[o.id]; return `<div class="item"><div class="row"><span>${deal}<b>${k.name}</b> ${gradeTag(k.grade, `${SCHOOL_NAME[skillSchool(k)]} · ${k.elem} · ${KIND_LABEL[k.kind]}`)}</span>${btn(o.price, `buySlot(${i})`)}</div><div class="small">${k.pow ? `威力 ${k.pow} · ` : ''}冷卻 ${k.cd}${skillDesc(k) ? ' · ' + skillDesc(k) : ''}</div></div>`; }
    if (o.k === 'art') { const a = ARTS[o.id]; return `<div class="item"><div class="row"><span>${deal}<b>${a.name}</b> ${gradeTag(a.grade, `法寶 · ${a.slot}`)}</span>${btn(o.price, `buySlot(${i})`)}</div><div class="small">${effText(a)}</div></div>`; }
    const it = ITEMS[o.id];
    return `<div class="item row"><span>${deal}<b>${it.name}</b> <span class="muted small">${it.desc}</span></span>${btn(o.price, `buySlot(${i})`)}</div>`;
  };
  return `<h3>櫃台</h3>
    <div class="item row"><span><b>療傷丹</b> <span class="muted small">立刻治好傷勢</span></span>${btn(healPrice(), "buy('heal')")}</div>
    <div class="item row"><span><b>回氣丹</b> <span class="muted small">戰鬥中法力不夠又受傷時自動服用</span></span>${btn(mpPillPrice(), "buy('mp')")}</div>
    <div class="item row"><span><b>${xp.name}</b> <span class="muted small">${xp.desc}服用後修為增加</span></span>${btn(xiuPillPrice(), "buy('xiu')")}</div>
    <div class="item row"><span><b>洞府 ${s.cave} 級</b> <span class="muted small">閉關修煉 +15%／級，離線可撐 ${Math.round(offlineCap() / 3600)} 小時</span></span>${btn(cavePrice(), "buy('cave')", s.cave < 8)}</div>
    <div class="row"><h3>貨架</h3><span class="small muted">下次進貨 <span id="shopT"></span> ${btn(refreshPrice(), 'manualRefresh()').replace('靈石</button>', '靈石 立刻換貨</button>')}</span></div>
    ${shelf(s.shop.slots, slot)}
    <p class="muted small">貨架每 ${shopRefresh() / 60} 分鐘換一批，關掉網頁也照算。功法、術法、法寶每類的第一格保證是玄階以上（練氣五層起），境界越高越容易出現高階貨。</p>`;
}
function renderLog() { return `<ul class="log">${L().log.map(l => `<li><span class="muted">${l.age} 歲</span> ${l.text}</li>`).join('')}</ul>`; }
// 道途分頁：道心與悟道樹／輪迴錄／羈絆、前世、其他
let daoTab = 'tree';
function setDaoTab(k) { daoTab = k; armed = ''; render(); }
function renderDao() {
  const m = S.meta;
  const nav = `<nav>${[['tree', '悟道'], ['lun', '輪迴錄'], ['misc', '羈絆前世']].map(([k, n]) => `<button class="${daoTab === k ? 'on' : ''}" onclick="setDaoTab('${k}')">${n}</button>`).join('')}</nav>`;
  if (daoTab === 'tree') return nav + `<h3>道心 ${m.dao}</h3><p class="small">每點道心讓修煉 +3%，也更容易抽到好根骨，每 15 點多一次重抽。</p>${renderTree()}`;
  if (daoTab === 'lun') return nav + '<h3>輪迴錄</h3>' + renderCodex();
  const bonds = Object.entries(m.arcDone).map(([id, end]) => `<li><b>${ARCS[id].name}</b>：${ARC_END_LABEL[end]}（第 ${m.arcLife[id]} 世）</li>`).join('');
  return nav + `<h3>羈絆</h3><ul class="log">${bonds || '<li class="muted">還沒有。</li>'}</ul>
    <h3>前世</h3><ul class="log">${m.history.map(h => `<li>第 ${h.life} 世：${h.root ? h.root + '，' : ''}${h.stageName}，${h.age} 歲坐化</li>`).join('') || '<li class="muted">這是你的第一世。</li>'}</ul>
    <h3>其他</h3><div class="btns">
      <button class="danger" onclick="arm('rebirth')">${armed === 'rebirth' ? `確定兵解？可得道心、道果各 ${daoGain()}` : '兵解轉世'}</button>
      <button class="danger" onclick="arm('reset')">${armed === 'reset' ? '再按一次：全部清除' : '清除存檔'}</button></div>`;
}
function renderDeath() {
  const s = L(), h = S.meta.history[S.meta.history.length - 1];
  const head = `<header><h1>長生閒記</h1><span class="muted">第 ${S.meta.lives} 世 · ${s.ascended ? '飛升' : '坐化'}<button class="mini" onclick="goTitle()">首頁</button></span></header>`;
  if (deathView === 'tree') return `${head}<section class="panel card">
    <div class="row"><b>悟道</b><span>可用道果 <b class="same">${S.meta.guo}</b></span></div>
    <p class="small muted">天賦永久保留，下一世開始就生效。點好了就轉世，重新抽根骨。</p>
    <div class="choices"><button onclick="setDeathView('sum')">回顧這一世</button><button class="primary" onclick="rebirth()">轉世</button></div></section>
    <section class="panel">${renderTree()}</section>`;
  return `${head}<section class="panel card">
    ${s.ascended ? `<b>第 ${S.meta.lives} 世 · 飛升</b>
    <p>你的名字刻上了無字碑。</p>
    <p>碑上的名字一路往前延伸，看不到盡頭。在很前面、很前面的位置，有一個被劃掉的名字。你認得那個筆跡——那是你自己寫的字。</p>
    <p>你飛升過，也隕落過。這一次，碑上的你，還會被劃掉嗎？</p>
    <p class="same">凡界篇・完　仙界篇製作中。飛升的獎勵：道心、道果各額外 +${s.ascendBonus}。你可以繼續輪迴，再走一次。</p>` : `<b>第 ${S.meta.lives} 世 · ${s.tribFail ? '渡劫失敗' : '坐化'}</b>`}
    <p>你在 ${h.age} 歲走到了盡頭。這一世身負${rootName()}，最高修到${h.stageName}，擊敗敵人 ${s.wins} 次。</p>
    <p>這一世的感悟化為道心 +${s.daoGot}、道果 +${s.daoGot}。現在共有道果 <b class="same">${S.meta.guo}</b>，可以到悟道樹點天賦。</p>
    <div class="choices"><button class="primary" onclick="setDeathView('tree')">入悟道</button></div></section>
    <section class="panel"><h3>這一世的紀事</h3>${renderLog()}</section>`;
}

// ---------- 開始介面 ----------
const HELP = [
  ['放置修煉', '開著網頁，修為就會自己增長。線上 60 秒是遊戲裡的 1 年。關掉網頁後修為照樣累積（效率較低），也會變老，但只有線上的三分之一。點了「水到渠成」，離線時也會自動突破小境界；沒點的話修為滿了就停下，多的化為根基。'],
  ['閉關與遊歷', '閉關修為較穩，多出來的修為會變成根基，提高突破成功率，偶爾還會頓悟。遊歷會遇到事件、戰鬥和寶物，但可能受傷。'],
  ['凡人篇', '每一世都從凡人開始：先抽出身，做些凡人的事累積底子，等仙緣上門後選一條路，測出靈根、感氣入體，才算踏入練氣。'],
  ['突破', '修為滿了就能突破。小境界容易，失敗只會散去一些修為。大境界有機率失敗，失敗會經脈受創、折損壽元，還可能跌回上一個小境界，境界越高越兇險。服用對應境界的突破丹可以提高成功率。大境界成功時會決定品質（下品到極品，例如無瑕道基、九竅金丹），這一世永久提升修煉和戰力；選「全力一搏」成功率較低，但更容易出好品質。想要極品，還得有對應境界的天材地寶（例如突破築基要玄黃地乳），可以從稀有事件、戰鬥掉落、坊市、拍賣得到。'],
  ['神通', '比術法強得多的本事，每門一場戰鬥發動一次。踏入化神會依靈根覺醒本命神通；突破出極品、稀有體質、天階功法圓滿（覺醒該功法專屬的神通）、天階法寶祭煉圓滿也會覺醒。神通跟著這一世，轉世後重來。'],
  ['功法、術法、法寶', '主修功法決定修煉速度，輔修功法提供各種加成。術法在戰鬥中自動施放，要耗法力，用得越多越熟練。法力不夠時會自動服回氣丹。法寶可以祭煉變強。這些都能在事件或坊市取得。'],
  ['雙主修', '悟道樹「兩儀同修」（曾經修到化神才能點）可以多修一部吐納功法當副主修。跟主修五行相生（金生水、水生木、木生火、火生土、土生金）的效果五成，相剋的不能同修，其他三成。'],
  ['自創功法', '踏入化神後，主修和副主修都練到第 9 層，可以把兩部融合成自創功法：效果兩部相加打八折、直接圓滿，副主修欄空出來可以再修別的。'],
  ['靈根後期路線', '踏入化神後，靈根會走上自己的路：五行齊全的是「五行圓滿」，修煉和突破大增；天靈根、變異靈根是「靈根化道」，專精自己的屬性；空靈根是「萬法歸空」，專精無屬性。雙、三、四靈根沒有路線，但可以煉化五行之精補齊五行。'],
  ['坐化與輪迴', '壽元用盡就會坐化。依這一世到過的最高境界，會得到道心和道果。道心讓之後每一世修煉更快、更容易抽到好根骨。'],
  ['悟道樹', '道果用來點悟道樹上的天賦，天賦永久保留，包括化身（自動處理雜事）、離線效率、開局資源等等。一世一世累積，就能走得更遠。'],
];
function renderTitle() {
  const s = L(), m = S.meta;
  const where = s.dead ? `第 ${m.lives} 世已坐化，等待轉世` : s.draw ? `第 ${m.lives} 世，正在測靈根` : s.mortal ? `第 ${m.lives} 世 · 凡人 · ${Math.floor(s.age)} 歲` : `第 ${m.lives} 世 · ${stg().name} · ${Math.floor(s.age)} 歲`;
  return `<section class="title">
    <h1>長生閒記</h1>
    <p class="lead">凡人百年，修士千載，仙人不記歲月。<br>你只是一縷不肯散去的念頭，一世又一世地回到人間。<br>這一世，能走多遠？</p>
    <button class="primary big" onclick="enterGame()">${fresh ? '踏入仙途' : '繼續修行'}</button>
    ${fresh ? '' : `<p class="small muted">${where} · 道心 ${m.dao}</p>`}
  </section>
  <section class="panel"><details><summary>玩法說明</summary>
    ${HELP.map(([h, t]) => `<p><b>${h}</b><br><span class="small">${t}</span></p>`).join('')}
  </details></section>
  <section class="panel"><details ${ioMsg ? 'open' : ''}><summary>存檔匯出／匯入</summary>
    <p class="small muted">存檔只存在這個瀏覽器裡。換裝置或清除瀏覽器資料前，先把存檔匯出複製下來，之後再貼回來匯入。</p>
    <textarea id="io" rows="4" placeholder="匯入：把存檔文字貼在這裡"></textarea>
    <div class="btns"><button onclick="exportSave()">匯出並複製</button><button onclick="importSave()">匯入</button></div>
    ${ioMsg ? `<p class="small">${ioMsg}</p>` : ''}
  </details></section>
  ${fresh ? '' : `<section class="panel"><div class="row"><span class="small muted">清除所有進度，包括悟道樹，從頭開始。</span>
    <button class="danger" onclick="arm('reset')">${armed === 'reset' ? '再按一次：全部清除' : '重新開始'}</button></div></section>`}`;
}
let ioMsg = '';
function enterGame() { title = false; fresh = false; armed = ''; ioMsg = ''; lastNow = Date.now(); render(); }
function goTitle() { save(); title = true; armed = ''; render(); scrollTo(0, 0); }
function exportSave() {
  save();
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  $('io').value = code; $('io').select();
  navigator.clipboard?.writeText(code).then(() => { ioMsg = '已匯出並複製到剪貼簿，請找個地方貼上保存。'; render(); $('io').value = code; },
    () => { ioMsg = '已匯出，請手動複製上面的文字。'; render(); $('io').value = code; });
}
function importSave() {
  let d;
  try { d = JSON.parse(decodeURIComponent(escape(atob($('io').value.trim())))); } catch (e) { d = null; }
  if (!d || !d.meta || !d.life) { ioMsg = '這不是有效的存檔文字，存檔沒有變動。'; render(); return; }
  d.t = Date.now();   // 匯入不補離線收益，避免同一份存檔在兩台裝置重複領取
  localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  load(); deathView = 'sum'; armed = '';
  ioMsg = `匯入成功：第 ${S.meta.lives} 世。`; render();
}

// ---------- 悟道樹 ----------
const reqOk = t => t.req.every(r => tl(r) > 0);
function buyTalent(id) {
  const t = TAL[id], m = S.meta, lv = tl(id), c = talentCost(t, lv);
  if (lv >= t.max || !reqOk(t) || (t.cond && !t.cond(m)) || m.guo < c) return;
  m.guo -= c; m.talents[id] = lv + 1;
  save(); render();
}
let treeTab = TALENT_BRANCHES[0];   // 悟道樹目前顯示的分類
function setTreeTab(b) { treeTab = b; render(); }
function toggleAuto(id) { S.meta.auto[id] = !autoOn(id); save(); render(); }
function setAutoMajor(v) { S.meta.autoMajor = +v; save(); }
// 天賦在樹上的深度：沒有前置是 0，否則是前置裡最深的 +1（顯示時由淺到深排）
const talDepth = t => t.req.length ? 1 + Math.max(...t.req.map(r => talDepth(TAL[r]))) : 0;
function renderTree() {
  const m = S.meta;
  const node = t => {
    const lv = tl(t.id), full = lv >= t.max, ok = reqOk(t), condOk = !t.cond || t.cond(m), cost = talentCost(t, lv);
    const action = !ok ? '<span class="muted">先點前置</span>'
      : !condOk ? `<span class="muted">解鎖條件：${t.condText}</span>`
      : full ? '<span class="same">已點滿</span>'
      : `<button class="mini" ${m.guo >= cost ? '' : 'disabled'} onclick="buyTalent('${t.id}')">${cost} 道果</button>`;
    const auto = t.branch === '化身' && lv ? `<button class="mini ${autoOn(t.id) ? 'on' : ''}" onclick="toggleAuto('${t.id}')">${autoOn(t.id) ? '開啟中' : '已關閉'}</button>` : '';
    const thr = t.id === 'a_major' && lv ? `<select onchange="setAutoMajor(this.value)">${[.3, .5, .7, .9].map(v => `<option value="${v}" ${m.autoMajor === v ? 'selected' : ''}>成功率 ≥ ${v * 100}%</option>`).join('')}</select>` : t.id === 'a_event' && lv ? `<select onchange="setEvMode(this.value)">${Object.entries(EV_MODES).map(([k, n]) => `<option value="${k}" ${(m.evMode || 'safe') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>` : '';
    return `<div class="node ${lv ? 'got' : ''} ${ok && condOk ? '' : 'locked'}">
      <div class="row"><b>${t.name}</b><span class="small muted">${lv}/${t.max}</span></div>
      <div class="small">${t.d(Math.max(1, lv))}${lv && !full ? `<span class="muted"> → ${t.d(lv + 1)}</span>` : ''}</div>
      ${t.req.length ? `<div class="small ${ok ? 'muted' : 'hurt'}">前置：${t.req.map(r => TAL[r].name).join('、')}</div>` : ''}
      ${next(t).length ? `<div class="small muted">通往：${next(t).map(x => x.name).join('、')}</div>` : ''}
      <div class="row small">${action}<span>${thr}${auto}</span></div></div>`;
  };
  // 這個天賦是哪些天賦的前置
  const next = t => TALENTS.filter(x => x.req.includes(t.id));
  const list = TALENTS.filter(t => t.branch === treeTab), maxD = Math.max(...list.map(talDepth));
  const tiers = Array.from({ length: maxD + 1 }, (_, d) => list.filter(t => talDepth(t) === d));
  return `<div class="row"><h3>悟道樹</h3><span>道果 <b>${m.guo}</b></span></div>
    <p class="muted small">每一世結束時，依到過的最高境界得到道心和道果。道心自動生效，道果用來點天賦，天賦永久保留。</p>
    <nav>${TALENT_BRANCHES.map(b => `<button class="${treeTab === b ? 'on' : ''}" onclick="setTreeTab('${b}')">${b}</button>`).join('')}</nav>
    ${tiers.map((row, d) => `<div class="small muted" style="margin:10px 0 4px">第 ${d + 1} 層${d ? '' : '（不用前置）'}</div><div class="tal">${row.map(node).join('')}</div>`).join('')}`;
}

// ---------- 啟動 ----------
load();
applyOffline((Date.now() - S.t) / 1000);
render();
let lastNow = Date.now(), saveT = 0;
setInterval(() => {
  const now = Date.now(), dt = (now - lastNow) / 1000; lastNow = now;
  if (title) return;   // 停在開始介面時不算時間
  autoLife();
  if (dt > 30) applyOffline(dt); else tick(dt * gameSpeed());    // 分頁在背景太久就當成離線；光陰如梭只加速線上時間
  if ((saveT += dt) >= 10) { saveT = 0; save(); }
  // 下拉選單打開時不要整頁重繪，不然選單會被關掉
  if (dirty && document.activeElement?.tagName !== 'SELECT') render(); else updateDyn();
}, 1000);
addEventListener('beforeunload', save);
