// 長生閒記：術法、法寶、體質

// ---------- 術法 ----------
// kind：dmg 攻擊 / multi 連擊（hits 段，每段 pow）/ heal 回血 / shield 護盾 / dodge 身法 / charge 蓄力（下一招威力 ×2）
//       buff 增益（3 回合攻擊 +15%×威力）/ mana 回法（回復 20%×威力 的法力）
// 附加：burn 灼燒（每回合攻擊力的比例，3 回合）freeze 冰凍機率 stun 麻痺機率（敵人跳過一回合）
//       brk 破防（敵人防禦降低，3 回合）drain 吸血 reflect 反震（3 回合內把受到的傷害反彈一部分）
const K = (name, grade, elem, kind, pow, cd, ex = {}) => ({ name, grade, elem, kind, pow, cd, ...ex });
const SKILLS = {
  // 無
  qijin:    K('氣勁', 1, '無', 'dmg', 1.4, 3, { sch: 'fa' }),
  bengshan: K('崩山拳', 1, '無', 'multi', .75, 3, { hits: 2, sch: 'ti' }),
  shennian: K('神念刺', 1, '無', 'dmg', 1.1, 3, { stun: .25, sch: 'hun' }),
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
  // ---------- 術法擴充（每個屬性每階的攻、防都補齊） ----------
  sx001: K('崩拳', 1, '無', 'dmg', 1.6, 3),
  sx002: K('護體真氣', 1, '無', 'shield', 1, 5),
  sx003: K('調息術', 1, '無', 'heal', 1, 4),
  sx004: K('閃身步', 1, '無', 'dodge', 1, 4),
  sx005: K('氣罩術', 1, '無', 'shield', 0.9, 4),
  sx006: K('鐵山靠', 2, '無', 'dmg', 2.3, 4, { brk: .1 }),
  sx007: K('幻影連掌', 2, '無', 'multi', 0.7, 4, { hits: 3 }),
  sx008: K('還元術', 2, '無', 'heal', 1.5, 5),
  sx009: K('移形換影', 2, '無', 'dodge', 1.3, 4),
  sx010: K('震空掌', 3, '無', 'dmg', 3.2, 5, { brk: .2 }),
  sx011: K('無相護體', 3, '無', 'shield', 2.2, 5),
  sx012: K('虛空碎', 4, '無', 'dmg', 4.8, 5),
  sx013: K('不滅真元', 4, '無', 'heal', 3.2, 5),
  sx014: K('金針刺穴', 1, '金', 'dmg', 1.6, 3, { brk: .1 }),
  sx015: K('銳鋒斬', 1, '金', 'dmg', 1.8, 3),
  sx016: K('鐵皮術', 1, '金', 'shield', 1, 5),
  sx017: K('金砂護身', 1, '金', 'shield', 0.9, 4, { reflect: .1 }),
  sx018: K('金光遁', 1, '金', 'dodge', 1, 4),
  sx019: K('金輪斬', 2, '金', 'multi', 0.8, 4, { hits: 3, brk: .1 }),
  sx020: K('剛金壁', 2, '金', 'shield', 1.5, 5, { reflect: .15 }),
  sx021: K('金蓮護法', 2, '金', 'heal', 1.3, 5),
  sx022: K('金甲天衣', 3, '金', 'shield', 2.2, 5, { reflect: .25 }),
  sx023: K('金影遁', 3, '金', 'dodge', 1.7, 4),
  sx024: K('金戈破陣', 4, '金', 'dmg', 4.8, 5, { brk: .35 }),
  sx025: K('太白遁光', 4, '金', 'dodge', 2.4, 4),
  sx026: K('荊棘刺', 1, '木', 'dmg', 1.5, 3, { drain: .1 }),
  sx027: K('枯藤鞭', 1, '木', 'dmg', 1.3, 3, { stun: .2 }),
  sx028: K('木甲術', 1, '木', 'shield', 1, 5),
  sx029: K('青葉護身', 1, '木', 'heal', 0.9, 4),
  sx030: K('柳絮身法', 1, '木', 'dodge', 1, 4),
  sx031: K('刺木陣', 2, '木', 'multi', 0.6, 4, { hits: 4 }),
  sx032: K('樹妖纏', 2, '木', 'dmg', 2.1, 4, { stun: .3 }),
  sx033: K('古木盾', 2, '木', 'shield', 1.6, 5),
  sx034: K('森羅萬木', 3, '木', 'multi', 0.8, 5, { hits: 4, drain: .15 }),
  sx035: K('枯木逢春', 3, '木', 'heal', 2.3, 5),
  sx036: K('青天古木', 4, '木', 'dmg', 4.6, 5, { stun: .3 }),
  sx037: K('萬古長青', 4, '木', 'shield', 2.8, 6, { reflect: .2 }),
  sx038: K('水浪擊', 1, '水', 'dmg', 1.6, 3),
  sx039: K('寒泉刺', 1, '水', 'dmg', 1.4, 3, { brk: .1 }),
  sx040: K('水遁術', 1, '水', 'dodge', 1, 4),
  sx041: K('水球護身', 1, '水', 'shield', 1, 5),
  sx042: K('清泉滌身', 1, '水', 'heal', 1, 4),
  sx043: K('激流衝', 2, '水', 'multi', 0.6, 4, { hits: 4 }),
  sx044: K('碧瀾盾', 2, '水', 'shield', 1.6, 5),
  sx045: K('甘露術', 2, '水', 'heal', 1.5, 5),
  sx046: K('海嘯', 3, '水', 'dmg', 3.3, 5, { stun: .2 }),
  sx047: K('玄水遁', 3, '水', 'dodge', 1.7, 4),
  sx048: K('怒海狂濤', 4, '水', 'multi', 0.9, 6, { hits: 5 }),
  sx049: K('天一真水', 4, '水', 'shield', 3, 6),
  sx050: K('火鐮斬', 1, '火', 'dmg', 1.7, 3, { burn: .2 }),
  sx051: K('火罩術', 1, '火', 'shield', 1, 5),
  sx052: K('暖陽術', 1, '火', 'heal', 0.9, 4),
  sx053: K('火遁術', 1, '火', 'dodge', 1, 4),
  sx054: K('炎甲術', 1, '火', 'shield', 0.9, 5, { reflect: .15 }),
  sx055: K('烈火燎原', 2, '火', 'multi', 0.6, 4, { hits: 4, burn: .15 }),
  sx056: K('火鳳護體', 2, '火', 'shield', 1.5, 5, { reflect: .2 }),
  sx057: K('浴火術', 2, '火', 'heal', 1.5, 5),
  sx058: K('炎龍吐息', 3, '火', 'dmg', 3.4, 5, { burn: .4 }),
  sx059: K('離焰遁光', 3, '火', 'dodge', 1.7, 4),
  sx060: K('赤炎壁', 3, '火', 'shield', 2.2, 5, { reflect: .25 }),
  sx061: K('不熄心火', 4, '火', 'heal', 3.2, 5),
  sx062: K('焚天火障', 4, '火', 'shield', 2.8, 6, { reflect: .3 }),
  sx063: K('土槍術', 1, '土', 'dmg', 1.6, 3),
  sx064: K('飛沙走石', 1, '土', 'multi', 0.55, 3, { hits: 3 }),
  sx065: K('土牆術', 1, '土', 'shield', 1, 5),
  sx066: K('土遁術', 1, '土', 'dodge', 1, 4),
  sx067: K('黃土養身', 1, '土', 'heal', 0.9, 4),
  sx068: K('地裂斬', 2, '土', 'dmg', 2.4, 4, { brk: .2 }),
  sx069: K('岩壁術', 2, '土', 'shield', 1.6, 5, { reflect: .1 }),
  sx070: K('地氣回生', 2, '土', 'heal', 1.4, 5),
  sx071: K('巨岩天墜', 3, '土', 'dmg', 3.5, 5, { stun: .25 }),
  sx072: K('磐岩甲', 3, '土', 'shield', 2.3, 5, { reflect: .2 }),
  sx073: K('五嶽鎮壓', 4, '土', 'dmg', 4.8, 5, { brk: .3 }),
  sx074: K('厚德載物', 4, '土', 'heal', 3.2, 5),
  sx075: K('雷球術', 1, '雷', 'dmg', 1.6, 3, { stun: .1 }),
  sx076: K('雷箭', 1, '雷', 'dmg', 1.4, 2),
  sx077: K('雷罩術', 1, '雷', 'shield', 1, 5, { reflect: .2 }),
  sx078: K('雷息療身', 1, '雷', 'heal', 0.9, 4),
  sx079: K('電光步', 1, '雷', 'dodge', 1, 4),
  sx080: K('雷電交加', 2, '雷', 'multi', 0.6, 4, { hits: 4, stun: .1 }),
  sx081: K('雷鳴盾', 2, '雷', 'shield', 1.5, 5, { reflect: .3 }),
  sx082: K('雷雨潤身', 2, '雷', 'heal', 1.3, 5),
  sx083: K('雷芒貫日', 3, '雷', 'dmg', 3.3, 5, { stun: .3 }),
  sx084: K('雷神護體', 3, '雷', 'shield', 2.2, 5, { reflect: .4 }),
  sx085: K('九天雷遁', 4, '雷', 'dodge', 2.4, 4),
  sx086: K('雷劫淬身', 4, '雷', 'heal', 3, 5),
  sx087: K('冰刃', 1, '冰', 'dmg', 1.6, 3, { freeze: .1 }),
  sx088: K('霜雪紛飛', 1, '冰', 'multi', 0.55, 3, { hits: 3, freeze: .05 }),
  sx089: K('霜甲術', 1, '冰', 'shield', 1, 5),
  sx090: K('寒露療傷', 1, '冰', 'heal', 0.9, 4),
  sx091: K('冰滑步', 1, '冰', 'dodge', 1, 4),
  sx092: K('冰龍撞', 2, '冰', 'dmg', 2.4, 4, { freeze: .25 }),
  sx093: K('玄冰壁', 2, '冰', 'shield', 1.6, 5, { reflect: .1 }),
  sx094: K('冰清玉潔', 2, '冰', 'heal', 1.4, 5),
  sx095: K('寒霜萬里', 3, '冰', 'multi', 0.75, 5, { hits: 4, freeze: .15 }),
  sx096: K('冰魄遁', 3, '冰', 'dodge', 1.7, 4),
  sx097: K('萬古冰封', 4, '冰', 'shield', 3, 6),
  sx098: K('寒月清輝', 4, '冰', 'heal', 3, 5),
  sx099: K('風刺', 1, '風', 'dmg', 1.5, 2),
  sx100: K('疾風掌', 1, '風', 'dmg', 1.7, 3),
  sx101: K('風盾術', 1, '風', 'shield', 1, 5),
  sx102: K('和風療身', 1, '風', 'heal', 0.9, 4),
  sx103: K('隨風步', 1, '風', 'dodge', 1.1, 4),
  sx104: K('風刃迴旋', 2, '風', 'multi', 0.7, 4, { hits: 4 }),
  sx105: K('旋風護體', 2, '風', 'shield', 1.5, 5, { reflect: .15 }),
  sx106: K('風息調元', 2, '風', 'heal', 1.3, 5),
  sx107: K('千風斬', 3, '風', 'multi', 0.8, 5, { hits: 5 }),
  sx108: K('旋風罩', 3, '風', 'shield', 2.2, 5),
  sx109: K('天風破', 4, '風', 'dmg', 4.8, 5, { brk: .2 }),
  sx110: K('長風萬里', 4, '風', 'heal', 3, 5),
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
// 秘境頭目專屬術法
Object.assign(SKILLS, {
  huoxitu:  K('火蜥吐焰', 3, '火', 'dmg', 3, 4, { burn: .5, boss: 1 }),
  dianqian: K('殿前雷印', 4, '雷', 'dmg', 5, 5, { stun: .4, boss: 1 }),
  longxi:   K('龍息冰封', 4, '冰', 'dmg', 4.5, 5, { freeze: .6, boss: 1 }),
});
// 路線專屬大招（only：只有走這條路的人能領悟、能用；金丹、化神時自動領悟）
Object.assign(SKILLS, {
  fatian:  K('法天象地', 3, '無', 'buff', 2, 8, { fa: [1.6, 1.5, 4], shieldX: .3, sch: 'ti', only: 'ti' }),
  santou:  K('三頭六臂', 4, '無', 'multi', 1.1, 6, { hits: 6, sch: 'ti', only: 'ti' }),
  shenhun: K('神魂衝擊', 3, '無', 'dmg', 3, 5, { pierce: 1, stun: .6, sch: 'hun', only: 'hun' }),
  wannian: K('萬念鎮魂', 4, '無', 'dmg', 4.5, 7, { pierce: 1, stun: 1, stunT: 2, sch: 'hun', only: 'hun' }),
});
// 術法路數：法術耗法力、體術耗血氣、神魂術耗神識；沒標 sch 的依效果自動歸類
const SCHOOL_NAME = { fa: '法術', ti: '體術', hun: '神魂術' };
const RES_NAME = { fa: '法力', ti: '血氣', hun: '神識' };
function skillSchool(k) {
  if (k.sch) return k.sch;
  if (k.stun || k.freeze) return 'hun';
  if (['multi', 'dodge', 'charge'].includes(k.kind) || (k.elem === '無' && k.kind === 'dmg') || (k.kind === 'shield' && k.reflect)) return 'ti';
  if (k.kind === 'shield' && k.elem === '無') return 'hun';
  return 'fa';
}
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
  if (k.kind === 'buff') p.push(k.fa ? `${k.fa[2]} 回合攻擊 ×${k.fa[0]}、防禦 ×${k.fa[1]}${k.shieldX ? `，並得到 ${k.shieldX * 100}% 氣血的護盾` : ''}` : '3 回合攻擊提升');
  if (k.kind === 'mana') p.push('回復法力，不耗法力');
  if (k.pierce) p.push('無視防禦');
  if (k.burn) p.push(`灼燒 ${Math.round(k.burn * 100)}%`);
  if (k.freeze) p.push(`冰凍 ${Math.round(k.freeze * 100)}%`);
  if (k.stun) p.push(`麻痺 ${Math.round(k.stun * 100)}%${k.stunT ? `（${k.stunT} 回合）` : ''}`);
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
// 重要人物專屬法寶：劇情裡明確給了特定東西，就不再隨機抽（char 標記，不進隨機池）
Object.assign(ARTS, {
  shutongjian: { name: '疏桐劍', slot: '武器', grade: 3, char: 1, atk: .38, crit: .08, spd: 3 },
  baiyujian:  { name: '白玉劍', slot: '武器', grade: 4, char: 1, atk: .65, crit: .12, critDmg: .3 },
  qinghejian: { name: '清禾劍', slot: '武器', grade: 3, char: 1, atk: .4, crit: .1 },
  guichenjian: { name: '歸塵劍', slot: '武器', grade: 4, char: 1, atk: .5, crit: .08, techXp: .3 },
});
// 路線專屬法寶：化神時，走哪條路主修就悟出哪一件（path 標記，不進隨機池、只能自己這條路裝備）
Object.assign(ARTS, {
  daoxinxi:  { name: '道心玄璽', slot: '飾品', grade: 4, path: 'fa', mp: .5, skillUp: .3, rate: .15 },
  buxiuhun:  { name: '不朽戰魂', slot: '飾品', grade: 4, path: 'ti', hp: .4, def: .25, normalAtk: .3 },
  jiuyoutong: { name: '九幽神瞳', slot: '飾品', grade: 4, path: 'hun', shenUp: .4, crit: .12, techXp: .2, evRate: .15 },
});
// 秘境頭目專屬法寶（boss 標記：只有打敗那個頭目才會掉）
Object.assign(ARTS, {
  tengxin:   { name: '藤心環', slot: '飾品', grade: 2, boss: 1, regen: .02, hp: .1 },
  jiaolin:   { name: '蛟鱗甲', slot: '護甲', grade: 3, boss: 1, def: .4, hp: .25, regen: .015 },
  michengyao: { name: '迷城鑰', slot: '飾品', grade: 4, boss: 1, rate: .2, drop: .4, stone: .3, evRate: .2 },
  wanjianxia: { name: '萬劍匣', slot: '武器', grade: 4, boss: 1, atk: .75, crit: .15, critDmg: .4 },
  jiehuoxin: { name: '劫火心', slot: '飾品', grade: 4, boss: 1, hp: .3, atk: .3, def: .2, brk: .08 },
});
const ART_PRICE = [0, 250, 3000, 30000, 180000];
const ART_MAX_REFINE = 9;

// ---------- 體質：開局和靈根一起抽 ----------
// r 稀有度 1～5：凡體、靈體、道體、聖體、混沌；path 對應的修行路線（對上時效果 ×1.3，兼修 ×1.15）
// boost 該屬性術法 +30%（boosts 多個屬性、boostAmt 改倍率）；allAff 所有屬性都算靈根親和；noCounter 不受屬性相剋；lifePct 壽元比例
// 道體以上測靈根時帶天賦神通（PHYS_SHEN），靈體以下不帶
const PHYS_RANK = ['', '凡體', '靈體', '道體', '聖體', '混沌'];
const PHYS_WEIGHT = [0, 50, 30, 12, 4, 1];
const PHYSIQUES = {
  // 凡體
  fantai:    { name: '凡胎', r: 1, desc: '平平無奇，什麼加成都沒有。' },
  tongjin:   { name: '銅筋鐵骨', r: 1, path: 'ti', hp: .15, def: .1 },
  congming:  { name: '耳聰目明', r: 1, dodge: .05, spd: 2 },
  shouxiang: { name: '長壽之相', r: 1, life: 20 },
  jiangu:    { name: '劍骨', r: 1, atk: .15, crit: .08 },
  yaoti:     { name: '藥體', r: 1, pillEff: .3, toxRes: .3 },
  fuyuan:    { name: '福緣深厚', r: 1, evRate: .3, drop: .3 },
  lingyan:   { name: '靈眼', r: 1, stone: .3 },
  lingqiao:  { name: '靈竅初開', r: 1, path: 'fa', mp: .15, skillUp: .05 },
  chengming: { name: '心思澄明', r: 1, path: 'hun', techXp: .15, crit: .03 },
  // 靈體：八種屬性靈體（法修），加上體修、魂修各一
  gengjinlt: { name: '庚金靈體', r: 2, path: 'fa', boost: '金', atk: .1 },
  qingmult:  { name: '青木靈體', r: 2, path: 'fa', boost: '木', regen: .02 },
  xuanshuilt: { name: '玄水靈體', r: 2, path: 'fa', boost: '水', mp: .2 },
  chiyanlt:  { name: '赤炎靈體', r: 2, path: 'fa', boost: '火', crit: .05 },
  houtult:   { name: '厚土靈體', r: 2, path: 'fa', boost: '土', hp: .15, def: .1 },
  leiling:   { name: '雷靈之體', r: 2, path: 'fa', boost: '雷', rate: .1 },
  hanbing:   { name: '寒冰玄體', r: 2, path: 'fa', boost: '冰', dodge: .05 },
  fengling:  { name: '風靈之體', r: 2, path: 'fa', boost: '風', spd: 8 },
  manhuang:  { name: '蠻荒血脈', r: 2, path: 'ti', hp: .3, regen: .015 },
  shenhun:   { name: '神魂靈體', r: 2, path: 'hun', shenUp: .15, techXp: .2 },
  // 道體
  daotai:    { name: '先天道胎', r: 3, path: 'fa', techXp: .5, brk: .05 },
  jingangdt: { name: '金剛道體', r: 3, path: 'ti', hp: .4, def: .3, normalAtk: .3 },
  zifu:      { name: '紫府道體', r: 3, path: 'hun', shenUp: .3, crit: .08 },
  tiandu:    { name: '天妒之體', r: 3, rate: .6, lifePct: -.4, desc: '修煉極快，但天妒英才，壽元只剩六成。' },
  changsheng: { name: '長生道體', r: 3, life: 200, lateRate: .5 },
  // 聖體
  zhanti:    { name: '不滅戰體', r: 4, path: 'ti', hp: .4, regen: .03, killXiu: .003 },
  wanxiang:  { name: '萬象歸元體', r: 4, path: 'fa', allAff: 1, desc: '所有屬性的術法都算靈根親和。' },
  wuxingst:  { name: '五行聖體', r: 4, path: 'fa', boosts: ['金', '木', '水', '火', '土'], rate: .2, desc: '金木水火土五系術法都 +30%，修煉 +20%。' },
  tianhun:   { name: '天魂聖體', r: 4, path: 'hun', shenUp: .5, crit: .1, techXp: .3 },
  // 混沌
  hundunti:  { name: '混沌體', r: 5, boost: '無', boostAmt: 1.5, noCounter: 1, rate: .3, desc: '天地未分時的一縷混沌：無屬性術法 +50%、不受屬性相剋、修煉 +30%。' },
  hongmeng:  { name: '鴻蒙體', r: 5, path: 'fa', allAff: 1, skillUp: .3, mp: .5, desc: '所有屬性的術法都算靈根親和，術法威力 +30%、法力 +50%。' },
  taigu:     { name: '太古神體', r: 5, path: 'ti', hp: 1, def: .6, normalAtk: .5, regen: .03 },
  xinghai:   { name: '星海神魂', r: 5, path: 'hun', shenUp: .8, crit: .15, evRate: .3 },
};

// ---------- 神通 ----------
// 每門一場戰鬥只發動一次，不耗法力。trig：open 開場第一回合、field 整場生效、lethal 受到致命傷時
// elem：本命神通依靈根屬性覺醒（void 是空靈根）；'無' 只會從其他途徑得到
// 效果欄位：nuke 一擊倍率（pierce 無視防禦）、burn 灼燒、stun 敵人停手回合、brk 破防、
//   fa 法相（atk/def 倍率、回合）、shield 護盾（氣血比例）、clone 分身（每回合追加攻擊比例、回合、段數）、
//   foeAtk/foeDef 敵人攻防倍率、regen 每回合回血、dodge 閃避、steal 吸血、reflect 反震、crit 暴擊、mpFull 開場回滿法力、mpRegen 每回合回法、skillUp 術法威力、loot 打贏後靈石倍率、dropUp 掉落機率、winXiu 打贏後得修為（當前境界比例）
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
  wuxinglz: SH('五行輪轉', '領域', '無', 'field', '五行生生不息：整場敵人攻擊 -20%、暴擊 +15%、每回合回血 3%', { foeAtk: .8, crit: .15, regen: .03 }),
  hundunck: SH('混沌初開', '攻伐', '無', 'open', '開場一擊 ×6，無視防禦，敵人停手 1 回合', { nuke: 6, pierce: 1, stun: 1 }),
};
// 天賦神通：道體以上的體質測根骨時就帶的神通
const PHYS_SHEN = { daotai: 'tianyan', jingangdt: 'yinguo', zifu: 'lingtai', tiandu: 'guangyin', changsheng: 'kurong', zhanti: 'jinshen', wanxiang: 'sanshen', wuxingst: 'wuxinglz', tianhun: 'zhenyu', hundunti: 'hundunck', hongmeng: 'powang', taigu: 'chihuang', xinghai: 'taixu' };

