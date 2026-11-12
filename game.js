// 長生閒記：遊戲邏輯
const SAVE_KEY = 'changsheng_v1';
const YEAR_SEC = 120;       // 線上 120 秒 = 1 年（離線不算年歲）
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
  for (const id in s.techs) if (!TECHS[id]) delete s.techs[id];
  s.subs = (s.subs || []).filter(id => id in s.techs);
  if (!TECHS[s.tech] || TECHS[s.tech].type !== '吐納') {
    if (TECHS[s.tech] && !s.subs.length) s.subs.push(s.tech);   // 原本主修的煉體功法改成輔修
    s.techs.yinqi = s.techs.yinqi || 0; s.tech = 'yinqi';
  }
  for (const id in s.skills) if (!SKILLS[id]) delete s.skills[id];
  s.equip = s.equip.filter(id => id in s.skills);
  s.arts = s.arts || {}; s.gear = s.gear || {};
  if (!s.phys && !s.draw) s.draw = makeDraw(S.meta, s.root);   // 舊存檔補抽體質（原本的靈根留在選項裡）
  s.tox = s.tox || 0; s.body = s.body || 0;
  if (s.draw && !s.draw.rr) { s.draw.rr = { r: s.draw.rerolls, p: s.draw.rerolls }; delete s.draw.rerolls; }
  for (const slot of ART_SLOTS) if (s.gear[slot] && !artOk(s.gear[slot], s)) s.gear[slot] = null;   // 境界不夠的法寶先卸下
  // 神通上線前的存檔：稀有體質補天賦神通，已過化神的補本命神通
  s.shen = s.shen || []; s.flags = s.flags || {};
  if (s.phys && PHYS_SHEN[s.phys] && !s.flags.physShen) { s.flags.physShen = 1; gainShen(PHYS_SHEN[s.phys], `${PHYSIQUES[s.phys].name}血脈甦醒`, s); }
  if (s.root && s.stage >= 18 && !s.flags.benming) { s.flags.benming = 1; gainShen(benmingShen(s), '元神與天地相合', s); }
}

// ---------- 開局抽根骨 ----------
function rollPhys(dao, not = []) {
  const ids = Object.keys(PHYSIQUES).filter(id => !not.includes(id));
  return pickW(ids, id => { const r = PHYSIQUES[id].r; return PHYS_WEIGHT[r] * (r >= 3 ? 1 + dao * .04 : 1); });
}
// 根骨選項：多看一眼 +1 個；天不負我保證好靈根和玄品以上體質；先天聖體保證聖品體質
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
  if (PHYS_SHEN[s.phys] && !s.flags.physShen) { s.flags.physShen = 1; gainShen(PHYS_SHEN[s.phys], `${PHYSIQUES[s.phys].name}血脈甦醒`); }   // 天賦神通
  if (s.mortal) { s.mortal.phase = 'qi'; s.mortal.qi = 0; lastNow = Date.now(); save(); render(); return; }   // 凡人篇：測完靈根去感氣
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
  fruit:  { name: '誤食異果', desc: '在深山吃了一顆通紅的怪果子。體質必有玄品以上，但開局帶傷。',
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
  yixiang: { name: '天生異象', r: 4, mul: {}, rr: 1, goodPhys: 1, desc: '出生那夜滿天星斗亂墜。測靈根時必有玄品以上體質，靈根、體質各多重抽一次。' },
};
const ORIGIN_W = { 1: 6, 2: 3, 3: 1.5, 4: .5 };
function drawOrigins() { const ids = []; while (ids.length < 4) ids.push(pickW(Object.keys(ORIGINS).filter(id => !ids.includes(id)), id => ORIGIN_W[ORIGINS[id].r])); return ids; }
const mortalYears = () => tl('xianyuan') >= 2 ? 0 : MORTAL_YEARS / (1 + tl('xianyuan'));
// 感氣要幾秒：靈根越好越快
const qiNeed = (s = L()) => tl('xianyuan') >= 2 ? 0 : Math.max(5, Math.round(40 / rootType(s).rate / (s.mortal && ORIGINS[s.mortal.origin]?.fastQi ? 2 : 1)));
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
  const s = L(), m = s.mortal, f = FATES[m.fate], o = ORIGINS[m.origin], a = m.acts;
  s.stone += Math.floor(a.farm * 2 + a.trade * 4); s.body += a.wu * .0004; s.techs[s.tech] += Math.floor(a.book * 2);
  if (a.herb >= 30) addItem('juqi', Math.floor(a.herb / 30));
  const gift = [o.enter ? o.enter(s) : '', f.give(s)].filter(Boolean).join('；'), age = Math.floor(s.age);
  s.mortal = null;
  const intro = S.meta.lives === 1 ? `${age} 歲那年，${f.enter}。` : `第 ${S.meta.lives} 世。${age} 歲那年，${f.enter}，心裡卻記得一些不該記得的事。`;
  log(`${intro}你出身${o.name}，身負${rootName()}、${PHYSIQUES[s.phys].name}。引氣入體的那一刻，你成了練氣一層的修士。${gift ? gift + '。' : ''}`);
  save(); dirty = true;
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
const pillDisc = () => 1 - .1 * tl('zhekou');   // 丹房熟客
const healPrice = () => Math.round(20 * (1 + L().stage) * pillDisc());
const mpPillPrice = () => Math.round(15 * (1 + L().stage) * pillDisc());
const cavePrice = () => 80 * Math.pow(2, L().cave);
const xiuPillPrice = () => Math.round(25 * Math.pow(1.5, L().stage) * pillDisc());
const itemPrice = id => {
  const st = L().stage, k = ITEMS[id].kind, f = Math.pow(1 + st, 1.5);
  return k === 'heal' ? healPrice() : k === 'mp' ? mpPillPrice() : k === 'xiu' ? xiuPillPrice() : Math.round(pillDisc() * (k === 'brk' ? BRK_PILL_PRICE[ITEMS[id].major]
    : { life: 200, body: 500, tech: 150 }[k] * f));
};
// 賣給坊市：原價七成。原價用丹藥本身的價位算，不跟著現在的境界漲
const SELL_RATE = .7;
const sellItemPrice = id => {
  const it = ITEMS[id], k = it.kind;
  const base = k === 'brk' ? BRK_PILL_PRICE[it.major] : k === 'xiu' ? 25 * Math.pow(1.5, STAGES.findIndex(x => x.major === it.major))
    : k === 'heal' ? 20 : k === 'mp' ? 15 : { life: 200, body: 500, tech: 150 }[k];
  return Math.max(1, Math.round(base * SELL_RATE));
};
const sellArtPrice = id => Math.round(ART_PRICE[ARTS[id].grade] * SELL_RATE);
function sellItem(id) { const s = L(); if (!count(id)) return; s.items[id]--; s.stone += sellItemPrice(id); save(); render(); }
function sellArt(id) {
  const s = L(); if (!(id in s.arts) || s.gear[ARTS[id].slot] === id) return;
  if (armed !== 'sell:' + id) { armed = 'sell:' + id; render(); return; }
  armed = ''; const p = sellArtPrice(id); delete s.arts[id]; s.stone += p;
  log(`把${ARTS[id].name}賣給了坊市，得靈石 ${fmt(p)}。`); save(); render();
}
const refreshPrice = () => Math.round(20 * Math.pow(1.4, L().stage));
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
function rootName(s = L()) {
  const t = rootType(s), e = s.root.elems.join('');
  return t.id === 'void' || t.id === 'five' ? t.name : t.id === 'heaven' ? e + '天靈根' : t.id === 'mutant' ? e + '變異靈根' : e + t.name;
}
// 這個屬性是否和靈根契合（空靈根只親和無屬性）
const rootFits = (elem, s = L()) => elem === '無' ? s.root.type === 'void' : s.root.elems.includes(elem);
// 術法是否享有靈根親和（萬象歸元體什麼屬性都算）
const skillFits = (elem, s = L()) => rootFits(elem, s) || (s.phys && PHYSIQUES[s.phys].allAff);
function canMain(id, s = L()) { const t = TECHS[id]; return t.type === '吐納' && (t.grade < 3 || t.elem === '無' || rootFits(t.elem, s)); }

