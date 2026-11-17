// 長生閒記：仙界篇（地仙界）的資料——仙階功法、術法、法寶、材料、丹藥、遊歷地點、秘境
// 品階：6 仙階下品、7 仙階中品、8 仙階上品（5 留給「傳說」）
GRADES.push('仙階下品', '仙階中品', '仙階上品');
const XG = [6, 7, 8];
const XF = { 6: 1.5, 7: 2.1, 8: 2.9 };        // 效果倍率（以天階為 1）
const XK = { 6: 1.2, 7: 1.4, 8: 1.7 };        // 術法威力倍率
for (const [arr, base] of [[TECH_PRICE, 4e5], [SKILL_PRICE, 2.2e5], [ART_PRICE, 4.8e5]]) { arr[5] = arr[4]; arr[6] = base; arr[7] = base * 3; arr[8] = base * 9; }
GRADE_MIN_STAGE[6] = 33; GRADE_MIN_STAGE[7] = 42; GRADE_MIN_STAGE[8] = 51;   // 人仙、地仙、真仙起
GRADE_WEIGHT[5] = 0; GRADE_WEIGHT[6] = 50; GRADE_WEIGHT[7] = 20; GRADE_WEIGHT[8] = 6;

// 照天階的範本放大：比例類（暴擊、閃避、丹毒抗性、突破率）只放大開根號倍，免得爆表
const ROOT_SCALE = ['crit', 'dodge', 'toxRes', 'brk'];
function xianScale(tpl, f) {
  const o = {};
  for (const k in tpl) {
    const v = tpl[k];
    if (typeof v !== 'number' || k === 'grade') continue;
    o[k] = ROOT_SCALE.includes(k) ? Math.round(v * Math.sqrt(f) * 1000) / 1000 : Math.round(v * f * 1000) / 1000;
  }
  return o;
}
// 功法：[範本 id, 下品名, 中品名, 上品名]
const XIAN_TECH = [
  ['jin4', '庚辛仙經', '太白鋒元錄', '金闕斬虛經'],
  ['mu4', '青華長生經', '扶桑仙木錄', '青帝回春經'],
  ['shui4', '弱水仙經', '天河引元錄', '玄冥滄海經'],
  ['huo4', '朱雀仙焰經', '離火天書', '太陽真火經'],
  ['tu4', '后土仙經', '九州載物錄', '坤元承天經'],
  ['lei4', '紫霄雷經', '九霄神霆錄', '雷樞天章'],
  ['bing4', '廣寒仙經', '太陰凝霜錄', '北冥玄冰經'],
  ['feng4', '罡風仙經', '太虛御風錄', '九天巽風經'],
  ['hunyuan', '先天一氣經', '無極元始錄', '大道無名經'],
  ['d_wu4', '不壞仙軀訣', '萬劫金身錄', '星河鍛仙體'],
  ['d_huo4', '祝融鍛身訣', '焚天仙骨錄', '太陽神軀經'],
  ['g_wu4', '照見仙心經', '一念三千錄', '太上觀妙經'],
  ['g_feng4', '逍遙神遊經', '御風觀天錄', '遊虛照神經'],
  ['tianya', '縮地成寸', '踏雲步虛', '光陰一步'],
  ['kaitian', '仙劍問心', '天河劍典', '星垂劍訣'],
  ['changchun', '蟠桃長春訣', '南極壽星經', '不老仙泉錄'],
  ['danzu', '太上丹經', '仙爐九轉錄', '造化丹書'],
  ['tushen', '戮仙錄', '血河仙經', '修羅殺典'],
  ['tiandaolu', '玄機通明經', '大道悟真錄', '天心照見經'],
  ['jubao', '仙府藏珍錄', '聚星寶鑑', '萬寶天書'],
];
for (const [tid, ...names] of XIAN_TECH) {
  const t = TECHS[tid];
  XG.forEach((g, i) => { TECHS[`x${g}_${tid}`] = { name: names[i], grade: g, type: t.type, elem: t.elem, ...xianScale(t, XF[g]) }; });
}
// 術法：[範本, 下品名, 中品名, 上品名]；範本是天階術法，威力 ×XK
const XIAN_SKILL = [
  ['poxu', '仙元一指', '太虛無相掌', '無極破空'],
  ['zhuxie', '金闕仙劍', '庚金斬天', '白虹貫日'],
  ['jianmu', '青帝神藤', '扶桑萬木', '一念枯榮'],
  ['tianhe', '弱水三千', '天河仙瀑', '滄海橫流'],
  ['dari', '朱雀焚天', '離火燎原', '金烏墜日'],
  ['zhenyue', '后土神印', '九州山河印', '崑崙鎮天'],
  ['tianfa', '紫霄神雷', '九霄雷池', '天罡五雷'],
  ['yongdong', '廣寒仙霜', '太陰寒月', '北冥封天'],
  ['gangfeng', '罡風斬', '巽風千刃', '九天颶靈'],
];
for (const [kid, ...names] of XIAN_SKILL) {
  const k = SKILLS[kid];
  XG.forEach((g, i) => { SKILLS[`x${g}_${kid}`] = { ...k, name: names[i], grade: g, pow: Math.round(k.pow * XK[g] * 100) / 100, boss: undefined }; });
}
// 體修、魂修的仙階術法
XG.forEach((g, i) => {
  SKILLS[`x${g}_ti`] = K(['仙軀崩天拳', '擎天一擊', '開天裂地'][i], g, '無', 'multi', Math.round(.9 * XK[g] * 100) / 100, 5, { hits: 4, sch: 'ti' });
  SKILLS[`x${g}_hun`] = K(['仙識鎮神', '一念鎮魂', '神照萬古'][i], g, '無', 'dmg', Math.round(4.2 * XK[g] * 100) / 100, 5, { stun: .3, sch: 'hun' });
});
// 法寶
const XIAN_ART = [
  ['taixu', '青霄仙劍', '斬虛仙劍', '天河星劍'],
  ['panlong', '蟠龍仙槍', '雷音仙杵', '天罡神戟'],
  ['jiulong', '雲紋仙甲', '玄天寶衣', '九霄仙鎧'],
  ['xingchen', '霓裳羽衣', '星斗仙袍', '太虛無縫衣'],
  ['xingpan', '乾坤仙盤', '周天璇璣', '河洛玉盤'],
  ['hunyuanzhu', '定風仙珠', '五色神珠', '九曲靈珠'],
];
for (const [aid, ...names] of XIAN_ART) {
  const a = ARTS[aid];
  XG.forEach((g, i) => { ARTS[`x${g}_${aid}`] = { name: names[i], slot: a.slot, grade: g, ...xianScale(a, XF[g]) }; });
}
// 仙界秘境頭目專屬
ARTS.yunhai = { name: '雲海鎮魂鈴', slot: '飾品', grade: 8, hp: .6, def: .4, rate: .6, shenUp: .5 };
ARTS.guixudeng = { name: '歸墟引魂燈', slot: '飾品', grade: 8, atk: .6, crit: .2, lifesteal: .08, rate: .5 };
SKILLS.yaowang = K('萬藥回春', 8, '木', 'heal', 6, 5, { boss: 1 });
SKILLS.tianheduan = K('一劍斷天河', 8, '水', 'dmg', 9, 6, { pierce: 1, boss: 1 });

