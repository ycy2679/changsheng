// 長生閒記：術法、法寶、體質

// ---------- 術法 ----------
// kind：dmg 攻擊 / multi 連擊（hits 段，每段 pow）/ heal 回血 / shield 護盾 / dodge 身法 / charge 蓄力（下一招威力 ×2）
//       buff 增益（3 回合攻擊 +15%×威力）/ mana 回法（回復 20%×威力 的法力）
// 附加：burn 灼燒（每回合攻擊力的比例，3 回合）freeze 冰凍機率 stun 麻痺機率（敵人跳過一回合）
//       brk 破防（敵人防禦降低，3 回合）drain 吸血 reflect 反震（3 回合內把受到的傷害反彈一部分）
const K = (name, grade, elem, kind, pow, cd, ex = {}) => ({ name, grade, elem, kind, pow, cd, ...ex });
const SKILLS = {
  // 無
  qijin:    K('氣勁', 1, '無', 'dmg', 1.4, 3),
  kaibei:   K('開碑掌', 1, '無', 'dmg', 1.8, 3, { brk: .15 }),
  lianhuan: K('連環拳', 1, '無', 'multi', .6, 3, { hits: 3 }),
  guiyuan:  K('歸元護體', 2, '無', 'shield', 1.4, 5),
  ningshen: K('凝神一擊', 2, '無', 'charge', 0, 4),
  dayan:    K('大衍掌', 2, '無', 'dmg', 2.4, 4),
  xueying:  K('血影步', 3, '無', 'dodge', 1.6, 4),
  wanxiang: K('萬象天引', 3, '無', 'dmg', 3, 4, { drain: .2 }),
  poxu:     K('破虛指', 4, '無', 'dmg', 4.5, 5, { brk: .3 }),
  hunyi:    K('混元一氣', 4, '無', 'shield', 2.6, 5),
  // 金
  gengqi:   K('庚金劍氣', 1, '金', 'dmg', 1.7, 3),
  jinguang: K('金光罩', 1, '金', 'shield', 1, 5),
  feijian:  K('飛劍穿心', 1, '金', 'dmg', 1.5, 2, { brk: .1 }),
  sancai:   K('三才劍陣', 2, '金', 'multi', .9, 4, { hits: 3 }),
  jinzhong: K('金鐘護體', 2, '金', 'shield', 1.6, 5, { reflect: .2 }),
  liejin:   K('裂金斬', 2, '金', 'dmg', 2.4, 4, { brk: .2 }),
  qianfeng: K('千鋒驟雨', 3, '金', 'multi', .8, 5, { hits: 5 }),
  baihong:  K('白虹貫日', 3, '金', 'dmg', 3.4, 5, { brk: .3 }),
  zhuxie:   K('誅邪劍光', 4, '金', 'dmg', 5, 5, { brk: .3 }),
  buxiu:    K('庚金不朽身', 4, '金', 'shield', 2.6, 6, { reflect: .35 }),
  // 木
  huichun:  K('回春術', 1, '木', 'heal', 1, 4),
  tengfu:   K('藤縛術', 1, '木', 'dmg', 1.2, 3, { stun: .3 }),
  feiye:    K('飛葉刃', 1, '木', 'multi', .55, 2, { hits: 3 }),
  xiling:   K('青藤吸靈', 2, '木', 'dmg', 1.8, 3, { drain: .4 }),
  chunyu:   K('春雨潤物', 2, '木', 'heal', 1.8, 5),
  jingji:   K('荊棘甲', 2, '木', 'shield', 1.2, 5, { reflect: .3 }),
  qiulong:  K('萬木囚籠', 3, '木', 'dmg', 2.4, 5, { stun: .5 }),
  muling:   K('長生木靈', 3, '木', 'heal', 2.5, 5),
  jianmu:   K('建木神光', 4, '木', 'dmg', 4, 5, { drain: .5 }),
  shengsheng: K('生生不息', 4, '木', 'heal', 3.5, 5),
  // 水
  shuijian: K('水箭術', 1, '水', 'dmg', 1.5, 2),
  huilan:   K('流水回瀾', 1, '水', 'heal', .9, 4),
  xuanwo:   K('漩渦術', 1, '水', 'dmg', 1.3, 3, { brk: .15 }),
  shuimu:   K('水幕術', 2, '水', 'shield', 1.6, 5),
  chaoxi:   K('潮汐連擊', 2, '水', 'multi', .6, 4, { hits: 4 }),
  xuanshui: K('玄水鞭', 2, '水', 'dmg', 2.2, 3, { drain: .2 }),
  canglang: K('滄浪覆海', 3, '水', 'dmg', 3.2, 5, { stun: .25 }),
  ruoshui:  K('弱水三千', 3, '水', 'shield', 2.2, 5),
  tianhe:   K('天河倒懸', 4, '水', 'dmg', 4.6, 5),
  wanliu:   K('萬流歸宗', 4, '水', 'heal', 3, 5),
  // 火
  huoqiu:   K('火球術', 1, '火', 'dmg', 2, 3, { burn: .2 }),
  huoshe:   K('火蛇纏身', 1, '火', 'dmg', 1.2, 3, { burn: .4 }),
  yanbao:   K('炎爆術', 1, '火', 'dmg', 2.2, 4),
  lieyan:   K('烈焰掌', 2, '火', 'dmg', 2.4, 3, { burn: .3 }),
  huoyu:    K('火雨流星', 2, '火', 'multi', .7, 4, { hits: 4, burn: .1 }),
  niehuo:   K('涅火護身', 2, '火', 'shield', 1.3, 5, { reflect: .25 }),
  fentian:  K('焚天掌', 3, '火', 'dmg', 3.6, 5, { burn: .3 }),
  zhenhuo:  K('真火煉心', 3, '火', 'charge', 0, 3),
  honglian: K('紅蓮業火', 4, '火', 'dmg', 4, 5, { burn: 1 }),
  dari:     K('大日焚空', 4, '火', 'dmg', 5.5, 6),
  // 土
  shifu:    K('石膚術', 1, '土', 'shield', 1, 5),
  luoshi:   K('落石術', 1, '土', 'dmg', 1.6, 3, { stun: .15 }),
  liusha:   K('流沙陷', 1, '土', 'dmg', 1.1, 3, { brk: .2 }),
  liedi:    K('裂地擊', 2, '土', 'dmg', 2.6, 4),
  houtu:    K('厚土盾', 2, '土', 'shield', 1.8, 5),
  shanbeng: K('山岳崩', 2, '土', 'dmg', 2.2, 4, { stun: .3 }),
  dimai:    K('地脈回元', 3, '土', 'heal', 2, 5),
  banshan:  K('搬山印', 3, '土', 'dmg', 3.5, 5, { brk: .25 }),
  zhenyue:  K('鎮嶽天印', 4, '土', 'dmg', 4.6, 6, { stun: .4 }),
  budong:   K('不動山河', 4, '土', 'shield', 3, 6, { reflect: .3 }),
  // 雷
  zhangxin: K('掌心雷', 1, '雷', 'dmg', 1.7, 2),
  leiguang: K('雷光步', 1, '雷', 'dodge', 1, 5),
  dianshe:  K('電蛇', 1, '雷', 'dmg', 1.3, 3, { stun: .3 }),
  benlei:   K('奔雷連閃', 2, '雷', 'multi', .9, 4, { hits: 3, stun: .1 }),
  wulei:    K('五雷印', 2, '雷', 'dmg', 2.6, 4, { brk: .15 }),
  leiting:  K('雷霆護體', 2, '雷', 'shield', 1.2, 5, { reflect: .4 }),
  yinlei:   K('九天引雷', 3, '雷', 'dmg', 3.6, 5, { stun: .3 }),
  leidun:   K('雷遁', 3, '雷', 'dodge', 1.6, 4),
  tianfa:   K('天罰神雷', 4, '雷', 'dmg', 5.4, 6, { stun: .3 }),
  leilao:   K('萬雷天牢', 4, '雷', 'multi', .9, 6, { hits: 6, stun: .15 }),
  // 冰
  bingjian: K('寒冰箭', 1, '冰', 'dmg', 1.5, 2, { freeze: .1 }),
  bingdun:  K('冰盾術', 1, '冰', 'shield', 1.1, 5),
  shuangdong: K('霜凍術', 1, '冰', 'dmg', 1, 4, { freeze: .35 }),
  bingzhui: K('冰錐雨', 2, '冰', 'multi', .65, 4, { hits: 4, freeze: .05 }),
  hanshuang: K('寒霜步', 2, '冰', 'dodge', 1.2, 5),
  xuanbing: K('玄冰掌', 2, '冰', 'dmg', 2.3, 4, { freeze: .2 }),
  bingfeng: K('冰封千里', 3, '冰', 'dmg', 2.6, 6, { freeze: .5 }),
  bingpo:   K('冰魄護心', 3, '冰', 'shield', 2.2, 5),
  yongdong: K('永凍之棺', 4, '冰', 'dmg', 3.5, 6, { freeze: .7 }),
  bingyu:   K('極寒冰獄', 4, '冰', 'multi', 1, 6, { hits: 5, freeze: .2 }),
  // 風
  yufeng:   K('御風步', 1, '風', 'dodge', 1, 5),
  fengren:  K('風刃術', 1, '風', 'dmg', 1.5, 2),
  xuanfeng: K('旋風斬', 1, '風', 'multi', .6, 3, { hits: 3 }),
  jifeng:   K('疾風連刺', 2, '風', 'multi', .5, 4, { hits: 5 }),
  canyun:   K('風捲殘雲', 2, '風', 'dmg', 2.2, 4, { brk: .2 }),
  qingfeng: K('清風拂體', 2, '風', 'heal', 1.2, 4),
  jufeng:   K('颶風領域', 3, '風', 'dmg', 2.8, 5, { stun: .25 }),
  chengfeng: K('乘風遁', 3, '風', 'dodge', 1.8, 4),
  gangfeng: K('九天罡風', 4, '風', 'multi', .85, 6, { hits: 6 }),
  wuying:   K('無影風神', 4, '風', 'dodge', 2.4, 4),
  // 增益（3 回合攻擊提升）
  jushi:    K('聚勢訣', 1, '無', 'buff', 1, 5),
  ruijin:   K('銳金意', 2, '金', 'buff', 1.5, 5),
  ranxue:   K('燃血術', 2, '火', 'buff', 1.8, 6),
  leiti:    K('引雷入體', 3, '雷', 'buff', 2.2, 6),
  tianwei:  K('天威加身', 4, '無', 'buff', 3, 6),
  // 回法（回復法力，本身不耗法力，法力過半時不施放）
  huiyuan:  K('吐納回元', 1, '無', 'mana', 1, 5),
  jingshui: K('靜水凝神', 2, '水', 'mana', 1.5, 5),
  qingmuqi: K('青木養氣', 2, '木', 'mana', 1.5, 5),
  bingxin:  K('冰心返照', 3, '冰', 'mana', 2, 5),
  guiyi:    K('萬氣歸一', 4, '無', 'mana', 2.6, 5),
};
const KIND_LABEL = { dmg: '攻擊', multi: '連擊', heal: '回復', shield: '護盾', dodge: '身法', charge: '蓄力', buff: '增益', mana: '回法' };
const MASTERY = ['入門', '小成', '大成', '圓滿'];
const MASTERY_USES = [0, 40, 150, 400];
const SKILL_PRICE = [0, 120, 1200, 12000, 80000];
function skillDesc(k) {
  const p = [];
  if (k.kind === 'multi') p.push(`${k.hits} 段`);
  if (k.kind === 'charge') p.push('下一招威力 ×2');
  if (k.kind === 'heal') p.push('回血');
  if (k.kind === 'shield') p.push('護盾');
  if (k.kind === 'dodge') p.push('3 回合閃避大增');
  if (k.kind === 'buff') p.push('3 回合攻擊提升');
  if (k.kind === 'mana') p.push('回復法力，不耗法力');
  if (k.burn) p.push(`灼燒 ${Math.round(k.burn * 100)}%`);
  if (k.freeze) p.push(`冰凍 ${Math.round(k.freeze * 100)}%`);
  if (k.stun) p.push(`麻痺 ${Math.round(k.stun * 100)}%`);
  if (k.brk) p.push(`破防 ${Math.round(k.brk * 100)}%`);
  if (k.drain) p.push(`吸血 ${Math.round(k.drain * 100)}%`);
  if (k.reflect) p.push(`反震 ${Math.round(k.reflect * 100)}%`);
  return p.join(' · ');
}