// ---------- 功法效果 ----------
const equipped = (s = L()) => [s.tech, ...s.subs];
function techNeed(id, l) { return l * l * 60 * TECHS[id].grade; }
function techLayer(id, s = L()) { return Math.min(9, Math.floor(Math.sqrt((s.techs[id] || 0) / (60 * TECHS[id].grade)))); }
function techMul(id, s = L()) { const l = techLayer(id, s); return 1 + .1 * l + (l >= 9 ? .1 : 0); }
function effOf(id, key, s = L()) { const v = TECHS[id][key] || 0; return NO_SCALE.includes(key) ? v : v * techMul(id, s); }
// 法寶祭煉倍率
const artMul = (id, s = L()) => 1 + .15 * (s.arts[id] || 0);
// 所有加成來源：主修＋輔修功法、法寶（隨祭煉放大）、體質
function eff(key, s = L()) {
  let v = equipped(s).reduce((a, id) => a + effOf(id, key, s), 0);
  for (const slot of ART_SLOTS) { const id = s.gear[slot]; if (id) v += (ARTS[id][key] || 0) * (NO_SCALE.includes(key) ? 1 : artMul(id, s)); }
  if (s.phys) v += PHYSIQUES[s.phys][key] || 0;
  return v + talentEff(key);
}
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
  return (1 + .2 * s.stage) * rootType(s).rate * (main.elem !== '無' && rootFits(main.elem, s) ? 1.15 : 1)
    * (1 + eff('rate', s)) * (mode === 'closed' ? 1 + .15 * s.cave : 1) * (1 + .03 * S.meta.dao)
    * (s.age / lifespan(s) > .7 ? 1 + eff('lateRate', s) : 1)
    * (s.injury > 0 ? .5 : 1) * (mode === 'travel' ? .5 : 1) * (1 + qualBonus(s));
}
function stats(s = L()) {
  const k = 1 + .5 * s.stage, b = (1 + s.body) * (1 + qualBonus(s));   // 突破品質也加氣血、攻擊、防禦
  return {
    hp: Math.round(100 * k * (1 + eff('hp')) * b), mp: Math.round(50 * k * techMul(s.tech, s)), atk: 10 * k * (1 + eff('atk')) * b, def: 5 * k * (1 + eff('def')) * b,
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
// 品質分數：根基、靈根、突破丹、全力一搏，再加一點運氣
function rollQual(s, found, used, mode) {
  const rt = rootType(s).id, root = ['heaven', 'mutant', 'void'].includes(rt) ? .3 : rt === 'dual' ? .15 : 0;
  const sc = found / .3 + root + used * .1 + (mode === 'all' ? .5 : 0) + Math.random() * 1.2;
  return sc >= 2.6 ? 3 : sc >= 1.8 ? 2 : sc >= 1 ? 1 : 0;
}
function skillPow(id, s = L()) {
  const sk = SKILLS[id], same = sk.elem !== '無' && sk.elem === TECHS[s.tech].elem;
  const boost = s.phys && PHYSIQUES[s.phys].boost === sk.elem ? 1.3 : 1;
  return sk.pow * (1 + .25 * skillLv(id, s)) * (same ? 1.2 : 1) * (1 + (skillFits(sk.elem, s) ? rootType(s).aff : 0)) * boost;
}
// 術法耗法力：看品階和境界（法力上限 50×境界係數×主修層數，每回合回 8%）
const SKILL_COST = [0, 1, 1.5, 2, 2.6];
const skillCost = (id, s = L()) => SKILLS[id].kind === 'mana' ? 0 : Math.round(10 * (1 + .5 * s.stage) * SKILL_COST[SKILLS[id].grade]);
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
function learnTech(id) { const s = L(); if (!(id in s.techs)) s.techs[id] = 0; }
function learnSkill(id) { const s = L(); if (!(id in s.skills)) { s.skills[id] = 0; if (s.equip.length < maxEquip()) s.equip.push(id); } }
function randomUnowned(kind, grades) {
  const s = L(), pool = { tech: TECHS, skill: SKILLS, art: ARTS }[kind], owned = { tech: s.techs, skill: s.skills, art: s.arts }[kind];
  const ids = Object.keys(pool).filter(id => grades.includes(pool[id].grade) && !(id in owned) && id !== 'hunyuan' && id !== 'xueying');
  return ids.length ? pick(ids) : null;
}
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
function gainArt(id) { const s = L(); if (!(id in s.arts)) { s.arts[id] = 0; const slot = ARTS[id].slot; if (!s.gear[slot] && artOk(id, s)) s.gear[slot] = id; } }
function equipArt(id) { const s = L(), slot = ARTS[id].slot; if (s.gear[slot] !== id && !artOk(id)) return; s.gear[slot] = s.gear[slot] === id ? null : id; save(); render(); }
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
  const s = L(), p = stats(), myElem = TECHS[s.tech].elem, isVoid = s.root.type === 'void';
  // 從上一場剩下的氣血、法力開始打（連戰會越打越虛）
  let php = p.hp * Math.max(.05, s.hpNow ?? 1), ehp = foe.hp, mp = p.mp * (s.mpNow ?? 1), shield = 0, dodgeT = 0, dodgePow = 0, r = 0, charge = 1;
  let burn = 0, burnT = 0, brkT = 0, brkV = 0, skip = 0, reflT = 0, reflV = 0, buffT = 0, buffV = 0, pill = false;
  const cd = {}, used = {};
  // 神通：領域類整場生效，其他記下來等時機
  const shens = (s.shen || []).map(id => SHENS[id]), shUsed = [], clones = [];
  let faAtk = 1, faDef = 1, faT = 0, reflAll = 0, mpRegen = .08, skillUp = 0, fled = false;
  for (const x of shens.filter(x => x.trig === 'field')) {
    shUsed.push(x.name);
    if (x.foeAtk) foe = { ...foe, atk: foe.atk * x.foeAtk };
    if (x.foeDef !== undefined) foe = { ...foe, def: foe.def * x.foeDef };
    p.regen += x.regen || 0; p.dodge += x.dodge || 0; p.lifesteal += x.steal || 0; p.crit += x.crit || 0;
    reflAll += x.reflect || 0; mpRegen += x.mpRegen || 0; skillUp += x.skillUp || 0; if (x.mpFull) mp = p.mp;
  }
  const strike = (atk, elem, drain = 0, defMul = 1) => {
    let m = elemMul(elem, foe.elem); if (isVoid) m = Math.max(1, m);
    let d = hit(atk * m * (buffT > 0 ? 1 + buffV : 1) * (faT > 0 ? faAtk : 1), foe.def * defMul * (brkT > 0 ? 1 - brkV : 1));
    if (pct(p.crit)) d *= p.critDmg;
    ehp -= d; php = Math.min(p.hp, php + d * (p.lifesteal + drain));
  };
  while (php > 0 && ehp > 0 && r < 30) {
    r++;
    // 開場神通：第一回合先發動
    if (r === 1) for (const x of shens.filter(x => x.trig === 'open')) {
      shUsed.push(x.name);
      if (x.brk) { brkT = 3; brkV = Math.max(brkV, x.brk); }
      if (x.nuke) { if (x.pierce) ehp -= p.atk * x.nuke; else strike(p.atk * x.nuke, '無'); }
      if (x.burn) { burn = p.atk * x.burn; burnT = 4; }
      if (x.stun) skip = Math.max(skip, x.stun);
      if (x.fa) { faAtk = x.fa[0]; faDef = x.fa[1]; faT = x.fa[2]; }
      if (x.shield) shield += p.hp * x.shield;
      if (x.clone) clones.push({ v: x.clone[0], t: x.clone[1], n: x.clone[2] });
    }
    // 冷卻好的術法；回法要法力不到一半才放，增益還在就不重複放
    const ready = s.equip.filter(k => !(cd[k] > 0) && !(SKILLS[k].kind === 'mana' && mp > p.mp * .5) && !(SKILLS[k].kind === 'buff' && buffT > 0));
    // 法力不夠放招、又傷到一半：自動服回氣丹（每場一顆）
    if (!pill && ready.length && ready.every(k => skillCost(k) > mp) && php < p.hp * .5 && count('huiqi')) {
      s.items.huiqi--; S.meta.pills++; pill = true; mp = Math.min(p.mp, mp + p.mp * .6);
    }
    const id = ready.find(k => skillCost(k) <= mp);
    if (id) {
      const sk = SKILLS[id], pw = skillPow(id) * (1 + skillUp);
      mp -= skillCost(id); cd[id] = sk.cd + 1; s.skills[id] += 1 + .5 * tl('shulian'); used[id] = (used[id] || 0) + 1;
      if (sk.kind === 'dmg' || sk.kind === 'multi') {
        // 先上破防再打，打完才結算灼燒和控制
        if (sk.brk) { brkT = 3; brkV = Math.max(brkV, sk.brk); }
        for (let h = 0; h < (sk.hits || 1); h++) strike(p.atk * pw * charge, sk.elem, sk.drain || 0);
        charge = 1;
        if (sk.burn) { burn = p.atk * sk.burn * (pw / sk.pow); burnT = 3; }
        if ((sk.freeze && pct(sk.freeze)) || (sk.stun && pct(sk.stun))) skip = 1;
      }
      else if (sk.kind === 'heal') php = Math.min(p.hp, php + p.hp * .12 * pw);
      else if (sk.kind === 'shield') { shield += p.hp * .12 * pw; if (sk.reflect) { reflT = 3; reflV = sk.reflect; } }
      else if (sk.kind === 'charge') charge = 2 * (1 + .25 * skillLv(id));
      else if (sk.kind === 'buff') { buffT = 3; buffV = .15 * pw; }
      else if (sk.kind === 'mana') mp = Math.min(p.mp, mp + p.mp * .2 * pw);
      else { dodgeT = 3; dodgePow = pw; }
    } else strike(p.atk * charge, myElem), charge = 1;
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
        const d = hit(foe.atk * m, p.def * (faT > 0 ? faDef : 1)), a = Math.min(shield, d); shield -= a; php -= d - a;
        ehp -= d * ((reflT > 0 ? reflV : 0) + reflAll);
      }
    }
    // 保命神通：受到致命傷時發動（不滅回血、遁法直接走人）
    if (php <= 0) {
      const x = shens.find(x => x.trig === 'lethal' && !shUsed.includes(x.name));
      if (x) { shUsed.push(x.name); if (x.flee) { fled = true; php = p.hp * .05; break; } php = p.hp * x.revive; }
    }
    dodgeT--; reflT--; buffT--; faT--;
    php = Math.min(p.hp, php + p.hp * p.regen);
    mp = Math.min(p.mp, mp + p.mp * mpRegen);
  }
  return { win: ehp <= 0, fled, rounds: r, used: Object.keys(used).map(k => SKILLS[k].name).join('、'), shen: shUsed.join('、'), pill, hp: Math.max(0, php) / p.hp, mp: mp / p.mp };
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
    const kx = eff('killXiu');
    if (kx) { const g = Math.min(stg().need - s.xiu, Math.round(stg().need * kx)); s.xiu += Math.max(0, g); }
    if (loot) {
      msg += `，得靈石 ${addStone(stoneUnit(lv) * (.8 + Math.random() * .4) * (1 + eff('stone')))}${tryDrop(.04)}`;
      if (s.place !== 'bamboo' && pct(.01 * (1 + eff('drop')))) msg += `，還撿到一顆${addPill(1)}`;
    }
    log(msg + '。');
  } else { injure(90); log(`不敵${name}，負傷退走（${how}）。`); }
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
    // 功法神通：地階以上的主修練到圓滿
    if (l >= 9 && i === 0 && TECHS[id].grade >= 3 && !s.flags['shenT_' + id]) { s.flags['shenT_' + id] = 1; gainShen(randShen(), `《${TECHS[id].name}》功法圓滿`); }
  });
}
function tick(dt) {
  const s = L(); if (s.dead || s.draw) return;   // 還在抽根骨時不算時間
  if (s.mortal) { mortalTick(dt); return; }      // 還是凡人
  s.age += dt / YEAR_SEC;
  const heal = s.mode === 'closed' ? 2 : 1;   // 閉關時養傷、排毒加倍
  if (s.injury > 0) s.injury = Math.max(0, s.injury - dt * heal);
  if (s.tox > 0) s.tox = Math.max(0, s.tox - dt / 6 * (1 + .5 * tl('jiedu')) * heal);
  // 目前氣血、法力（比例），下一場戰鬥從這裡開始；戰鬥外約 40 秒回滿，閉關快一倍
  s.hpNow = Math.min(1, (s.hpNow ?? 1) + dt / 40 * heal); s.mpNow = Math.min(1, (s.mpNow ?? 1) + dt / 40 * heal);
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
const EV_GAIN = /addStone|addXiu|addPill|addHeal|addLife|addTechXp|tryDrop|learnTech|learnSkill|gainArt|giftTech|giftArt|brkBonus \+=|techs\[|skills\[|lifeBonus/g;
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
  if (autoOn('a_refine')) for (const slot of ART_SLOTS) { const id = s.gear[slot]; if (id && s.arts[id] < ART_MAX_REFINE && s.stone > refinePrice(id) * 3) refineArt(id); }
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
function arcEnd(id, end) { arc(id).ended = 1; S.meta.arcDone[id] = end; S.meta.arcLife[id] = S.meta.lives; }
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
    if (s.stage < (e.min || 0) || (e.cond && !e.cond(s)) || (seen !== undefined && (!e.repeat || times >= 4 || s.age - seen < 40))) continue;
    c.push({ ref: { ev: e.id }, w: 1 });
  }
  if (!c.length) return;
  s.ev = pickW(c, o => o.w).ref;
  dirty = true;
}
function curEvent() {
  const r = L().ev; if (!r) return null;
  if (r.arc) return { ...ARCS[r.arc].steps[arc(r.arc).step], who: ARCS[r.arc].name };
  if (r.mem) { const e = MEMORIES.find(x => x.id === r.mem); return { ...e, who: ARCS[e.bond].name }; }
  return EVENTS.find(x => x.id === r.ev);
}
const val = (v, s) => typeof v === 'function' ? v(s) : v;
const visible = e => e.choices.filter(c => !c.cond || c.cond(L()));
function choose(i) {
  const s = L(), e = curEvent(); if (!e) return;
  const ch = visible(e)[i]; if (!ch) return;
  const ref = s.ev; s.ev = null;
  if (ref.ev) { s.flags['ev_' + ref.ev] = s.age; s.flags['evn_' + ref.ev] = (s.flags['evn_' + ref.ev] || 0) + 1; }   // 年齡和次數，給重複冷卻用
  if (ref.mem) S.meta.memSeen[ref.mem] = 1;
  const res = ch.run(s);
  if (ref.arc && !arc(ref.arc).ended) arc(ref.arc).step++;
  log(`【${e.title}】${res}`);
  save(); render();
}

// ---------- 玩家操作 ----------
function setMode(m) { L().mode = m; L().encT = 8; dirty = true; render(); }
function setPlace(id) { L().place = id; dirty = true; render(); }
function breakthrough() {
  const s = L(); if (s.xiu < stg().need || s.stage >= STAGES.length - 1) return;
  log(tryBreak().msg); save(); render();
}
// 衝擊下一個境界（手動和離線共用同一套規則），回傳結果文字
// ---------- 神通的取得 ----------
// 本命（化神，依靈根）、極品突破、天賦（稀有體質）、功法圓滿、法寶器靈、宿世（前世帶來）
const hasShen = (id, s = L()) => (s.shen || []).includes(id);
const randShen = (s = L()) => { const ids = Object.keys(SHENS).filter(id => !hasShen(id, s)); return ids.length ? pick(ids) : null; };
const benmingShen = (s = L()) => s.root.type === 'void' ? 'guixu' : Object.keys(SHENS).find(id => SHENS[id].elem === s.root.elems[0]);
// 指定的那門已經有了，就改給一門隨機的
function gainShen(id, why, s = L()) {
  if (id && hasShen(id, s)) id = randShen(s);
  if (!id) return;
  (s.shen = s.shen || []).push(id);
  log(`${why}，覺醒神通「${SHENS[id].name}」：${SHENS[id].desc}。`);
}
function setBrkMode(v) { L().brkMode = v; save(); updateDyn(); }
// offline：離線自動突破一律穩紮穩打
function tryBreak(offline = false) {
  const s = L(), major = isMajorNext(), mode = major && !offline ? s.brkMode : 'safe';
  const p = brkChance(s, mode), used = brkPillsUsed(), pill = major ? ITEMS[BRK_PILLS[stg().major]].name : '', found = s.found || 0;
  const hard = mode === 'all' ? 1.5 : 1;   // 全力一搏失敗更慘
  if (used) s.items[BRK_PILLS[stg().major]] -= used;
  s.brkBonus = 0; s.found = 0;
  if (pct(p)) {
    s.stage++; s.xiu = 0; s.peak = Math.max(s.peak, s.stage); S.meta.best = Math.max(S.meta.best, s.stage);
    let ql = '';
    if (major) {
      const q = rollQual(s, found, used, mode), mj = stg().major; s.qual = s.qual || {}; s.qual[mj] = q;
      ql = mj === 3 ? `元嬰出世，${qualName(mj, q)}。` : `成就${qualName(mj, q)}。`;
      if (q === 3) gainShen(randShen(s), `${qualName(mj, q)}，天地共鳴`);
      if (mj === 4 && !s.flags.benming) { s.flags.benming = 1; gainShen(benmingShen(s), '踏入化神，元神與天地相合'); }
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
      const yrs = Math.round(MAJORS[mj].life * .03 * half * hard); s.age += yrs;
      extra = `，經脈受創，折壽 ${yrs} 年`;
      if (pct(Math.min(.6, (.1 + .05 * mj) * half * hard))) {
        s.stage--; s.xiu = Math.floor(stg().need * .5);
        if (place().min > s.stage) s.place = PLACES.filter(p => s.stage >= p.min).pop().id;
        extra += `，境界跌回${stg().name}`;
      }
    }
    return { ok: false, major, msg: `突破失敗${used ? `（${pill} ${used} 顆也沒能撐住）` : ''}，修為散去 ${Math.round(loss * 100)}%${extra}。` };
  }
}
// 換主修要散功：目前修為折半（各功法自己的層數保留）。手動換要按兩次確認
function switchTech(id, force) {
  const s = L(); if (!canMain(id) || id === s.tech) return;
  if (!force && armed !== 'tech:' + id) { armed = 'tech:' + id; render(); return; }
  armed = ''; s.xiu /= 2; s.tech = id; s.subs = s.subs.filter(x => x !== id);
  log(`散功重修，改以《${TECHS[id].name}》為主修，修為折半。`); save(); render();
}
function toggleSub(id) {
  const s = L(), i = s.subs.indexOf(id);
  if (i >= 0) s.subs.splice(i, 1); else if (s.subs.length < maxSubs() && TECHS[id].type !== '吐納') s.subs.push(id);
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
  else if (it.kind === 'tech') { s.techs[s.tech] += 600 * pe; msg = `服下悟道丹，對《${TECHS[s.tech].name}》的領悟更深一層。`; }
  else return;
  s.items[id]--; S.meta.pills++; log(msg); save(); render();
}
function useHeal() { usePill('heal'); }
function setTab(t) { tab = t; armed = ''; render(); }

// ---------- 坊市貨架 ----------
function restock() {
  const s = L(), slots = [];
  const grades = [1, 2, 3, 4].filter(g => s.stage >= GRADE_MIN_STAGE[g]);
  // 功法、術法、法寶各有自己的圖鑑和價格表
  const kinds = { tech: [TECHS, s.techs, TECH_PRICE], skill: [SKILLS, s.skills, SKILL_PRICE], art: [ARTS, s.arts, ART_PRICE] };
  for (let i = 0; i < SHOP_SLOTS + 2 * tl('huojia'); i++) {
    let slot = null;
    const r = Math.random(), k = r < .3 ? 'tech' : r < .55 ? 'skill' : r < .72 ? 'art' : '';
    if (k) {
      const [pool, owned, prices] = kinds[k], g = pickW(grades, g => GRADE_WEIGHT[g]);
      const ids = Object.keys(pool).filter(id => pool[id].grade === g && !(id in owned) && id !== 'hunyuan' && id !== 'xueying' && !slots.some(x => x.id === id));
      if (ids.length) { const id = pick(ids); slot = { k, id, price: Math.round(prices[g] * (.8 + Math.random() * .4)) }; }
    }
    if (!slot) {
      const m = stg().major;
      // 修為丹櫃台就有，貨架只放其他丹藥，而且同一種不重複
      const opts = [['yanshou', 1.5], ['xisui', 1], ['wudao', 1.5]];
      if (BRK_PILLS[m]) opts.push([BRK_PILLS[m], .08]);   // 突破丹稀有：約五次進貨出現一次
      const left = opts.filter(o => !slots.some(x => x.id === o[0]));
      if (!left.length) break;   // 功法都學完、丹藥也擺滿了，貨架就少擺幾格
      const id = pickW(left, o => o[1])[0];
      slot = { k: 'item', id, price: itemPrice(id) };
    }
    if (pct(.12 * (1 + tl('qihuo')))) { slot.deal = 1; slot.price = Math.round(slot.price * .6); }
    slots.push(slot);
  }
  s.shop = { next: Date.now() + shopRefresh() * 1000, slots };
}
const shopRefresh = () => SHOP_REFRESH - 120 * tl('jinhuo');
function ensureShop() { const s = L(); if (!s.shop || Date.now() >= s.shop.next) { restock(); return true; } return false; }
function manualRefresh() { const s = L(), p = refreshPrice(); if (s.stone < p) return; s.stone -= p; restock(); save(); render(); }
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
function die() {
  const s = L(); s.dead = true;
  S.meta.history.push({ life: S.meta.lives, stageName: STAGES[s.peak].name, age: Math.floor(s.age), root: s.root ? rootName(s) + (s.phys ? '、' + PHYSIQUES[s.phys].name : '') : '' });
  S.meta.keepTech = { id: s.tech, xp: s.techs[s.tech] };   // 給「前世功法」天賦用
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
  s.hpNow = s.mpNow = 1;   // 離線回來一律回滿
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
const TABS = [['cult', '功法'], ['skill', '術法'], ['art', '法寶'], ['bag', '行囊'], ['shop', '坊市'], ['log', '紀事'], ['dao', '道途']];
const physDesc = id => { const x = PHYSIQUES[id]; return x.desc || [x.boost ? `${x.boost}屬性術法 +30%` : '', effText(x)].filter(Boolean).join(' · '); };
function rootDesc(root) {
  const t = ROOT_TYPES.find(r => r.id === root.type);
  return `修煉 ×${t.rate}${t.aff ? ` · 親和術法 +${Math.round(t.aff * 100)}%` : ''}${t.desc ? ' · ' + t.desc : ''}`;
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
      <div class="row"><span><b class="realm">${stg().name}</b> <span class="root">${rootName()}</span></span><span class="muted" id="age"></span></div>
      ${bar('life', 0, 'lifebar')}
      <div class="row"><span>修為</span><span id="xtxt"></span></div>
      ${bar('xiu', 0, 'xbar')}
      <div class="vit small"><div><div class="row"><span>氣血</span><span id="hptxt"></span></div>${bar('hp thin', 1, 'hpbar')}</div>
        <div><div class="row"><span>法力</span><span id="mptxt"></span></div>${bar('mp thin', 1, 'mpbar')}</div></div>
      <div class="row small"><span id="res"></span><span id="inj"></span></div>
      <div class="btns">
        <button class="${s.mode === 'closed' ? 'on' : ''}" onclick="setMode('closed')">閉關</button>
        <button class="${s.mode === 'travel' ? 'on' : ''}" onclick="setMode('travel')">遊歷</button>
        <select onchange="setPlace(this.value)" ${s.mode === 'travel' ? '' : 'disabled'}>
          ${PLACES.filter(p => s.stage >= p.min).map(p => `<option value="${p.id}" ${p.id === s.place ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
        <span style="margin-left:auto;display:flex;gap:8px;align-items:center">${isMajorNext() ? `<select class="mini" onchange="setBrkMode(this.value)" title="大境界突破方式">${[['safe', '穩紮穩打'], ['all', '全力一搏']].map(([k, n]) => `<option value="${k}" ${(s.brkMode || 'safe') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}
        <button id="brk" class="primary" onclick="breakthrough()"></button></span>
      </div>
      <ul class="recent" id="recent"></ul>
    </section>
    ${s.offline ? renderOffline() : ''}
    ${s.ev ? renderEvent() : ''}
    <nav>${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="setTab('${k}')">${n}</button>`).join('')}</nav>
    <section class="panel">${({ cult: renderCult, skill: renderSkill, art: renderArt, bag: renderBag, shop: renderShop, log: renderLog, dao: renderDao })[tab]()}</section>`;
  updateDyn();
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
  $('mptxt').textContent = `${fmt(Math.round(st.mp * mp))} / ${fmt(st.mp)}`; $('mpbar').firstChild.style.width = mp * 100 + '%';
  $('res').innerHTML = `靈石 ${fmt(s.stone)}${s.found >= .01 ? ` · <span class="same">根基 +${Math.round(s.found * 100)}%</span>` : ''}${s.tox >= 1 ? ` · <span class="${s.tox > 50 ? 'hurt' : ''}">丹毒 ${Math.ceil(s.tox)}%</span>` : ''}`;
  $('inj').innerHTML = s.injury > 0 ? `<span class="hurt">負傷 ${Math.ceil(s.injury)} 秒</span>${count('heal') ? ' <button class="mini" onclick="useHeal()">服療傷丹</button>' : ''}` : (s.mode === 'travel' ? `遊歷${place().name}` : '閉關中');
  const b = $('brk'), last = s.stage >= STAGES.length - 1, u = brkPillsUsed();
  b.disabled = last || s.xiu < need;
  b.textContent = last ? '已至巔峰' : `突破 ${Math.round(brkChance() * 100)}%${u ? `（服${ITEMS[BRK_PILLS[stg().major]].name} ${u}）` : ''}`;
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
const techAff = t => t.elem !== '無' && rootFits(t.elem) ? ` · <span class="same">靈根親和${t.type === '吐納' ? '（主修時修煉 +15%）' : ''}</span>` : '';
function techCard(id, btns = '') {
  const s = L(), t = TECHS[id], l = techLayer(id);
  return `<div class="item"><div class="row"><b>《${t.name}》</b>${gradeTag(t.grade, `${t.type} · ${t.elem} · 第 ${l} 層${l >= 9 ? '（圓滿）' : ''}`)}</div>
    <div class="row small"><span>${effText(t, id) || '<span class="muted">沒有特別加成</span>'}${techAff(t)}</span><span>${btns}</span></div>
    ${l < 9 ? bar('xiu thin', ((s.techs[id] || 0) - techNeed(id, l)) / (techNeed(id, l + 1) - techNeed(id, l))) : ''}</div>`;
}
function renderCult() {
  const s = L(), st = stats(), rt = rootType();
  const others = Object.keys(s.techs).filter(id => !equipped().includes(id)).sort((a, b) => TECHS[b].grade - TECHS[a].grade);
  const btnFor = id => {
    const t = TECHS[id];
    if (t.type === '吐納') return canMain(id) ? `<button class="mini ${armed === 'tech:' + id ? 'danger' : ''}" onclick="switchTech('${id}')">${armed === 'tech:' + id ? '確定散功？修為減半' : '改為主修'}</button>` : `<span class="muted">需${t.elem}屬性靈根</span>`;
    return s.subs.length < 2 ? `<button class="mini" onclick="toggleSub('${id}')">輔修</button>` : '<span class="muted">輔修已滿</span>';
  };
  return `<h3>靈根</h3>
    <div class="item"><div class="row"><b>${rootName()}</b><span class="small">修煉 ×${rt.rate}${rt.aff ? ` · 親和屬性術法 +${Math.round(rt.aff * 100)}%` : ''}</span></div>
      <div class="muted small">${rt.desc || (s.root.elems.length ? `親和：${s.root.elems.join('、')}。主修同屬性功法再快 15%，地階以上只能修這些屬性（或無屬性）的功法。` : '')}</div></div>
    <h3>體質</h3>
    <div class="item"><div class="row"><b class="g${PHYSIQUES[s.phys].r}">${PHYSIQUES[s.phys].name}</b><span class="small muted">${PHYS_RANK[PHYSIQUES[s.phys].r]}</span></div>
      <div class="small">${physDesc(s.phys)}</div></div>
    <h3>境界品質</h3>${Object.keys(s.qual || {}).length ? `<div class="item">${Object.entries(s.qual).map(([mj, q]) => `<div class="row small"><span>${MAJORS[mj].name}：<b class="g${q + 1}">${qualName(+mj, q)}</b></span><span class="muted">${QUAL_RANK[q]}${q ? ` · +${QUAL_BONUS[q] * 100}%` : ''}</span></div>`).join('')}
      <div class="small same">修煉、氣血、攻擊、防禦合計 +${Math.round(qualBonus() * 100)}%</div></div>` : '<p class="muted small">還沒突破過大境界。大境界突破成功時會決定品質：根基越厚、靈根越好、突破丹越多，品質越好；選「全力一搏」更容易出極品，但成功率較低、失敗更慘。</p>'}
    <h3>主修</h3>${techCard(s.tech)}
    <h3>輔修（${s.subs.length}/${maxSubs()}）</h3>${s.subs.map(id => techCard(id, `<button class="mini on" onclick="toggleSub('${id}')">卸下</button>`)).join('') || '<p class="muted small">空著。煉體、身法、劍修、長生、丹道、殺伐、悟性、尋寶類功法都能輔修，精進速度是主修的一半。</p>'}
    <h3>身體</h3>
    <div class="stats"><span>氣血 ${fmt(st.hp)}</span><span>法力 ${fmt(st.mp)}</span><span>攻擊 ${fmt(st.atk)}</span><span>防禦 ${fmt(st.def)}</span><span>身法 ${st.spd}</span>
      <span>暴擊 ${Math.round(st.crit * 100)}%</span><span>暴傷 ${Math.round(st.critDmg * 100)}%</span><span>閃避 ${Math.round(st.dodge * 100)}%</span><span>屬性 ${TECHS[s.tech].elem}</span></div>
    <h3>已學功法（${Object.keys(s.techs).length}）</h3>
    ${others.map(id => techCard(id, btnFor(id))).join('') || '<p class="muted">還沒有別的功法。坊市、遊歷、奇遇都可能得到。</p>'}
    <p class="muted small">換功法不會損失層數。戰鬥時普通攻擊帶主修功法的屬性；屬性相剋時傷害 ×1.3，被剋 ×0.75。</p>`;
}
function renderSkill() {
  const s = L(), te = TECHS[s.tech].elem;
  const row = id => { const k = SKILLS[id], on = s.equip.includes(id), lv = skillLv(id), nx = MASTERY_USES[lv + 1];
    return `<div class="item"><div class="row"><b>${k.name}</b>${gradeTag(k.grade, `${k.elem} · ${KIND_LABEL[k.kind]}`)}</div>
      <div class="small">${skillDesc(k)}</div>
      <div class="row small"><span>${MASTERY[lv]}${nx ? `（${s.skills[id]}/${nx}）` : ''}${k.kind === 'charge' ? '' : ` · 威力 ${skillPow(id).toFixed(1)}`} · 冷卻 ${k.cd} · 耗法 ${skillCost(id)}${k.elem !== '無' && k.elem === te ? ' · <span class="same">與主修同屬性</span>' : ''}${skillFits(k.elem) ? ' · <span class="same">靈根親和</span>' : ''}</span>
      <span>${on ? `<button class="mini" onclick="moveEquip('${id}',-1)">↑</button><button class="mini" onclick="moveEquip('${id}',1)">↓</button>` : ''}<button class="mini ${on ? 'on' : ''}" onclick="toggleEquip('${id}')">${on ? '卸下' : '裝備'}</button></span></div></div>`; };
  const shen = s.shen || [];
  return `<h3>神通（${shen.length}）</h3>${shen.map(id => { const x = SHENS[id]; return `<div class="item"><div class="row"><b class="g4">${x.name}</b><span class="small muted">${x.type} · ${{ open: '開場發動', field: '整場生效', lethal: '危急時發動' }[x.trig]}</span></div><div class="small">${x.desc}</div></div>`; }).join('')
    || '<p class="muted small">還沒有神通。踏入化神時會依靈根覺醒本命神通；大境界突破出極品、稀有體質、地階以上主修功法圓滿、天階法寶祭煉圓滿，也都會覺醒神通。每門神通一場戰鬥發動一次，不耗法力。</p>'}
    <p class="small">法力 ${fmt(stats().mp)}，每回合回復 8%。</p><h3>出招順序（最多 ${maxEquip()} 個）</h3>${s.equip.map(row).join('') || '<p class="muted">沒有裝備術法，只會普通攻擊。</p>'}
    <h3>其他術法</h3>${Object.keys(s.skills).filter(id => !s.equip.includes(id)).map(row).join('') || '<p class="muted">沒有了。</p>'}
    <p class="muted small">戰鬥時每回合由上往下找第一個冷卻好、法力也夠的術法施放；都放不了就普通攻擊。法力會延續到下一場，戰鬥外慢慢回滿；術法品階越高越耗法力，主修功法層數越高法力越多。用得越多越熟練，和主修同屬性威力 +20%。</p>`;
}
function renderArt() {
  const s = L();
  const card = id => {
    const a = ARTS[id], lv = s.arts[id], on = s.gear[a.slot] === id, full = lv >= ART_MAX_REFINE, p = refinePrice(id);
    return `<div class="item"><div class="row"><b>${a.name}</b>${gradeTag(a.grade, `${a.slot} · 祭煉 ${lv} 重`)}</div>
      <div class="row small"><span>${effText(a, null, artMul(id))}</span><span>
        <button class="mini" ${full || s.stone < p ? 'disabled' : ''} onclick="refineArt('${id}')">${full ? '已祭煉圓滿' : `祭煉 ${fmt(p)} 靈石`}</button>
        ${on || artOk(id) ? `<button class="mini ${on ? 'on' : ''}" onclick="equipArt('${id}')">${on ? '卸下' : '裝備'}</button>` : `<span class="muted">需${ART_REALM_NAME[a.grade]}</span>`}
        ${on ? '' : `<button class="mini ${armed === 'sell:' + id ? 'danger' : ''}" onclick="sellArt('${id}')">${armed === 'sell:' + id ? '確定賣出？' : `賣 ${fmt(sellArtPrice(id))}`}</button>`}</span></div></div>`;
  };
  const owned = Object.keys(s.arts);
  return ART_SLOTS.map(slot => `<h3>${slot}</h3>${owned.filter(id => ARTS[id].slot === slot).sort((a, b) => (s.gear[slot] === b) - (s.gear[slot] === a)).map(card).join('') || '<p class="muted small">還沒有。坊市、遊歷都可能得到。</p>'}`).join('')
    + '<p class="muted small">每一格只能裝一件。玄階法寶要築基、地階要金丹、天階要元嬰才驅使得動。祭煉每重讓效果 +15%，最多 9 重。</p>';
}
function renderBag() {
  const s = L(), ids = Object.keys(ITEMS).filter(id => count(id) > 0);
  const btn = id => {
    const k = ITEMS[id].kind;
    if (k === 'brk') return `<span class="muted small">${ITEMS[id].major === stg().major && isMajorNext() ? '突破時自動服用' : '突破對應大境界時自動服用'}</span>`;
    if (k === 'mp') return '<span class="muted small">戰鬥中自動服用</span>';
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
    if (o.k === 'tech') { const t = TECHS[o.id]; return `<div class="item"><div class="row"><span>${deal}<b>《${t.name}》</b> ${gradeTag(t.grade, `${t.type} · ${t.elem}`)}</span>${btn(o.price, `buySlot(${i})`)}</div><div class="small">${effText(t) || '<span class="muted">沒有特別加成</span>'}${techAff(t)}${t.type === '吐納' && !canMain(o.id) ? ' · <span class="hurt">你的靈根修不了</span>' : ''}</div></div>`; }
    if (o.k === 'skill') { const k = SKILLS[o.id]; return `<div class="item"><div class="row"><span>${deal}<b>${k.name}</b> ${gradeTag(k.grade, `術法 · ${k.elem} · ${KIND_LABEL[k.kind]}`)}</span>${btn(o.price, `buySlot(${i})`)}</div><div class="small">${k.pow ? `威力 ${k.pow} · ` : ''}冷卻 ${k.cd}${skillDesc(k) ? ' · ' + skillDesc(k) : ''}</div></div>`; }
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
    ${s.shop.slots.map(slot).join('')}
    <p class="muted small">貨架每 ${shopRefresh() / 60} 分鐘換一批，關掉網頁也照算。功法、術法、法寶、丹藥都可能出現，境界越高越容易出現高階貨。</p>`;
}
function renderLog() { return `<ul class="log">${L().log.map(l => `<li><span class="muted">${l.age} 歲</span> ${l.text}</li>`).join('')}</ul>`; }
function renderDao() {
  const m = S.meta;
  const bonds = Object.entries(m.arcDone).map(([id, end]) => `<li><b>${ARCS[id].name}</b>：${ARC_END_LABEL[end]}（第 ${m.arcLife[id]} 世）</li>`).join('');
  return `<h3>道心 ${m.dao}</h3><p class="small">每點道心讓修煉 +3%，也更容易抽到好根骨，每 15 點多一次重抽。</p>
    ${renderTree()}
    <h3>羈絆</h3><ul class="log">${bonds || '<li class="muted">還沒有。</li>'}</ul>
    <h3>前世</h3><ul class="log">${m.history.map(h => `<li>第 ${h.life} 世：${h.root ? h.root + '，' : ''}${h.stageName}，${h.age} 歲坐化</li>`).join('') || '<li class="muted">這是你的第一世。</li>'}</ul>
    <h3>其他</h3><div class="btns">
      <button class="danger" onclick="arm('rebirth')">${armed === 'rebirth' ? `確定兵解？可得道心、道果各 ${daoGain()}` : '兵解轉世'}</button>
      <button class="danger" onclick="arm('reset')">${armed === 'reset' ? '再按一次：全部清除' : '清除存檔'}</button></div>`;
}
function renderDeath() {
  const s = L(), h = S.meta.history[S.meta.history.length - 1];
  const head = `<header><h1>長生閒記</h1><span class="muted">第 ${S.meta.lives} 世 · 坐化<button class="mini" onclick="goTitle()">首頁</button></span></header>`;
  if (deathView === 'tree') return `${head}<section class="panel card">
    <div class="row"><b>悟道</b><span>可用道果 <b class="same">${S.meta.guo}</b></span></div>
    <p class="small muted">天賦永久保留，下一世開始就生效。點好了就轉世，重新抽根骨。</p>
    <div class="choices"><button onclick="setDeathView('sum')">回顧這一世</button><button class="primary" onclick="rebirth()">轉世</button></div></section>
    <section class="panel">${renderTree()}</section>`;
  return `${head}<section class="panel card">
    <b>第 ${S.meta.lives} 世 · 坐化</b>
    <p>你在 ${h.age} 歲走到了盡頭。這一世身負${rootName()}，最高修到${h.stageName}，擊敗敵人 ${s.wins} 次。</p>
    <p>這一世的感悟化為道心 +${s.daoGot}、道果 +${s.daoGot}。現在共有道果 <b class="same">${S.meta.guo}</b>，可以到悟道樹點天賦。</p>
    <div class="choices"><button class="primary" onclick="setDeathView('tree')">入悟道</button></div></section>
    <section class="panel"><h3>這一世的紀事</h3>${renderLog()}</section>`;
}

// ---------- 開始介面 ----------
const HELP = [
  ['放置修煉', '開著網頁，修為就會自己增長。線上 2 分鐘是遊戲裡的 1 年。關掉網頁後修為照樣累積（效率較低），不會增加年歲。點了「水到渠成」，離線時也會自動突破小境界；沒點的話修為滿了就停下，多的化為根基。'],
  ['閉關與遊歷', '閉關修為較穩，多出來的修為會變成根基，提高突破成功率，偶爾還會頓悟。遊歷會遇到事件、戰鬥和寶物，但可能受傷。'],
  ['凡人篇', '每一世都從凡人開始：先抽出身，做些凡人的事累積底子，等仙緣上門後選一條路，測出靈根、感氣入體，才算踏入練氣。'],
  ['突破', '修為滿了就能突破。小境界容易，失敗只會散去一些修為。大境界有機率失敗，失敗會經脈受創、折損壽元，還可能跌回上一個小境界，境界越高越兇險。服用對應境界的突破丹可以提高成功率。大境界成功時會決定品質（下品到極品，例如無瑕道基、九竅金丹），這一世永久提升修煉和戰力；選「全力一搏」成功率較低，但更容易出好品質。'],
  ['神通', '比術法強得多的本事，每門一場戰鬥發動一次。踏入化神會依靈根覺醒本命神通；突破出極品、稀有體質、地階以上主修功法圓滿、天階法寶祭煉圓滿也會覺醒。神通跟著這一世，轉世後重來。'],
  ['功法、術法、法寶', '主修功法決定修煉速度，輔修功法提供各種加成。術法在戰鬥中自動施放，要耗法力，用得越多越熟練。法力不夠時會自動服回氣丹。法寶可以祭煉變強。這些都能在事件或坊市取得。'],
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
function renderTree() {
  const m = S.meta;
  const node = t => {
    const lv = tl(t.id), full = lv >= t.max, ok = reqOk(t), condOk = !t.cond || t.cond(m), cost = talentCost(t, lv);
    const action = !ok ? `<span class="muted">需要：${t.req.map(r => TAL[r].name).join('、')}</span>`
      : !condOk ? `<span class="muted">解鎖條件：${t.condText}</span>`
      : full ? '<span class="same">已點滿</span>'
      : `<button class="mini" ${m.guo >= cost ? '' : 'disabled'} onclick="buyTalent('${t.id}')">${cost} 道果</button>`;
    const auto = t.branch === '化身' && lv ? `<button class="mini ${autoOn(t.id) ? 'on' : ''}" onclick="toggleAuto('${t.id}')">${autoOn(t.id) ? '開啟中' : '已關閉'}</button>` : '';
    const thr = t.id === 'a_major' && lv ? `<select onchange="setAutoMajor(this.value)">${[.3, .5, .7, .9].map(v => `<option value="${v}" ${m.autoMajor === v ? 'selected' : ''}>成功率 ≥ ${v * 100}%</option>`).join('')}</select>` : t.id === 'a_event' && lv ? `<select onchange="setEvMode(this.value)">${Object.entries(EV_MODES).map(([k, n]) => `<option value="${k}" ${(m.evMode || 'safe') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>` : '';
    return `<div class="node ${lv ? 'got' : ''} ${ok && condOk ? '' : 'locked'}">
      <div class="row"><b>${t.name}</b><span class="small muted">${lv}/${t.max}</span></div>
      <div class="small">${t.d(Math.max(1, lv))}${lv && !full ? `<span class="muted"> → ${t.d(lv + 1)}</span>` : ''}</div>
      <div class="row small">${action}<span>${thr}${auto}</span></div></div>`;
  };
  return `<div class="row"><h3>悟道樹</h3><span>道果 <b>${m.guo}</b></span></div>
    <p class="muted small">每一世結束時，依到過的最高境界得到道心和道果。道心自動生效，道果用來點天賦，天賦永久保留。</p>
    <nav>${TALENT_BRANCHES.map(b => `<button class="${treeTab === b ? 'on' : ''}" onclick="setTreeTab('${b}')">${b}</button>`).join('')}</nav>
    <div class="tal">${TALENTS.filter(t => t.branch === treeTab).map(node).join('')}</div>`;
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