// ---------- 材料、丹藥 ----------
Object.assign(ITEMS, {
  xianzhi:   { name: '雲霧仙芝', kind: 'mat', mat: 'herb', grade: 6, desc: '長在雲海裡的靈芝，煉仙階下品丹藥用。' },
  pantaohua: { name: '蟠桃仙花', kind: 'mat', mat: 'herb', grade: 7, desc: '仙桃樹上落下的花，煉仙階中品丹藥用。' },
  jiuqiaocao: { name: '九竅仙草', kind: 'mat', mat: 'herb', grade: 8, desc: '九片葉子各開一竅，煉仙階上品丹藥用。' },
  yunjin:    { name: '雲紋仙金', kind: 'mat', mat: 'ore', grade: 6, desc: '雲海島上採出的金，煉仙階下品法寶用。' },
  tianhesha: { name: '天河星砂', kind: 'mat', mat: 'ore', grade: 7, desc: '天河底下沉積的星砂，煉仙階中品法寶用。' },
  guixujing: { name: '歸墟玄晶', kind: 'mat', mat: 'ore', grade: 8, desc: '歸墟邊上結出的晶，煉仙階上品法寶用。' },
  dujiedan:  { name: '渡劫仙丹', kind: 'dan', fx: 'jiedan', base: 1.5e5, xian: 1, desc: '下一次渡仙劫時，氣血、攻擊、防禦 +15%（服下後一直有效，直到渡劫）。' },
  xianshou:  { name: '延壽仙丹', kind: 'xlife', base: 2e5, xian: 1, desc: '仙人的延壽丹：壽元 +300 年。每一世最多吃 3 顆。' },
});
MAT_HERB[6] = 'xianzhi'; MAT_HERB[7] = 'pantaohua'; MAT_HERB[8] = 'jiuqiaocao';
MAT_ORE[6] = 'yunjin'; MAT_ORE[7] = 'tianhesha'; MAT_ORE[8] = 'guixujing';
MAT_PRICE[6] = 5e4; MAT_PRICE[7] = 1.2e5; MAT_PRICE[8] = 3e5;
for (const arr of [BREW_SEC, BREW_RATE, BREW_XP, FORGE_ORE]) { arr[5] = arr[4]; }
BREW_SEC[6] = 75; BREW_SEC[7] = 90; BREW_SEC[8] = 120;
BREW_RATE[6] = .32; BREW_RATE[7] = .28; BREW_RATE[8] = .24;
BREW_XP[6] = 30; BREW_XP[7] = 45; BREW_XP[8] = 60;
FORGE_ORE[6] = 6; FORGE_ORE[7] = 7; FORGE_ORE[8] = 8;
for (let i = XIAN_MJ; i < XIU_PILLS.length; i++) RECIPES[XIU_PILLS[i]] = { g: XIAN_GRADE[i], n: 3 };
RECIPES.dujiedan = { g: 6, n: 5 }; RECIPES.xianshou = { g: 7, n: 5 };

