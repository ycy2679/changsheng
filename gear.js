// 長生閒記：武技、法寶、體質

// ---------- 武技 ----------
// kind：dmg 攻擊 / multi 連擊（hits 段，每段 pow）/ heal 回血 / shield 護盾 / dodge 身法 / charge 蓄力（下一招威力 ×2）
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
};
const KIND_LABEL = { dmg: '攻擊', multi: '連擊', heal: '回復', shield: '護盾', dodge: '身法', charge: '蓄力' };
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
  if (k.burn) p.push(`灼燒 ${Math.round(k.burn * 100)}%`);
  if (k.freeze) p.push(`冰凍 ${Math.round(k.freeze * 100)}%`);
  if (k.stun) p.push(`麻痺 ${Math.round(k.stun * 100)}%`);
  if (k.brk) p.push(`破防 ${Math.round(k.brk * 100)}%`);
  if (k.drain) p.push(`吸血 ${Math.round(k.drain * 100)}%`);
  if (k.reflect) p.push(`反震 ${Math.round(k.reflect * 100)}%`);
  return p.join(' · ');
}

// ---------- 法寶：武器、護甲、飾品各一格，效果和功法共用同一套欄位，祭煉每級 +15% ----------
const ART_SLOTS = ['武器', '護甲', '飾品'];
const ARTS = {
  qingfeng:  { name: '青鋒劍', slot: '武器', grade: 1, atk: .1 },
  chitong:   { name: '赤銅錘', slot: '武器', grade: 1, atk: .14, spd: -1 },
  hantie:    { name: '寒鐵槍', slot: '武器', grade: 2, atk: .2, crit: .05 },
  liuguang:  { name: '流光扇', slot: '武器', grade: 2, atk: .15, spd: 3 },
  jingleichui: { name: '驚雷錘', slot: '武器', grade: 3, atk: .35, crit: .1 },
  zhanyue:   { name: '斬月刀', slot: '武器', grade: 3, atk: .4, critDmg: .3 },
  taixu:     { name: '太虛劍', slot: '武器', grade: 4, atk: .7, crit: .15, critDmg: .5 },
  shoupi:    { name: '獸皮軟甲', slot: '護甲', grade: 1, def: .1, hp: .05 },
  suoyi:     { name: '青竹蓑衣', slot: '護甲', grade: 1, def: .05, dodge: .03 },
  xuantie:   { name: '玄鐵重甲', slot: '護甲', grade: 2, def: .25, hp: .1, spd: -2 },
  yunjin:    { name: '雲錦法衣', slot: '護甲', grade: 2, def: .15, regen: .01 },
  guijia:    { name: '龜甲護心鏡', slot: '護甲', grade: 3, def: .35, hp: .2 },
  nichang:   { name: '霓裳羽衣', slot: '護甲', grade: 3, dodge: .1, spd: 5 },
  jiulong:   { name: '九龍神甲', slot: '護甲', grade: 4, def: .6, hp: .5, regen: .02 },
  pingan:    { name: '平安符', slot: '飾品', grade: 1, hp: .05, life: 5 },
  juling:    { name: '聚靈玉佩', slot: '飾品', grade: 1, rate: .08 },
  zhaocai:   { name: '招財葫蘆', slot: '飾品', grade: 2, stone: .3 },
  yanghunyu: { name: '養魂玉', slot: '飾品', grade: 2, techXp: .25, toxRes: .1 },
  bixie:     { name: '辟邪鈴', slot: '飾品', grade: 2, brk: .03, evRate: .1 },
  qiankun:   { name: '乾坤袋', slot: '飾品', grade: 3, drop: .5, offline: 2 },
  pantao:    { name: '蟠桃核', slot: '飾品', grade: 3, life: 60 },
  xingpan:   { name: '周天星盤', slot: '飾品', grade: 4, rate: .4, brk: .06 },
};
const ART_PRICE = [0, 250, 3000, 30000, 180000];
const ART_MAX_REFINE = 9;

// ---------- 體質：開局和靈根一起抽 ----------
// r 稀有度 1～4；boost 該屬性武技 +30%；allAff 所有屬性都算靈根親和；lifePct 壽元比例
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
  wanxiang:  { name: '萬象歸元體', r: 4, allAff: 1, desc: '所有屬性的武技都算靈根親和。' },
  changsheng: { name: '長生道體', r: 4, life: 200, lateRate: .5 },
};