// ---------- 法寶：武器、護甲各一格，飾品 1～3 格（悟道樹「萬寶隨身」），效果和功法共用同一套欄位，祭煉每級 +15% ----------
// ART_SLOTS 是法寶種類；身上的欄位用 gearKeys()，飾品欄依序叫 飾品、飾品2、飾品3
const ART_SLOTS = ['武器', '護甲', '飾品'];
const ARTS = {
  qingfeng:  { name: '青鋒劍', slot: '武器', grade: 1, atk: .1 },
  chitong:   { name: '赤銅錘', slot: '武器', grade: 1, atk: .14, spd: -1 },
  hantie:    { name: '寒鐵槍', slot: '武器', grade: 2, atk: .2, crit: .05 },
  liuguang:  { name: '流光扇', slot: '武器', grade: 2, atk: .15, spd: 3 },
  jingleichui: { name: '驚雷錘', slot: '武器', grade: 3, atk: .35, crit: .1 },
  zhanyue:   { name: '斬月刀', slot: '武器', grade: 3, atk: .4, critDmg: .3 },
  taixu:     { name: '太虛劍', slot: '武器', grade: 4, atk: .7, crit: .15, critDmg: .5 },
  taomu:     { name: '桃木劍', slot: '武器', grade: 1, atk: .08, crit: .03 },
  gangbian:  { name: '精鋼鞭', slot: '武器', grade: 1, atk: .12 },
  qingshuang: { name: '青霜劍', slot: '武器', grade: 2, atk: .18, dodge: .03 },
  chiyan:    { name: '赤焰槍', slot: '武器', grade: 2, atk: .22, critDmg: .1 },
  jinghong:  { name: '驚鴻劍', slot: '武器', grade: 3, atk: .35, spd: 4 },
  panlong:   { name: '盤龍戟', slot: '武器', grade: 4, atk: .6, crit: .1, lifesteal: .05 },
  shoupi:    { name: '獸皮軟甲', slot: '護甲', grade: 1, def: .1, hp: .05 },
  suoyi:     { name: '青竹蓑衣', slot: '護甲', grade: 1, def: .05, dodge: .03 },
  xuantie:   { name: '玄鐵重甲', slot: '護甲', grade: 2, def: .25, hp: .1, spd: -2 },
  yunjin:    { name: '雲錦法衣', slot: '護甲', grade: 2, def: .15, regen: .01 },
  guijia:    { name: '龜甲護心鏡', slot: '護甲', grade: 3, def: .35, hp: .2 },
  nichang:   { name: '霓裳羽衣', slot: '護甲', grade: 3, dodge: .1, spd: 5 },
  jiulong:   { name: '九龍神甲', slot: '護甲', grade: 4, def: .6, hp: .5, regen: .02 },
  daopao:    { name: '布衣道袍', slot: '護甲', grade: 1, def: .06, hp: .04 },
  tengjia:   { name: '藤甲', slot: '護甲', grade: 1, def: .12, spd: -1 },
  linwen:    { name: '鱗紋甲', slot: '護甲', grade: 2, def: .2, hp: .12 },
  liuyunshan: { name: '流雲衫', slot: '護甲', grade: 2, def: .12, dodge: .05 },
  xuanwu:    { name: '玄武重鎧', slot: '護甲', grade: 3, def: .45, hp: .25, spd: -3 },
  xingchen:  { name: '星辰戰衣', slot: '護甲', grade: 4, def: .45, hp: .3, dodge: .08 },
  pingan:    { name: '平安符', slot: '飾品', grade: 1, life: 10 },
  juling:    { name: '聚靈玉佩', slot: '飾品', grade: 1, rate: .08 },
  zhaocai:   { name: '招財葫蘆', slot: '飾品', grade: 2, stone: .3, drop: .15 },
  yanghunyu: { name: '養魂玉', slot: '飾品', grade: 2, techXp: .25, toxRes: .1 },
  bixie:     { name: '辟邪鈴', slot: '飾品', grade: 2, brk: .03, evRate: .1 },
  qiankun:   { name: '乾坤袋', slot: '飾品', grade: 3, drop: .5, offline: 2, stone: .2 },
  pantao:    { name: '蟠桃核', slot: '飾品', grade: 3, life: 60, hp: .1, regen: .01 },
  xingpan:   { name: '周天星盤', slot: '飾品', grade: 4, rate: .4, brk: .06, techXp: .3, mp: .2 },
  lingxi:    { name: '靈犀香囊', slot: '飾品', grade: 1, mp: .2 },
  tongxin:   { name: '同心結', slot: '飾品', grade: 2, hp: .08, regen: .01 },
  qingxin:   { name: '清心玉', slot: '飾品', grade: 2, toxRes: .2, pillEff: .15 },
  xuanjing:  { name: '玄晶耳墜', slot: '飾品', grade: 3, crit: .08, critDmg: .2, atk: .1 },
  jieyin:    { name: '接引燈', slot: '飾品', grade: 3, brk: .04, mp: .3, rate: .1 },
  hunyuanzhu: { name: '混元珠', slot: '飾品', grade: 4, atk: .2, hp: .2, mp: .3, def: .2 },
};
const ART_PRICE = [0, 250, 3000, 30000, 180000];
const ART_MAX_REFINE = 9;