// ---------- 遊歷地點、秘境 ----------
PLACES.push(
  { id: 'fuyun', name: '浮雲殘島', min: 33, lv: 36, mult: 1, foes: [['雲中蜃獸', '風'], ['墮仙殘魂', '無'], ['風雷雕', '雷']], grades: [4, 6], xian: 1 },
  { id: 'wanyao', name: '萬藥仙谷', min: 42, lv: 45, mult: 1.05, foes: [['千年藥靈', '木'], ['守谷仙傀', '土'], ['毒霧蛟', '水']], grades: [6, 7], xian: 1 },
  { id: 'tianhe', name: '天河古渡', min: 51, lv: 54, mult: 1.1, foes: [['天河水妖', '水'], ['擺渡陰靈', '冰'], ['星砂巨蟹', '金']], grades: [7, 8], xian: 1 },
  { id: 'guixu', name: '歸墟之畔', min: 60, lv: 63, mult: 1.15, foes: [['歸墟古獸', '土'], ['吞仙蜃', '火'], ['迷失的真仙', '無']], grades: [8], xian: 1 },
);
const XIAN_SECRETS = [
  { id: 'yunhai', mj: 9, name: '雲海仙宮', elem: '風', elites: ['仙宮金甲衛', '雲海巡天使'], boss: '仙宮殘靈', uniq: ['art', 'yunhai'], desc: '雲海深處的一座空宮，宮主早就隕落了，宮裡的禁制還記得他。' },
  { id: 'yaowang', mj: 10, name: '藥王洞天', elem: '木', elites: ['藥人', '洞天藥傀'], boss: '萬年藥王', uniq: ['skill', 'yaowang'], desc: '一株藥草修成了仙，把整座洞天都種成了它的藥園。' },
  { id: 'xingdu', mj: 11, name: '星河斷渡', elem: '水', elites: ['斷渡水鬼', '星河守橋將'], boss: '斷渡擺渡人', uniq: ['skill', 'tianheduan'], desc: '天河在這裡斷了一截，擺渡人還在等最後一個客人。' },
  { id: 'guixuyan', mj: 12, name: '歸墟深淵', elem: '無', elites: ['淵底殘仙', '吞名之影'], boss: '歸墟守淵者', uniq: ['art', 'guixudeng'], desc: '被劃掉名字的仙人，最後都沉到了這裡。' },
];

