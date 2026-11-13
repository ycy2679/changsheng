// 長生閒記：境界、靈根、功法、丹藥、地點、坊市（術法、法寶、體質在 gear.js）

// 大境界：life 壽元（年）、brk 突破到下一個大境界的基礎成功率
const MAJORS = [
  { name: '練氣', subs: ['一層', '二層', '三層', '四層', '五層', '六層', '七層', '八層', '九層'], life: 100, brk: .5 },
  { name: '築基', subs: ['初期', '中期', '後期'], life: 200, brk: .38 },
  { name: '金丹', subs: ['初期', '中期', '後期'], life: 240, brk: .27 },
  { name: '元嬰', subs: ['初期', '中期', '後期'], life: 360, brk: .18 },
  { name: '化神', subs: ['初期', '中期', '後期'], life: 530, brk: .15 },
  { name: '煉虛', subs: ['初期', '中期', '後期'], life: 730, brk: .12 },
  { name: '合體', subs: ['初期', '中期', '後期'], life: 930, brk: .09 },
  { name: '大乘', subs: ['初期', '中期', '後期'], life: 1130, brk: .06 },
  { name: '渡劫', subs: ['初期', '中期', '後期'], life: 1330, brk: 0 },   // 渡劫後期之後是飛升，等成仙時再做
];

// 攤平成 33 個小境界，need = 修為上限
const STAGES = [];
MAJORS.forEach((m, mi) => m.subs.forEach(sub => STAGES.push({ major: mi, name: m.name + sub })));
STAGES.forEach((s, i) => { s.need = Math.round(80 * Math.pow(1.72, i)); });

const GRADES = ['', '黃階', '玄階', '地階', '天階', '傳說'];

// ---------- 屬性 ----------
const FIVE = ['金', '木', '水', '火', '土'];
const MUTANT = ['雷', '冰', '風'];
// 相剋：攻方屬性剋守方時傷害 ×1.3，被剋時 ×0.75
const COUNTERS = { 金: ['木', '風'], 木: ['土'], 水: ['火'], 火: ['金', '冰'], 土: ['水', '雷'], 雷: ['水'], 冰: ['木'], 風: ['土'] };

// ---------- 靈根：每一世開局隨機抽 ----------
// n 幾種屬性、pool 從哪些屬性抽、w 權重、rate 修煉倍率、aff 親和屬性術法加成、good 道心越高越容易抽到
const ROOT_TYPES = [
  { id: 'heaven', name: '天靈根', n: 1, pool: FIVE, w: 4, rate: 1.6, aff: .4, good: 1 },
  { id: 'mutant', name: '變異靈根', n: 1, pool: MUTANT, w: 2, rate: 1.7, aff: .5, good: 1 },
  { id: 'void', name: '空靈根', n: 0, pool: [], w: 2, rate: 1.4, aff: .5, good: 1, desc: '不沾任何屬性，所以什麼屬性的功法都能修，主修都算親和：無屬性術法 +50%，也不受相剋影響。' },
  { id: 'dual', name: '雙靈根', n: 2, pool: FIVE, w: 14, rate: 1.3, aff: .2, good: 1 },
  { id: 'triple', name: '三靈根', n: 3, pool: FIVE, w: 30, rate: 1.1, aff: .1 },
  { id: 'quad', name: '四靈根', n: 4, pool: FIVE, w: 28, rate: 1, aff: 0 },
  { id: 'five', name: '五靈根', n: 5, pool: FIVE, w: 20, rate: .85, aff: 0 },
];