// ---------- 體質：開局和靈根一起抽 ----------
// r 稀有度 1～4；boost 該屬性術法 +30%；allAff 所有屬性都算靈根親和；lifePct 壽元比例
const PHYS_RANK = ['', '凡品', '靈品', '玄品', '聖品'];
const PHYS_WEIGHT = [0, 50, 30, 15, 5];
const PHYSIQUES = {
  fantai:    { name: '凡胎', r: 1, desc: '平平無奇，什麼加成都沒有。' },
  tongjin:   { name: '銅筋鐵骨', r: 1, hp: .15, def: .1 },
  congming:  { name: '耳聰目明', r: 1, dodge: .05, spd: 2 },
  shouxiang: { name: '長壽之相', r: 1, life: 20 },
  jiangu:    { name: '劍骨', r: 2, atk: .15, crit: .08 },
  yaoti:     { name: '藥體', r: 2, pillEff: .3, toxRes: .3 },
  fuyuan:    { name: '福緣深厚', r: 2, evRate: .3, drop: .3 },
  lingyan:   { name: '靈眼', r: 2, stone: .3 },
  leiling:   { name: '雷靈之體', r: 3, boost: '雷', rate: .1 },
  hanbing:   { name: '寒冰玄體', r: 3, boost: '冰', dodge: .05 },
  fengling:  { name: '風靈之體', r: 3, boost: '風', spd: 8 },
  daotai:    { name: '先天道胎', r: 3, techXp: .5, brk: .05 },
  zhanti:    { name: '不滅戰體', r: 4, hp: .4, regen: .03, killXiu: .003 },
  tiandu:    { name: '天妒之體', r: 4, rate: .6, lifePct: -.4, desc: '修煉極快，但天妒英才，壽元只剩六成。' },
  wanxiang:  { name: '萬象歸元體', r: 4, allAff: 1, desc: '所有屬性的術法都算靈根親和。' },
  changsheng: { name: '長生道體', r: 4, life: 200, lateRate: .5 },
};

