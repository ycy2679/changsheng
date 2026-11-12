// 長生閒記：境界、靈根、功法、丹藥、地點、坊市（武技、法寶、體質在 gear.js）

// 大境界：life 壽元（年）、brk 突破到下一個大境界的基礎成功率
const MAJORS = [
  { name: '練氣', subs: ['一層', '二層', '三層', '四層', '五層', '六層', '七層', '八層', '九層'], life: 100, brk: .5 },
  { name: '築基', subs: ['初期', '中期', '後期'], life: 220, brk: .38 },
  { name: '金丹', subs: ['初期', '中期', '後期'], life: 450, brk: .27 },
  { name: '元嬰', subs: ['初期', '中期', '後期'], life: 900, brk: .18 },
  { name: '化神', subs: ['初期', '中期', '後期'], life: 1800, brk: .15 },
  { name: '煉虛', subs: ['初期', '中期', '後期'], life: 3600, brk: .12 },
  { name: '合體', subs: ['初期', '中期', '後期'], life: 7000, brk: .09 },
  { name: '大乘', subs: ['初期', '中期', '後期'], life: 15000, brk: .06 },
  { name: '渡劫', subs: ['初期', '中期', '後期'], life: 30000, brk: 0 },   // 渡劫後期之後是飛升，等成仙時再做
];

// 攤平成 33 個小境界，need = 修為上限
const STAGES = [];
MAJORS.forEach((m, mi) => m.subs.forEach(sub => STAGES.push({ major: mi, name: m.name + sub })));
STAGES.forEach((s, i) => { s.need = Math.round(80 * Math.pow(1.72, i)); });

const GRADES = ['', '黃階', '玄階', '地階', '天階'];

// ---------- 屬性 ----------
const FIVE = ['金', '木', '水', '火', '土'];
const MUTANT = ['雷', '冰', '風'];
// 相剋：攻方屬性剋守方時傷害 ×1.3，被剋時 ×0.75
const COUNTERS = { 金: ['木', '風'], 木: ['土'], 水: ['火'], 火: ['金', '冰'], 土: ['水', '雷'], 雷: ['水'], 冰: ['木'], 風: ['土'] };

// ---------- 靈根：每一世開局隨機抽 ----------
// n 幾種屬性、pool 從哪些屬性抽、w 權重、rate 修煉倍率、aff 親和屬性武技加成、good 道心越高越容易抽到
const ROOT_TYPES = [
  { id: 'heaven', name: '天靈根', n: 1, pool: FIVE, w: 4, rate: 1.6, aff: .4, good: 1 },
  { id: 'mutant', name: '變異靈根', n: 1, pool: MUTANT, w: 2, rate: 1.7, aff: .5, good: 1 },
  { id: 'void', name: '空靈根', n: 0, pool: [], w: 2, rate: 1.4, aff: .5, good: 1, desc: '不沾任何屬性：無屬性武技 +50%，也不受相剋影響。' },
  { id: 'dual', name: '雙靈根', n: 2, pool: FIVE, w: 14, rate: 1.3, aff: .2, good: 1 },
  { id: 'triple', name: '三靈根', n: 3, pool: FIVE, w: 30, rate: 1.1, aff: .1 },
  { id: 'quad', name: '四靈根', n: 4, pool: FIVE, w: 28, rate: 1, aff: 0 },
  { id: 'five', name: '五靈根', n: 5, pool: FIVE, w: 20, rate: .85, aff: 0 },
];

// ---------- 功法 ----------
// type：吐納 = 主修（決定修煉速度和屬性），其他都是輔修
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
  // 輔修・煉體
  tongpi:  { name: '銅皮功', grade: 1, type: '煉體', elem: '無', hp: .15, def: .1 },
  panshi:  { name: '磐石功', grade: 1, type: '煉體', elem: '無', hp: .25, def: .15, spd: -2 },
  longxiang: { name: '龍象鍛骨訣', grade: 2, type: '煉體', elem: '無', hp: .35, atk: .1 },
  buhuai:  { name: '不壞金身', grade: 3, type: '煉體', elem: '無', hp: .6, def: .4 },
  wanjie:  { name: '萬劫不滅體', grade: 4, type: '煉體', elem: '無', hp: 1, def: .6, regen: .03 },
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
};
const NO_SCALE = ['life', 'brk', 'offline', 'risk'];
const EFF_LABEL = { rate: '修煉', hp: '氣血', atk: '攻擊', def: '防禦', spd: '身法', crit: '暴擊', critDmg: '暴傷', dodge: '閃避', regen: '每回合回血', lifesteal: '吸血', life: '壽元', brk: '突破率', stone: '遊歷靈石', drop: '掉落', evRate: '奇遇', offline: '離線上限', pillEff: '丹藥效果', toxRes: '丹毒抗性', killXiu: '擊殺得修為', techXp: '功法精進', lateRate: '壽元將盡時修煉', lifePct: '壽元', risk: '突破失敗損失加倍' };
const FLAT_EFF = ['spd', 'life', 'offline'];   // 這些顯示成數字，其他顯示成百分比

// ---------- 丹藥 ----------
// kind：xiu 修為丹（major 對應的大境界）、brk 突破丹、heal 療傷、mp 回氣、life 延壽、body 洗髓、tech 悟道
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
  wudao:    { name: '悟道丹', kind: 'tech', desc: '主修功法立刻精進 10 分鐘的進度。' },
};
const XIU_PILLS = ['juqi', 'peiyuan', 'jinsui', 'yanghun', 'taiqing', 'ningxu', 'hedao', 'wanxiangdan', 'due'];
const BRK_PILLS = ['zhuji', 'ningyuan', 'huaying', 'tongxuan', 'poxu', 'heyuan', 'dacheng', 'yinjie'];
const BRK_PILL_PRICE = [600, 6000, 40000, 120000, 400000, 1.2e6, 4e6, 1.2e7];
const BRK_PILL_BONUS = [.15, .1, .05, .05];   // 第 1～4 顆的效果（第 4 顆要悟道樹「海量」）

// ---------- 遊歷地點 ----------
// min 最低境界、lv 敵人相當於第幾個小境界、mult 敵人強度倍率、foes [名字, 屬性]、grades 掉落功法、武技、法寶的品階
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
const SHOP_SLOTS = 8;
const TECH_PRICE = [0, 200, 2500, 25000, 150000];
const GRADE_MIN_STAGE = [0, 0, 4, 10, 15];         // 坊市開始賣這個品階的境界
const GRADE_WEIGHT = [0, 50, 30, 12, 3];