// ---------- 功法 ----------
// type：吐納（法修）、鍛體（體修）、觀想（魂修）= 主修（決定修煉速度和屬性），其他都是輔修；鍛體也能輔修（不算修煉速度）
// 數值會隨層數放大（life、brk、offline 除外）：
//   rate 修煉 hp/atk/def 氣血攻防% spd 身法 crit 暴擊率 critDmg 暴擊傷害 dodge 閃避 regen 每回合回血%
//   lifesteal 吸血 life 壽元 brk 突破率 stone 遊歷靈石% drop 掉落% evRate 奇遇頻率% offline 離線小時
//   pillEff 丹藥效果% toxRes 丹毒抗性 killXiu 擊殺得修為 techXp 功法精進% lateRate 壽元將盡時修煉% risk 突破失敗損失加倍
// 地階以上有屬性的功法，需要對應的靈根才能修
const TECHS = {
  // 吐納・黃階
  yinqi:   { name: '引氣訣', grade: 1, type: '吐納', elem: '無' },
  jin1:    { name: '礪鋒吐納法', grade: 1, type: '吐納', elem: '金', rate: .15, atk: .05 },
  qingmu:  { name: '青木長生訣', grade: 1, type: '吐納', elem: '木', rate: .15, life: 20 },
  shui1:   { name: '潺湲訣', grade: 1, type: '吐納', elem: '水', rate: .15, brk: .02 },
  huo1:    { name: '燃薪訣', grade: 1, type: '吐納', elem: '火', rate: .22 },
  tu1:     { name: '負土訣', grade: 1, type: '吐納', elem: '土', rate: .12, hp: .1 },
  lei1:    { name: '聞雷訣', grade: 1, type: '吐納', elem: '雷', rate: .2, crit: .02 },
  bing1:   { name: '凝露訣', grade: 1, type: '吐納', elem: '冰', rate: .15, dodge: .02 },
  feng1:   { name: '聽風訣', grade: 1, type: '吐納', elem: '風', rate: .15, spd: 2 },
  // 吐納・玄階
  gengjin: { name: '庚金劍經', grade: 2, type: '吐納', elem: '金', rate: .45, atk: .2 },
  mu2:     { name: '春藤化生功', grade: 2, type: '吐納', elem: '木', rate: .5, regen: .02 },
  liushui: { name: '流水心法', grade: 2, type: '吐納', elem: '水', rate: .5, brk: .06 },
  lieyang: { name: '烈陽焚心經', grade: 2, type: '吐納', elem: '火', rate: .9, risk: 1 },
  tu2:     { name: '重巒訣', grade: 2, type: '吐納', elem: '土', rate: .45, def: .2 },
  lei2:    { name: '奔雷引', grade: 2, type: '吐納', elem: '雷', rate: .6, crit: .05 },
  bing2:   { name: '寒潭照影經', grade: 2, type: '吐納', elem: '冰', rate: .5, dodge: .03 },
  feng2:   { name: '御風經', grade: 2, type: '吐納', elem: '風', rate: .5, spd: 4 },
  wu2:     { name: '抱樸守一訣', grade: 2, type: '吐納', elem: '無', rate: .4, toxRes: .2 },
  // 吐納・地階
  jin3:    { name: '太白斬星訣', grade: 3, type: '吐納', elem: '金', rate: 1.4, atk: .3, crit: .08 },
  mu3:     { name: '萬木朝春錄', grade: 3, type: '吐納', elem: '木', rate: 1.3, life: 60, regen: .03 },
  taiyin:  { name: '太陰化月錄', grade: 3, type: '吐納', elem: '水', rate: 1.3, life: 80, brk: .08 },
  jiuyao:  { name: '九曜焚天訣', grade: 3, type: '吐納', elem: '火', rate: 1.6, atk: .3 },
  tu3:     { name: '坤載萬物經', grade: 3, type: '吐納', elem: '土', rate: 1.2, hp: .4, def: .3 },
  lei3:    { name: '九霄驚蟄錄', grade: 3, type: '吐納', elem: '雷', rate: 1.7, crit: .1 },
  bing3:   { name: '千秋雪葬經', grade: 3, type: '吐納', elem: '冰', rate: 1.4, dodge: .06 },
  feng3:   { name: '扶搖九萬訣', grade: 3, type: '吐納', elem: '風', rate: 1.4, spd: 8 },
  wu3:     { name: '玄一歸真訣', grade: 3, type: '吐納', elem: '無', rate: 1.2, brk: .05, techXp: .2 },
  // 吐納・天階
  jin4:    { name: '斬天劍典', grade: 4, type: '吐納', elem: '金', rate: 2.8, atk: .6, crit: .15 },
  mu4:     { name: '建木通天錄', grade: 4, type: '吐納', elem: '木', rate: 2.6, life: 200, regen: .05 },
  shui4:   { name: '歸墟萬流經', grade: 4, type: '吐納', elem: '水', rate: 2.7, life: 100, brk: .12 },
  huo4:    { name: '焚世紅蓮經', grade: 4, type: '吐納', elem: '火', rate: 3, atk: .5 },
  tu4:     { name: '鎮世山河圖', grade: 4, type: '吐納', elem: '土', rate: 2.4, hp: .8, def: .6 },
  lei4:    { name: '天罰雷典', grade: 4, type: '吐納', elem: '雷', rate: 3.2, crit: .2 },
  bing4:   { name: '永夜冰河經', grade: 4, type: '吐納', elem: '冰', rate: 2.8, dodge: .1 },
  feng4:   { name: '無垠天風錄', grade: 4, type: '吐納', elem: '風', rate: 2.8, spd: 15 },
  hunyuan: { name: '混元歸一經', grade: 4, type: '吐納', elem: '無', rate: 2.6, hp: .5, atk: .5, def: .5, life: 150, brk: .1 },
  // 鍛體（體修主修）・黃玄地天
  duangu:  { name: '鍛骨訣', grade: 1, type: '鍛體', elem: '無' },
  d_jin1:  { name: '鐵衣訣', grade: 1, type: '鍛體', elem: '金', rate: .15, def: .08 },
  d_tu1:   { name: '搬山勁', grade: 1, type: '鍛體', elem: '土', rate: .12, hp: .12 },
  d_huo1:  { name: '熬血功', grade: 1, type: '鍛體', elem: '火', rate: .22, normalAtk: .1 },
  d_wu2:   { name: '龍象般若功', grade: 2, type: '鍛體', elem: '無', rate: .4, hp: .2, normalAtk: .15 },
  d_jin2:  { name: '金鐘罩', grade: 2, type: '鍛體', elem: '金', rate: .45, def: .25 },
  d_huo2:  { name: '赤血鍛身訣', grade: 2, type: '鍛體', elem: '火', rate: .6, atk: .1, regen: .01 },
  d_tu2:   { name: '磐岳功', grade: 2, type: '鍛體', elem: '土', rate: .45, hp: .3 },
  d_wu3:   { name: '九轉煉體訣', grade: 3, type: '鍛體', elem: '無', rate: 1.2, hp: .4, normalAtk: .3 },
  d_tu3:   { name: '不動明王身', grade: 3, type: '鍛體', elem: '土', rate: 1.2, hp: .3, def: .4 },
  d_lei3:  { name: '玄雷鍛骨經', grade: 3, type: '鍛體', elem: '雷', rate: 1.7, atk: .25, crit: .06 },
  d_wu4:   { name: '混沌不滅體', grade: 4, type: '鍛體', elem: '無', rate: 2.6, hp: .8, def: .5, normalAtk: .5 },
  d_huo4:  { name: '太古神魔煉體訣', grade: 4, type: '鍛體', elem: '火', rate: 3, atk: .5, normalAtk: .6 },
  // 觀想（魂修主修）・黃玄地天
  ningshen: { name: '凝神觀想法', grade: 1, type: '觀想', elem: '無' },
  g_shui1: { name: '觀水訣', grade: 1, type: '觀想', elem: '水', rate: .15, techXp: .05 },
  g_feng1: { name: '聽松觀想法', grade: 1, type: '觀想', elem: '風', rate: .15, crit: .02 },
  g_bing1: { name: '寒月觀想', grade: 1, type: '觀想', elem: '冰', rate: .15, shenUp: .05 },
  g_wu2:   { name: '明心見性經', grade: 2, type: '觀想', elem: '無', rate: .45, techXp: .15 },
  g_bing2: { name: '太陰觀想法', grade: 2, type: '觀想', elem: '冰', rate: .5, crit: .04, shenUp: .1 },
  g_lei2:  { name: '雷音觀想', grade: 2, type: '觀想', elem: '雷', rate: .6, crit: .05 },
  g_mu2:   { name: '青燈照影訣', grade: 2, type: '觀想', elem: '木', rate: .5, evRate: .1 },
  g_wu3:   { name: '大衍神念經', grade: 3, type: '觀想', elem: '無', rate: 1.2, shenUp: .25, crit: .06 },
  g_shui3: { name: '九幽鎮魂錄', grade: 3, type: '觀想', elem: '水', rate: 1.3, techXp: .25 },
  g_feng3: { name: '紫府觀星訣', grade: 3, type: '觀想', elem: '風', rate: 1.4, crit: .1 },
  g_wu4:   { name: '萬念歸一經', grade: 4, type: '觀想', elem: '無', rate: 2.6, shenUp: .5, crit: .15, techXp: .3 },
  g_feng4: { name: '太虛神遊經', grade: 4, type: '觀想', elem: '風', rate: 2.8, evRate: .3, crit: .12, shenUp: .3 },
  // 鍛體（原煉體，體修可主修，人人可輔修；輔修時不算修煉速度）
  tongpi:  { name: '銅皮功', grade: 1, type: '鍛體', elem: '無', rate: .12, hp: .15, def: .1 },
  panshi:  { name: '磐石功', grade: 1, type: '鍛體', elem: '無', rate: .12, hp: .25, def: .15, spd: -2 },
  longxiang: { name: '龍象鍛骨訣', grade: 2, type: '鍛體', elem: '無', rate: .4, hp: .35, atk: .1 },
  buhuai:  { name: '不壞金身', grade: 3, type: '鍛體', elem: '無', rate: 1.2, hp: .6, def: .4 },
  wanjie:  { name: '萬劫不滅體', grade: 4, type: '鍛體', elem: '無', rate: 2.6, hp: 1, def: .6, regen: .03 },
  // 輔修・身法
  tacao:   { name: '踏草無痕', grade: 1, type: '身法', elem: '無', spd: 3, dodge: .03 },
  liuyun:  { name: '流雲步', grade: 2, type: '身法', elem: '無', spd: 6, dodge: .06 },
  suodi:   { name: '縮地成寸', grade: 3, type: '身法', elem: '無', spd: 10, dodge: .1 },
  tianya:  { name: '天涯咫尺', grade: 4, type: '身法', elem: '無', spd: 18, dodge: .15 },
  // 輔修・劍修
  shijian: { name: '試劍篇', grade: 1, type: '劍修', elem: '無', atk: .1, crit: .05 },
  gufeng:  { name: '孤鋒劍意', grade: 2, type: '劍修', elem: '無', atk: .2, crit: .1, critDmg: .2 },
  xinjian: { name: '心劍通明錄', grade: 3, type: '劍修', elem: '無', atk: .3, crit: .15, critDmg: .4 },
  kaitian: { name: '一劍開天', grade: 4, type: '劍修', elem: '無', atk: .5, crit: .2, critDmg: .8 },
  // 輔修・長生
  guixi:   { name: '龜息法', grade: 1, type: '長生', elem: '無', life: 15 },
  songhe:  { name: '松鶴延年功', grade: 2, type: '長生', elem: '無', life: 40, regen: .01 },
  kurong:  { name: '枯榮輪轉經', grade: 3, type: '長生', elem: '無', life: 100, lateRate: .5 },
  changchun: { name: '不老長春訣', grade: 4, type: '長生', elem: '無', life: 300, lateRate: 1 },
  // 輔修・丹道
  baicao:  { name: '辨藥百草經', grade: 1, type: '丹道', elem: '無', pillEff: .15, toxRes: .1 },
  danhuo:  { name: '丹火心訣', grade: 2, type: '丹道', elem: '無', pillEff: .3, toxRes: .25 },
  jiuzhuan: { name: '九轉丹經', grade: 3, type: '丹道', elem: '無', pillEff: .5, toxRes: .4, brk: .03 },
  // 輔修・殺伐
  yizhan:  { name: '以戰養戰訣', grade: 2, type: '殺伐', elem: '無', killXiu: .003, atk: .05 },
  xiuluo:  { name: '修羅殺經', grade: 3, type: '殺伐', elem: '無', killXiu: .006, lifesteal: .05 },
  tushen:  { name: '屠神錄', grade: 4, type: '殺伐', elem: '無', killXiu: .01, lifesteal: .1, atk: .2 },
  // 輔修・悟性
  jingxin: { name: '靜心經', grade: 1, type: '悟性', elem: '無', techXp: .2 },
  mingjing: { name: '明鏡台', grade: 2, type: '悟性', elem: '無', techXp: .4, evRate: .1 },
  tianji:  { name: '天機推演術', grade: 3, type: '悟性', elem: '無', techXp: .6, brk: .05 },
  // 輔修・尋寶
  xunlong: { name: '尋龍點穴術', grade: 1, type: '尋寶', elem: '無', stone: .2, drop: .2 },
  hongyun: { name: '鴻運當頭', grade: 2, type: '尋寶', elem: '無', stone: .35, drop: .4, evRate: .2 },
  dongtian: { name: '洞天福地記', grade: 3, type: '尋寶', elem: '無', offline: 3, stone: .3 },
  jubao:   { name: '聚寶錄', grade: 4, type: '尋寶', elem: '無', stone: .8, drop: .8 },
  // ---------- 宗門專屬功法（只能用宗門貢獻換） ----------
  lingxiaojue: { name: '凌霄劍訣', grade: 3, type: '劍修', elem: '無', sect: 1, atk: .45, crit: .15, critDmg: .5 },
  baicaogy: { name: '百草歸元經', grade: 3, type: '丹道', elem: '無', sect: 1, pillEff: .7, toxRes: .6, regen: .02 },
  jingangbh: { name: '金剛不壞經', grade: 3, type: '鍛體', elem: '無', sect: 1, rate: 1.2, hp: .8, def: .5 },
  guanshenlu: { name: '觀神秘錄', grade: 3, type: '悟性', elem: '無', sect: 1, techXp: .9, shenUp: .2 },
  taiqingxy: { name: '太清玄元功', grade: 3, type: '吐納', elem: '無', sect: 1, rate: 1.5, mp: .3 },
  // ---------- 輔修擴充（每類每階至少 3 部） ----------
  tiegu: { name: '鐵骨功', grade: 1, type: '鍛體', elem: '無', rate: .12, hp: .1, def: .15, regen: .005 },
  lianxue: { name: '煉血功', grade: 2, type: '鍛體', elem: '無', rate: .4, hp: .3, regen: .01 },
  huxiao: { name: '虎嘯鍛身訣', grade: 2, type: '鍛體', elem: '無', rate: .4, hp: .25, atk: .12 },
  longlin: { name: '龍鱗寶體', grade: 3, type: '鍛體', elem: '無', rate: 1.2, hp: .5, def: .5 },
  jiuxue: { name: '九血淬體訣', grade: 3, type: '鍛體', elem: '無', rate: 1.2, hp: .7, regen: .02, spd: -3 },
  xingdou: { name: '星斗鍛體經', grade: 4, type: '鍛體', elem: '無', rate: 2.6, hp: .8, def: .8 },
  taichu: { name: '太初聖體訣', grade: 4, type: '鍛體', elem: '無', rate: 2.6, hp: 1.2, atk: .2, def: .4 },
  qingyan: { name: '輕煙步', grade: 1, type: '身法', elem: '無', spd: 4, dodge: .02 },
  yanzi: { name: '燕歸巢', grade: 1, type: '身法', elem: '無', spd: 2, dodge: .04 },
  mizong: { name: '迷蹤幻影', grade: 2, type: '身法', elem: '無', spd: 5, dodge: .08 },
  zhuifeng: { name: '追風逐電', grade: 2, type: '身法', elem: '無', spd: 9, dodge: .03 },
  qianhuan: { name: '千幻身', grade: 3, type: '身法', elem: '無', spd: 8, dodge: .13 },
  xuying: { name: '虛影遁形', grade: 3, type: '身法', elem: '無', spd: 14, dodge: .07 },
  qianshan: { name: '一步千山', grade: 4, type: '身法', elem: '無', spd: 22, dodge: .1 },
  wuxiangshen: { name: '無相幻身', grade: 4, type: '身法', elem: '無', spd: 14, dodge: .2 },
  jianqi: { name: '劍氣初成', grade: 1, type: '劍修', elem: '無', atk: .08, critDmg: .2 },
  mojian: { name: '磨劍訣', grade: 1, type: '劍修', elem: '無', atk: .14 },
  qingming: { name: '青冥劍訣', grade: 2, type: '劍修', elem: '無', atk: .25, crit: .08 },
  zhanxin: { name: '斬心劍譜', grade: 2, type: '劍修', elem: '無', atk: .15, critDmg: .4 },
  jianyu: { name: '劍雨流光錄', grade: 3, type: '劍修', elem: '無', atk: .35, crit: .12, critDmg: .3 },
  jianxinbm: { name: '劍心不滅經', grade: 3, type: '劍修', elem: '無', atk: .25, crit: .2, critDmg: .5 },
  duanjie: { name: '斷劫劍典', grade: 4, type: '劍修', elem: '無', atk: .6, crit: .15, critDmg: .6 },
  wentian: { name: '劍問蒼天', grade: 4, type: '劍修', elem: '無', atk: .4, crit: .25, critDmg: 1 },
  yangsheng: { name: '養生訣', grade: 1, type: '長生', elem: '無', life: 10, regen: .005 },
  shouyi: { name: '守一功', grade: 1, type: '長生', elem: '無', life: 20 },
  guiling: { name: '龜齡秘錄', grade: 2, type: '長生', elem: '無', life: 60 },
  chunfeng: { name: '春風化雨訣', grade: 2, type: '長生', elem: '無', life: 30, lateRate: .2 },
  qianzai: { name: '千載長青功', grade: 3, type: '長生', elem: '無', life: 150 },
  nisui: { name: '逆歲還真經', grade: 3, type: '長生', elem: '無', life: 80, lateRate: .4, regen: .02 },
  wanshou: { name: '萬壽無疆經', grade: 4, type: '長生', elem: '無', life: 500 },
  yongsheng: { name: '永生不朽訣', grade: 4, type: '長生', elem: '無', life: 250, lateRate: .8, regen: .03 },
  shiyao: { name: '識藥訣', grade: 1, type: '丹道', elem: '無', pillEff: .1, toxRes: .15 },
  konghuo: { name: '控火入門', grade: 1, type: '丹道', elem: '無', pillEff: .2 },
  linghuo: { name: '靈火訣', grade: 2, type: '丹道', elem: '無', pillEff: .25, toxRes: .3 },
  baidu: { name: '百毒經', grade: 2, type: '丹道', elem: '無', toxRes: .5 },
  danxinlu: { name: '丹心錄', grade: 3, type: '丹道', elem: '無', pillEff: .6, toxRes: .3 },
  ningdan: { name: '凝丹秘要', grade: 3, type: '丹道', elem: '無', pillEff: .4, toxRes: .5, life: 30 },
  danzu: { name: '丹祖手札', grade: 4, type: '丹道', elem: '無', pillEff: 1, toxRes: .6 },
  jiuding: { name: '九鼎丹經', grade: 4, type: '丹道', elem: '無', pillEff: .8, toxRes: .5, brk: .05 },
  yaoshen: { name: '藥神寶典', grade: 4, type: '丹道', elem: '無', pillEff: .7, toxRes: .8, regen: .02 },
  xuezhan: { name: '血戰訣', grade: 1, type: '殺伐', elem: '無', killXiu: .0015, atk: .05 },
  shayi: { name: '殺意初生', grade: 1, type: '殺伐', elem: '無', atk: .08, crit: .03 },
  tunxue: { name: '吞血功', grade: 1, type: '殺伐', elem: '無', lifesteal: .03 },
  bailian: { name: '百戰鍛心訣', grade: 2, type: '殺伐', elem: '無', killXiu: .004, hp: .1 },
  xueyin: { name: '血飲狂刀譜', grade: 2, type: '殺伐', elem: '無', lifesteal: .06, atk: .1 },
  shalu: { name: '殺戮道經', grade: 3, type: '殺伐', elem: '無', killXiu: .008, atk: .15 },
  zhanshen: { name: '戰神錄', grade: 3, type: '殺伐', elem: '無', atk: .25, lifesteal: .06, crit: .05 },
  mieshi: { name: '滅世殺典', grade: 4, type: '殺伐', elem: '無', killXiu: .015, atk: .3 },
  xuehai: { name: '血海無涯經', grade: 4, type: '殺伐', elem: '無', lifesteal: .15, hp: .3, killXiu: .008 },
  qiming: { name: '啟明訣', grade: 1, type: '悟性', elem: '無', techXp: .15, evRate: .05 },
  guanxin: { name: '觀心法', grade: 1, type: '悟性', elem: '無', techXp: .25 },
  chanding: { name: '禪定經', grade: 2, type: '悟性', elem: '無', techXp: .5 },
  tongxuanxf: { name: '通玄心法', grade: 2, type: '悟性', elem: '無', techXp: .3, brk: .02 },
  huiguang: { name: '慧光普照', grade: 3, type: '悟性', elem: '無', techXp: .8 },
  xuanji: { name: '玄機妙算', grade: 3, type: '悟性', elem: '無', techXp: .5, brk: .04, evRate: .1 },
  tiandaolu: { name: '天道感悟錄', grade: 4, type: '悟性', elem: '無', techXp: 1.2, brk: .05 },
  wanfa: { name: '萬法通明經', grade: 4, type: '悟性', elem: '無', techXp: .9, brk: .08 },
  zhihui: { name: '大智慧經', grade: 4, type: '悟性', elem: '無', techXp: 1, evRate: .3 },
  kanbao: { name: '堪寶術', grade: 1, type: '尋寶', elem: '無', drop: .3 },
  jucai: { name: '聚財訣', grade: 1, type: '尋寶', elem: '無', stone: .3 },
  tanbao: { name: '探寶秘錄', grade: 2, type: '尋寶', elem: '無', drop: .5, stone: .1 },
  lingshu: { name: '靈鼠尋蹤術', grade: 2, type: '尋寶', elem: '無', stone: .4, evRate: .1 },
  xunxian: { name: '尋仙問寶錄', grade: 3, type: '尋寶', elem: '無', drop: .8, stone: .3 },
  soluo: { name: '乾坤搜羅訣', grade: 3, type: '尋寶', elem: '無', stone: .7, drop: .3 },
  tianfu: { name: '天府藏珍經', grade: 4, type: '尋寶', elem: '無', stone: 1, drop: .6, evRate: .2 },
  jixing: { name: '吉星高照錄', grade: 4, type: '尋寶', elem: '無', drop: 1.2, stone: .5 },
};
const NO_SCALE = ['life', 'brk', 'offline', 'risk'];
const EFF_LABEL = { rate: '修煉', hp: '氣血', mp: '法力', skillUp: '術法威力', faUp: '法術威力', hunUp: '神魂術威力', shenUp: '神通威力', normalAtk: '普通攻擊', atk: '攻擊', def: '防禦', spd: '身法', crit: '暴擊', critDmg: '暴傷', dodge: '閃避', regen: '每回合回血', lifesteal: '吸血', life: '壽元', brk: '突破率', stone: '遊歷靈石', drop: '掉落', evRate: '奇遇', offline: '離線上限', pillEff: '丹藥效果', toxRes: '丹毒抗性', killXiu: '擊殺得修為', techXp: '功法精進', lateRate: '壽元將盡時修煉', lifePct: '壽元', risk: '突破失敗損失加倍' };
const FLAT_EFF = ['spd', 'life', 'offline'];   // 這些顯示成數字，其他顯示成百分比