// ---------- 神通 ----------
// 每門一場戰鬥只發動一次，不耗法力。trig：open 開場第一回合、field 整場生效、lethal 受到致命傷時
// elem：本命神通依靈根屬性覺醒（void 是空靈根）；'無' 只會從其他途徑得到
// 效果欄位：nuke 一擊倍率（pierce 無視防禦）、burn 灼燒、stun 敵人停手回合、brk 破防、
//   fa 法相（atk/def 倍率、回合）、shield 護盾（氣血比例）、clone 分身（每回合追加攻擊比例、回合、段數）、
//   foeAtk/foeDef 敵人攻防倍率、regen 每回合回血、dodge 閃避、steal 吸血、reflect 反震、crit 暴擊、mpFull 開場回滿法力、mpRegen 每回合回法、skillUp 術法威力
//   revive 不死回血比例、flee 遁走
const SH = (name, type, elem, trig, desc, ex = {}) => ({ name, type, elem, trig, desc, ...ex });
const SHENS = {
  duanyue:  SH('斷嶽金芒', '攻伐', '金', 'open', '開場一道金芒，攻擊力 ×8，無視防禦', { nuke: 8, pierce: 1 }),
  fentian:  SH('焚天赤羽', '攻伐', '火', 'open', '開場一擊 ×6，並灼燒 4 回合', { nuke: 6, burn: .8 }),
  powang:   SH('破妄一指', '攻伐', '無', 'open', '開場一擊 ×5，敵人破防 50%', { nuke: 5, brk: .5 }),
  shanyue:  SH('山嶽法相', '法相', '土', 'open', '化出山嶽法相，5 回合攻擊、防禦 ×1.6', { fa: [1.6, 1.6, 5] }),
  jinshen:  SH('丈六金身', '法相', '無', 'open', '金身護體，得到氣血一半的護盾，5 回合防禦 ×2', { shield: .5, fa: [1, 2, 5] }),
  zeguo:    SH('澤國千里', '領域', '水', 'field', '整場敵人攻擊 -25%，你每回合回血 3%', { foeAtk: .75, regen: .03 }),
  guixu:    SH('歸墟', '領域', 'void', 'field', '整場敵人防禦歸零、攻擊 -15%', { foeDef: 0, foeAtk: .85 }),
  taixu:    SH('太虛幻境', '領域', '無', 'field', '整場閃避 +35%', { dodge: .35 }),
  leiyu:    SH('九霄雷獄', '禁錮', '雷', 'open', '開場一擊 ×3，敵人麻痺 2 回合', { nuke: 3, stun: 2 }),
  xuanbing: SH('萬載玄冰', '禁錮', '冰', 'open', '冰封敵人 3 回合', { stun: 3 }),
  zhenyu:   SH('鎮獄印', '禁錮', '無', 'open', '鎮住敵人 2 回合，並破防 30%', { stun: 2, brk: .3 }),
  fengying: SH('風影化身', '分身', '風', 'open', '6 回合內分身每回合追加一次攻擊（五成威力）', { clone: [.5, 6, 1] }),
  sanshen:  SH('一氣三身', '分身', '無', 'open', '5 回合內兩個分身各追加一次攻擊（五成威力）', { clone: [.5, 5, 2] }),
  kurong:   SH('枯榮輪轉', '不滅', '木', 'lethal', '第一次受到致命傷時不死，回血 40%', { revive: .4 }),
  chihuang: SH('赤凰涅槃', '不滅', '無', 'lethal', '第一次受到致命傷時浴火重生，回血 60%', { revive: .6 }),
  yinian:   SH('一念千里', '遁法', '無', 'lethal', '快輸時直接遁走，不算落敗、不會負傷', { flee: 1 }),
  tuntian:  SH('吞天噬地', '吞噬', '無', 'field', '整場吸血 +20%', { steal: .2 }),
  yinguo:   SH('因果輪轉', '反彈', '無', 'field', '整場把受到的傷害反彈 30%', { reflect: .3 }),
  lingtai:  SH('靈台清明', '回法', '無', 'field', '開場法力回滿，整場每回合多回 15% 法力，術法威力 +20%', { mpFull: 1, mpRegen: .15, skillUp: .2 }),
  guangyin: SH('光陰剎那', '加速', '無', 'open', '前 4 回合每回合多出手一次', { clone: [1, 4, 1] }),
  tianyan:  SH('天眼通', '洞察', '無', 'field', '看穿破綻，整場暴擊 +30%', { crit: .3 }),
};
// 天賦神通：稀有體質測根骨時就帶的神通
const PHYS_SHEN = { leiling: 'leiyu', hanbing: 'xuanbing', fengling: 'fengying', daotai: 'tianyan', zhanti: 'jinshen', tiandu: 'guangyin', wanxiang: 'sanshen', changsheng: 'kurong' };