// 功法專屬神通：天階功法練到第 9 層圓滿時覺醒，只能從那部功法得到（tech 標記，不進隨機池）
Object.assign(SHENS, {
  zhantian: SH('斬天一劍', '攻伐', '無', 'open', '開場斬出一道橫貫天際的劍光，攻擊力 ×9，無視防禦', { nuke: 9, pierce: 1, tech: 'jin4' }),
  jianmuct: SH('建木參天', '領域', '無', 'field', '整場每回合回血 6%，吸血 +10%', { regen: .06, steal: .1, tech: 'mu4' }),
  wanliugx: SH('萬流歸墟', '領域', '無', 'field', '整場敵人攻擊 -30%，你每回合多回 10% 法力', { foeAtk: .7, mpRegen: .1, tech: 'shui4' }),
  honglian: SH('紅蓮焚世', '攻伐', '無', 'open', '開場一擊 ×5，紅蓮業火灼燒 4 回合（每回合攻擊力 ×1.5）', { nuke: 5, burn: 1.5, tech: 'huo4' }),
  shanhezs: SH('山河鎮世', '法相', '無', 'open', '化出山河法相：6 回合攻擊 ×1.4、防禦 ×2.2，並得到四成氣血的護盾', { fa: [1.4, 2.2, 6], shield: .4, tech: 'tu4' }),
  leifa: SH('雷罰天降', '禁錮', '無', 'open', '開場一擊 ×4，敵人麻痺 3 回合', { nuke: 4, stun: 3, tech: 'lei4' }),
  yongye: SH('永夜冰封', '禁錮', '無', 'open', '冰封敵人 4 回合，並破防 30%', { stun: 4, brk: .3, tech: 'bing4' }),
  tianfengwy: SH('天風無垠', '分身', '無', 'open', '6 回合內每回合多一道風刃（八成威力）', { clone: [.8, 6, 1], tech: 'feng4' }),
  guiyizx: SH('歸一真形', '法相', '無', 'open', '混元歸一：8 回合攻擊、防禦 ×1.8，並得到三成氣血的護盾', { fa: [1.8, 1.8, 8], shield: .3, tech: 'hunyuan' }),
  wanjiebm: SH('萬劫不磨', '不滅', '無', 'lethal', '第一次受到致命傷時肉身重塑，氣血回滿', { revive: 1, tech: 'wanjie' }),
  xingdouhs: SH('星斗護身', '反彈', '無', 'field', '整場反彈 40% 傷害，敵人攻擊 -10%', { reflect: .4, foeAtk: .9, tech: 'xingdou' }),
  taichusq: SH('太初聖軀', '法相', '無', 'open', '聖軀顯化：10 回合攻擊、防禦 ×1.5', { fa: [1.5, 1.5, 10], tech: 'taichu' }),
  yishan: SH('一閃即至', '洞察', '無', 'field', '身形快到看不見：整場閃避 +30%、暴擊 +10%', { dodge: .3, crit: .1, tech: 'tianya' }),
  suodiqs: SH('縮地千山', '加速', '無', 'open', '前 5 回合每回合多出手一次', { clone: [1, 5, 1], tech: 'qianshan' }),
  jinghua: SH('鏡花替身', '不滅', '無', 'lethal', '致命一擊打在幻影上，真身回血 50%', { revive: .5, tech: 'wuxiangshen' }),
  jiankaihd: SH('劍開混沌', '攻伐', '無', 'open', '開場一劍，攻擊力 ×12', { nuke: 12, tech: 'kaitian' }),
  zhanjiejy: SH('斬劫劍域', '領域', '無', 'field', '劍域籠罩：整場暴擊 +30%，敵人防禦減半', { crit: .3, foeDef: .5, tech: 'duanjie' }),
  wentiansj: SH('問天三劍', '攻伐', '無', 'open', '前 3 回合每回合多斬一劍（一點五倍威力）', { clone: [1.5, 3, 1], tech: 'wentian' }),
  changchunbl: SH('長春不老', '長生', '無', 'field', '整場每回合回血 8%', { regen: .08, tech: 'changchun' }),
  shouyuanhj: SH('壽元化甲', '法相', '無', 'open', '把綿長的壽元化成護甲，得到等同氣血的護盾', { shield: 1, tech: 'wanshou' }),
  buxiuzl: SH('不朽真靈', '不滅', '無', 'lethal', '第一次受到致命傷時真靈不滅，回血 80%', { revive: .8, tech: 'yongsheng' }),
  danzuzh: SH('丹祖真火', '攻伐', '無', 'open', '開場噴出丹火，一擊 ×4 並灼燒 4 回合（每回合攻擊力 ×1）', { nuke: 4, burn: 1, tech: 'danzu' }),
  jiudingzy: SH('九鼎鎮元', '法相', '無', 'open', '九鼎護身：6 回合攻擊 ×1.3、防禦 ×1.8，並得到三成氣血的護盾', { fa: [1.3, 1.8, 6], shield: .3, tech: 'jiuding' }),
  baicaohc: SH('百草回春', '長生', '無', 'field', '整場每回合回血 5%、多回 8% 法力', { regen: .05, mpRegen: .08, tech: 'yaoshen' }),
  tushenyj: SH('屠神一擊', '攻伐', '無', 'open', '開場一擊 ×7，敵人破防 40%', { nuke: 7, brk: .4, tech: 'tushen' }),
  mieshisy: SH('滅世殺意', '殺伐', '無', 'field', '整場暴擊 +25%；打贏後額外得到當前境界 1% 的修為', { crit: .25, winXiu: .01, tech: 'mieshi' }),
  xuehaift: SH('血海翻騰', '吞噬', '無', 'field', '整場吸血 +35%', { steal: .35, tech: 'xuehai' }),
  tiandaocq: SH('天道垂青', '悟道', '無', 'field', '整場暴擊 +10%；打贏後額外得到當前境界 2% 的修為', { crit: .1, winXiu: .02, tech: 'tiandaolu' }),
  fatongwx: SH('法通萬象', '回法', '無', 'field', '開場法力回滿，整場術法威力 +35%', { mpFull: 1, skillUp: .35, tech: 'wanfa' }),
  huiyanzp: SH('慧眼照破', '洞察', '無', 'field', '一眼看穿破綻：整場敵人防禦 -60%、暴擊 +15%', { foeDef: .4, crit: .15, tech: 'zhihui' }),
  jubaosg: SH('聚寶神光', '機緣', '無', 'field', '打贏後拿到的靈石翻倍', { loot: 1, tech: 'jubao' }),
  tianfukk: SH('天府開庫', '機緣', '無', 'field', '打贏後靈石 +50%、掉落機率 +50%', { loot: .5, dropUp: .5, tech: 'tianfu' }),
  jixinghm: SH('吉星護命', '機緣', '無', 'field', '整場閃避 +15%，打贏後靈石 +50%', { dodge: .15, loot: .5, tech: 'jixing' }),
});
Object.assign(SHENS, {
  buzhantq: SH('不滅戰體', '反彈', '無', 'field', '肉身如混沌不壞：整場敵人攻擊 -25%，反彈 25% 傷害', { foeAtk: .75, reflect: .25, tech: 'd_wu4' }),
  shenmofx: SH('神魔法相', '法相', '無', 'open', '顯化太古神魔：8 回合攻擊 ×1.8、防禦 ×1.3', { fa: [1.8, 1.3, 8], tech: 'd_huo4' }),
  wannianyg: SH('萬念歸一', '禁錮', '無', 'open', '萬念合一刺出：攻擊力 ×6 無視防禦，敵人失神 2 回合', { nuke: 6, pierce: 1, stun: 2, tech: 'g_wu4' }),
  shenyoutx: SH('神遊太虛', '洞察', '無', 'field', '元神神遊太虛：整場閃避 +25%、暴擊 +15%', { dodge: .25, crit: .15, tech: 'g_feng4' }),
});
const TECH_SHEN = Object.fromEntries(Object.entries(SHENS).filter(([, x]) => x.tech).map(([id, x]) => [x.tech, id]));