// ---------- 丹藥 ----------
// kind：xiu 修為丹（major 對應的大境界）、brk 突破丹、heal 療傷、mp 回氣、life 延壽、body 洗髓、tech 悟道、tc 天材地寶
const ITEMS = {
  heal:     { name: '療傷丹', kind: 'heal', desc: '立刻治好傷勢。' },
  huiqi:    { name: '回氣丹', kind: 'mp', desc: '戰鬥中法力不夠又傷到一半時自動服用，回復六成法力。每場最多一顆。' },
  juqi:     { name: '聚氣丹', kind: 'xiu', major: 0, desc: '練氣期的修為丹。' },
  peiyuan:  { name: '培元丹', kind: 'xiu', major: 1, desc: '築基期的修為丹。' },
  jinsui:   { name: '金髓丹', kind: 'xiu', major: 2, desc: '金丹期的修為丹。' },
  yanghun:  { name: '養魂丹', kind: 'xiu', major: 3, desc: '元嬰期的修為丹。' },
  taiqing:  { name: '太清丹', kind: 'xiu', major: 4, desc: '化神期的修為丹。' },
  ningxu:   { name: '凝虛丹', kind: 'xiu', major: 5, desc: '煉虛期的修為丹。' },
  hedao:    { name: '合道丹', kind: 'xiu', major: 6, desc: '合體期的修為丹。' },
  wanxiangdan: { name: '萬象丹', kind: 'xiu', major: 7, desc: '大乘期的修為丹。' },
  due:      { name: '渡厄丹', kind: 'xiu', major: 8, desc: '渡劫期的修為丹。' },
  zhuji:    { name: '築基丹', kind: 'brk', major: 0, desc: '練氣九層突破築基時自動服用。' },
  ningyuan: { name: '凝元丹', kind: 'brk', major: 1, desc: '築基後期突破金丹時自動服用。' },
  huaying:  { name: '化嬰丹', kind: 'brk', major: 2, desc: '金丹後期突破元嬰時自動服用。' },
  tongxuan: { name: '通玄丹', kind: 'brk', major: 3, desc: '元嬰後期突破化神時自動服用。' },
  poxu:     { name: '破虛丹', kind: 'brk', major: 4, desc: '化神後期突破煉虛時自動服用。' },
  heyuan:   { name: '合元丹', kind: 'brk', major: 5, desc: '煉虛後期突破合體時自動服用。' },
  dacheng:  { name: '大成丹', kind: 'brk', major: 6, desc: '合體後期突破大乘時自動服用。' },
  yinjie:   { name: '引劫丹', kind: 'brk', major: 7, desc: '大乘後期突破渡劫時自動服用。' },
  yanshou:  { name: '延壽丹', kind: 'life', desc: '壽元 +15 年，有丹毒。' },
  xisui:    { name: '洗髓丹', kind: 'body', desc: '這一世氣血、攻擊、防禦永久 +3%，有丹毒。' },
  wudao:    { name: '悟道丹', kind: 'tech', desc: '主修功法立刻精進 10 分鐘的進度（主修圓滿了就平分給輔修）。' },
  // 天材地寶（major 是從哪個大境界往上衝時用）：衝大境界時自動使用，沒有它品質最多上品
  xuanhuang: { name: '玄黃地乳', kind: 'tc', major: 0, desc: '地脈深處凝出的靈乳。突破築基時自動使用，才有機會成就無瑕道基。' },
  chiyang:   { name: '赤陽丹砂', kind: 'tc', major: 1, desc: '至陽之地千年才結一粒。突破金丹時自動使用，才有機會結成九竅金丹。' },
  ninghun:   { name: '凝魂玉露', kind: 'tc', major: 2, desc: '能凝住魂魄的露水。突破元嬰時自動使用，才有機會引來萬象來朝。' },
  shenmu:    { name: '神木之心', kind: 'tc', major: 3, desc: '上古神木枯死後留下的木心。突破化神時自動使用，才有機會凝出不滅法相。' },
  xukong:    { name: '虛空晶核', kind: 'tc', major: 4, desc: '虛空裂隙裡凝結的晶核。突破煉虛時自動使用，才有機會凝出不滅法相。' },
  liangyi:   { name: '兩儀泉', kind: 'tc', major: 5, desc: '一半冰冷一半滾燙的泉水。突破合體時自動使用，才有機會凝出不滅法相。' },
  jiujie:    { name: '九劫金蓮', kind: 'tc', major: 6, desc: '熬過九次天劫才開的蓮花。突破大乘時自動使用，才有機會凝出不滅法相。' },
  tianxin:   { name: '天心石', kind: 'tc', major: 7, desc: '據說是天道落下的一塊石頭。突破渡劫時自動使用，才有機會凝出不滅法相。' },
};
// 五行之精：煉化後靈根多一個屬性（kind 'root'，elem 是哪個屬性）
Object.assign(ITEMS, {
  gengjing:  { name: '庚金之精', kind: 'root', elem: '金', desc: '煉化後靈根多一道金屬性。靈根越雜修煉越慢，但五行齊全、踏入化神後可得五行圓滿。' },
  yimujing:  { name: '乙木之精', kind: 'root', elem: '木', desc: '煉化後靈根多一道木屬性。靈根越雜修煉越慢，但五行齊全、踏入化神後可得五行圓滿。' },
  guishuijing: { name: '癸水之精', kind: 'root', elem: '水', desc: '煉化後靈根多一道水屬性。靈根越雜修煉越慢，但五行齊全、踏入化神後可得五行圓滿。' },
  binghuojing: { name: '丙火之精', kind: 'root', elem: '火', desc: '煉化後靈根多一道火屬性。靈根越雜修煉越慢，但五行齊全、踏入化神後可得五行圓滿。' },
  wutujing:  { name: '戊土之精', kind: 'root', elem: '土', desc: '煉化後靈根多一道土屬性。靈根越雜修煉越慢，但五行齊全、踏入化神後可得五行圓滿。' },
});
// 雜丹（kind 'dan'）：fx 效果代號、base 基礎價（隨境界漲）、tox 丹毒、dur 限時秒數（有的話是限時藥效）、rare 珍品（只在坊市珍品格出現）
Object.assign(ITEMS, {
  guben:      { name: '固本丹', kind: 'dan', fx: 'guben', base: 120, tox: 20, desc: '根基 +10%（最多 30%），提高大境界突破率和突破品質。' },
  julingdan:  { name: '聚靈丹', kind: 'dan', fx: 'buff', dur: 600, base: 100, tox: 10, desc: '接下來 10 分鐘修煉速度 +50%。' },
  qizhidan:   { name: '啟智丹', kind: 'dan', fx: 'buff', dur: 600, base: 100, tox: 10, desc: '接下來 10 分鐘功法精進 ×2。' },
  kuangxue:   { name: '狂血丹', kind: 'dan', fx: 'buff', dur: 600, base: 80, tox: 10, desc: '接下來 10 分鐘攻擊 +30%，但防禦 -10%。' },
  jingangdan: { name: '金剛丹', kind: 'dan', fx: 'buff', dur: 600, base: 80, tox: 10, desc: '接下來 10 分鐘防禦 +40%。' },
  ningshendan: { name: '凝神丹', kind: 'dan', fx: 'buff', dur: 600, base: 80, tox: 10, desc: '接下來 10 分鐘法力上限 +50%。' },
  huichundan: { name: '回春丹', kind: 'dan', fx: 'huichun', base: 60, tox: 0, desc: '立刻回滿氣血和法力（療傷丹治的是負傷）。' },
  qingxindan: { name: '清心丹', kind: 'dan', fx: 'qingxin', base: 80, tox: 0, desc: '丹毒 -30%，本身沒有丹毒。' },
  yinyuan:    { name: '引緣丹', kind: 'dan', fx: 'buff', dur: 600, base: 100, tox: 10, desc: '接下來 10 分鐘奇遇頻率 ×2。' },
  xunbaodan:  { name: '尋寶丹', kind: 'dan', fx: 'buff', dur: 600, base: 100, tox: 10, desc: '接下來 10 分鐘掉落機率 ×2。' },
  pozhang:    { name: '破障丹', kind: 'dan', fx: 'pozhang', rare: 1, base: 150, tox: 0, desc: '下一次小境界突破必定成功。' },
  humai:      { name: '護脈丹', kind: 'dan', fx: 'humai', rare: 1, base: 400, tox: 0, desc: '下一次大境界突破失敗時不折壽、不跌境，只散去修為。' },
  zhuyan:     { name: '駐顏丹', kind: 'dan', fx: 'zhuyan', rare: 1, base: 500, tox: 30, desc: '年齡 -10 歲（延壽丹加的是壽元上限，這個是把歲月倒回去）。' },
  xingshen:   { name: '醒神丹', kind: 'dan', fx: 'xingshen', rare: 1, base: 300, tox: 0, desc: '下一場戰鬥，每門神通可以發動兩次。' },
  tianjidan:  { name: '天機丹', kind: 'dan', fx: 'tianji', rare: 1, base: 250, tox: 0, desc: '下一次坊市換貨，功法、術法、法寶的第一格都保證地階以上（築基中期起）。' },
});
// 材料（kind 'mat'）：靈草煉丹、礦材煉器，黃玄地天四階
Object.assign(ITEMS, {
  qingling:  { name: '青靈草', kind: 'mat', mat: 'herb', grade: 1, desc: '山野常見的靈草，煉黃階丹藥用。' },
  ziyunzhi:  { name: '紫雲芝', kind: 'mat', mat: 'herb', grade: 2, desc: '長在雲霧裡的靈芝，煉玄階丹藥用。' },
  xueyushen: { name: '血玉參', kind: 'mat', mat: 'herb', grade: 3, desc: '通體血紅的老參，煉地階丹藥用。' },
  jiuyezhi:  { name: '九葉龍芝', kind: 'mat', mat: 'herb', grade: 4, desc: '九片葉子、形如盤龍的仙芝，煉天階丹藥用。' },
  tiejing:   { name: '鐵精', kind: 'mat', mat: 'ore', grade: 1, desc: '百煉之後剩下的一點精鐵，煉黃階法寶用。' },
  xuanbingtie: { name: '玄冰鐵', kind: 'mat', mat: 'ore', grade: 2, desc: '寒潭底下撈出來的鐵，摸上去會冒白氣，煉玄階法寶用。' },
  chijinsha: { name: '赤金砂', kind: 'mat', mat: 'ore', grade: 3, desc: '地火燒了千年的金砂，煉地階法寶用。' },
  xingchengang: { name: '星辰鋼', kind: 'mat', mat: 'ore', grade: 4, desc: '天外隕星裡的鋼，煉天階法寶用。' },
});
const MAT_HERB = [null, 'qingling', 'ziyunzhi', 'xueyushen', 'jiuyezhi'];
const MAT_ORE = [null, 'tiejing', 'xuanbingtie', 'chijinsha', 'xingchengang'];
const MAT_PRICE = [0, 30, 300, 3000, 20000];
// 丹方：g 品階（決定用哪階靈草、出爐時間、基礎成功率），n 要幾份靈草；黃階丹方生來就會，其他要找
const RECIPES = {
  heal: { g: 1, n: 2 }, huiqi: { g: 1, n: 2 }, julingdan: { g: 1, n: 3 }, qizhidan: { g: 1, n: 3 }, kuangxue: { g: 1, n: 3 }, jingangdan: { g: 1, n: 3 },
  ningshendan: { g: 1, n: 3 }, huichundan: { g: 1, n: 2 }, qingxindan: { g: 1, n: 3 },
  guben: { g: 2, n: 3 }, yinyuan: { g: 2, n: 3 }, xunbaodan: { g: 2, n: 3 }, yanshou: { g: 2, n: 4 }, wudao: { g: 2, n: 3 },
  xisui: { g: 3, n: 4 }, pozhang: { g: 3, n: 4 }, humai: { g: 3, n: 5 }, xingshen: { g: 3, n: 4 }, tianjidan: { g: 3, n: 4 }, zhuyan: { g: 4, n: 5 },
};
// 修為丹、突破丹：品階跟著大境界（練氣黃、築基金丹玄、元嬰化神地、煉虛以上天）
const majorGrade = mj => mj === 0 ? 1 : mj <= 2 ? 2 : mj <= 4 ? 3 : 4;
const DAN_COMMON = ['yanshou', 'xisui', 'wudao', 'guben', 'julingdan', 'qizhidan', 'kuangxue', 'jingangdan', 'ningshendan', 'huichundan', 'qingxindan', 'yinyuan', 'xunbaodan'];
const DAN_RARE = ['pozhang', 'humai', 'zhuyan', 'xingshen', 'tianjidan'];
const ROOT_ITEMS = ['gengjing', 'yimujing', 'guishuijing', 'binghuojing', 'wutujing'];
const TC_ITEMS = ['xuanhuang', 'chiyang', 'ninghun', 'shenmu', 'xukong', 'liangyi', 'jiujie', 'tianxin'];
const XIU_PILLS = ['juqi', 'peiyuan', 'jinsui', 'yanghun', 'taiqing', 'ningxu', 'hedao', 'wanxiangdan', 'due'];
const BRK_PILLS = ['zhuji', 'ningyuan', 'huaying', 'tongxuan', 'poxu', 'heyuan', 'dacheng', 'yinjie'];
for (let i = 0; i < XIU_PILLS.length; i++) RECIPES[XIU_PILLS[i]] = { g: majorGrade(i), n: 3 };
for (let i = 0; i < BRK_PILLS.length; i++) RECIPES[BRK_PILLS[i]] = { g: majorGrade(i), n: 6 };
const BREW_SEC = [0, 10, 20, 40, 60];          // 出爐時間（秒）
const BREW_RATE = [0, .8, .65, .5, .35];       // 基礎成功率
const ALCH_RANK = ['學徒', '丹師', '大師', '宗師'], ALCH_NEED = [0, 20, 100, 400];   // 煉丹術等級與經驗門檻
const BREW_XP = [0, 1, 3, 8, 20];
// 煉器：選部位和品階，出爐隨機得到一件還沒有的法寶；品質決定出爐時的祭煉重數
const FORGE_ORE = [0, 3, 4, 5, 6];             // 要幾份同階礦材
const FORGE_RANK = ['學徒', '器師', '大師', '宗師'];
// 陣法：佈在洞府裡，洞府 0／3／5／8 級各開一座陣位；每座最多 4 級，第 N 級要 N 階材料 5 份（藥園用靈草，其他用礦材）和靈石
const ARRAYS = {
  juling:   { name: '聚靈陣', desc: l => `修煉速度 +${8 * l}%` },
  yaoyuan:  { name: '藥園陣', desc: l => `每 ${ARRAY_GROW[l]} 秒長出一份靈草，最高${GRADES[l]}` },
  kuangmai: { name: '礦脈陣', desc: l => `每 ${ARRAY_GROW[l]} 秒採出一份礦材，最高${GRADES[l]}` },
  danshi:   { name: '丹室陣', desc: l => `煉丹成功率 +${5 * l}%，出爐快 ${15 * l}%` },
  dihuo:    { name: '地火陣', desc: l => `煉器成功率 +${5 * l}%，出爐快 ${15 * l}%` },
  hushan:   { name: '護山陣', desc: l => `離線修煉效率 +${10 * l}%` },
};
const ARRAY_SLOT_CAVE = [0, 3, 5, 8];
const ARRAY_GROW = [0, 90, 60, 40, 30];
const ARRAY_STONE = [0, 250, 3000, 30000, 180000];
const BRK_PILL_PRICE = [600, 6000, 40000, 120000, 400000, 1.2e6, 4e6, 1.2e7];
const BRK_PILL_BONUS = [.15, .1, .05, .05];   // 第 1～4 顆的效果（第 4 顆要悟道樹「海量」）