// ---------- 仙籍：名冊、差事、仙功兌換 ----------
// 名冊：凡界的重要人物，依你們的結局，名字在碑上（1）、被劃掉（-1）、或根本不在仙籍上（0）
const XIANJI = {
  su: { cultivated: [1, '名字在碑上，刻得很淺，像是剛刻上去不久。她說換她等你，好像真的等到了。'], mortal: [0, '仙籍上找不到她。凡人的名字，不會上碑。'], faded: [0, '仙籍上找不到她。她大概在凡間過完了安穩的一輩子。'], ignored: [0, '仙籍上找不到她。'] },
  mu: { together: [-1, '名字刻上去過，又被劃掉了。劃痕很新，旁邊還留著一點沒擦乾淨的血色。'], parted: [1, '名字在碑上。魔門出身的人上碑的不多，她是其中一個。'], betrayed: [-1, '名字被劃掉了。你不知道該不該覺得意外。'], abandoned: [0, '仙籍上找不到她。'] },
  ye: { zhiji: [1, '名字在碑上，旁邊有人用指甲刻了一柄小劍。'], rival: [1, '名字刻得很深，一筆一畫都像在跟誰較勁。'], grudge: [-1, '名字被劃掉了。劃痕是一道劍痕。'] },
  hu: { friend: [0, '仙籍上沒有他。可仙界的坊市裡，居然有一間掛著「胡記」招牌的老鋪子。'], debt: [0, '仙籍上沒有他。你懷疑那張欠條，最後是要你自己來還。'], gone: [0, '仙籍上沒有他。這倒一點也不奇怪。'] },
  xie: { redeemed: [1, '名字在碑上。你給他的那一條路，他走到了盡頭。'], slain: [0, '仙籍上找不到他。'], demon: [-1, '他說在上面等你。名字刻上去過，又被劃掉了——他沒等到。'] },
  shen: { founded: [1, '名字在碑上，下面還跟著一長串她宗門裡的名字。'], free: [0, '仙籍上找不到她。自由的人，大概也不想上碑。'], elder: [-1, '名字被劃掉了。玄霄宗的長老，最後也沒能撐過仙劫。'] },
  yin: { honest: [0, '仙籍上找不到她。藥鋪大概還開著。'], vanish: [-1, '名字刻上去過，又被劃掉了。名單上的人，最後一個是她自己。'], queen: [1, '名字在碑上。仙界的消息，好像也有一半是從她那裡傳出來的。'] },
  lu: { crossed: [0, '仙籍上沒有他——偷渡上來的人沒有仙籍。可你在仙界的茶館裡，聽過有人提起一個姓陸的書生。'], scholar: [0, '仙籍上找不到他。那些抄本，你還留著。'] },
  gu: { ascended: [1, '名字就刻在你名字的上面一行。她先上來了。'], fallen: [-1, '名字被劃掉了。劃痕的位置，正好是第九道雷落下的地方。'], stranger: [1, '名字在碑上。你盯著那三個字看了很久，心口一陣發緊，卻想不起為什麼。'] },
  bei: { vow: [0, '仙籍上沒有守碑人的名字。好像他從來就不在這張名單上。'], left: [0, '仙籍上沒有守碑人的名字。好像他從來就不在這張名單上。'] },
};
// 差事：g 是基本仙功
const XJ_TASKS = [
  { id: 'men', name: '巡守天門', desc: '天門外常有妖物想趁隙上來，要打一場。', run(s, g) { return battle('天門外的妖物', placeLv() + 1, 1.1) ? g * 1.5 : 0; } },
  { id: 'dang', name: '整理仙籍', desc: '幫接引仙官整理仙籍舊檔，不用打架，仙功少一點。', run(s, g) { return g * .7; } },
  { id: 'ya', name: '押送仙材', desc: '把一批仙材送去萬藥仙谷，路上可能遇到劫道的散仙；自己能分到兩份材料。', run(s, g) { if (Math.random() < .5 || battle('劫道的散仙', placeLv(), 1)) { addMat(matGrade(s), Math.random() < .5 ? 'herb' : 'ore', 2); return g; } return 0; } },
];
const XJ_TASK_CD = 20;   // 差事冷卻（仙界的年，線上約 2 分鐘）
const XJ_TECH_COST = { 6: 150, 7: 400, 8: 1000 };