// ---------- 遊歷地點 ----------
// min 最低境界、lv 敵人相當於第幾個小境界、mult 敵人強度倍率、foes [名字, 屬性]、grades 掉落功法、術法、法寶的品階
const PLACES = [
  { id: 'bamboo', name: '青竹林', min: 0, lv: 1, mult: .9, foes: [['赤目山豬', '火'], ['青鱗蛇', '木'], ['灰背狼', '風']], grades: [1] },
  { id: 'wind', name: '黑風嶺', min: 6, lv: 9, mult: 1, foes: [['黑風寨匪修', '風'], ['鐵甲蜈蚣', '金'], ['獨眼妖猿', '土']], grades: [1, 2] },
  { id: 'field', name: '古戰場', min: 10, lv: 14, mult: 1.2, foes: [['遊蕩陰兵', '冰'], ['白骨將', '金'], ['無主怨魂', '水']], grades: [2, 3] },
  { id: 'star', name: '葬星秘境', min: 15, lv: 19, mult: 1.6, foes: [['守境石傀', '土'], ['星紋蛟', '雷'], ['墮落劍修', '金']], grades: [3, 4] },
  { id: 'rift', name: '虛空裂隙', min: 21, lv: 24, mult: 2.1, foes: [['裂隙蟲群', '風'], ['噬虛魔', '雷'], ['迷途古修', '冰']], grades: [3, 4] },
  { id: 'ruin', name: '上古神戰遺址', min: 26, lv: 29, mult: 2.8, foes: [['殘缺神傀', '金'], ['古神殘念', '火'], ['太古凶獸', '土']], grades: [4] },
];

// ---------- 坊市 ----------
const SHOP_REFRESH = 600;          // 秒，貨架自動換貨
const SHOP_PER = 4;   // 坊市每一類（功法、術法、法寶、丹藥）擺幾格
const TECH_PRICE = [0, 200, 2500, 25000, 150000];
const GRADE_MIN_STAGE = [0, 0, 4, 10, 15];         // 坊市開始賣這個品階的境界
const GRADE_WEIGHT = [0, 50, 30, 12, 3];
