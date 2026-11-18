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
  ['tianya', '空間摺疊', '踏雲步虛', '光陰一步'],
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
  ['zhuxie', '金闕仙劍', '庚金斬天', '白虹仙劍訣'],
  ['jianmu', '青帝神藤', '扶桑萬木', '一念枯榮'],
  ['tianhe', '弱水仙瀾', '天河仙瀑', '滄海橫流'],
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
  ['xingchen', '流霞仙衣', '星斗仙袍', '太虛無縫衣'],
  ['xingpan', '乾坤仙盤', '周天璇璣', '河洛玉盤'],
  ['hunyuanzhu', '定風仙珠', '五色神珠', '九曲靈珠'],
];
for (const [aid, ...names] of XIAN_ART) {
  const a = ARTS[aid];
  XG.forEach((g, i) => { ARTS[`x${g}_${aid}`] = { name: names[i], slot: a.slot, grade: g, ...xianScale(a, XF[g]) }; });
}
// 仙界秘境頭目專屬
ARTS.yunhai = { name: '雲海鎮魂鈴', slot: '飾品', grade: 8, hp: .6, def: .4, rate: .6, shenUp: .5, boss: 1 };   // 雲海仙宮頭目專屬
ARTS.wanyaohu = { name: '萬藥葫', slot: '飾品', grade: 8, hp: .8, def: .4, rate: .5, boss: 1 };   // 藥王洞天頭目專屬（原本給仙術，仙界改成只有一招）
ARTS.baiduji = { name: '擺渡古槳', slot: '武器', grade: 8, atk: .8, crit: .15, rate: .5, boss: 1 };   // 星河斷渡頭目專屬
ARTS.guixudeng = { name: '歸墟引魂燈', slot: '飾品', grade: 8, atk: .6, crit: .2, lifesteal: .08, rate: .5, boss: 1 };   // 歸墟頭目專屬
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
  dujiedan:  { name: '渡劫仙丹', kind: 'dan', fx: 'jiedan', base: 1.5e5, xian: 1, desc: '下一次渡仙劫的成功率 +15%（服下後一直有效，直到渡劫）。' },
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
  { id: 'fuyun', name: '浮雲殘島', min: 33, lv: 36, mult: 1, foes: [['雲中蜃獸', '風'], ['墮仙殘魂', '無'], ['風雷雕', '雷']], grades: [6], xian: 1 },
  { id: 'wanyao', name: '萬藥仙谷', min: 42, lv: 45, mult: 1.05, foes: [['千年藥靈', '木'], ['守谷仙傀', '土'], ['毒霧蛟', '水']], grades: [6, 7], xian: 1 },
  { id: 'tianhe', name: '天河古渡', min: 51, lv: 54, mult: 1.1, foes: [['天河水妖', '水'], ['擺渡陰靈', '冰'], ['星砂巨蟹', '金']], grades: [7, 8], xian: 1 },
  { id: 'guixu', name: '歸墟之畔', min: 60, lv: 63, mult: 1.15, foes: [['歸墟古獸', '土'], ['吞仙蜃', '火'], ['迷失的真仙', '無']], grades: [8], xian: 1 },
);
const XIAN_SECRETS = [
  { id: 'yunhai', mj: 9, name: '雲海仙宮', elem: '風', elites: ['仙宮金甲衛', '雲海巡天使'], boss: '仙宮殘靈', uniq: ['art', 'yunhai'], desc: '雲海深處的一座空宮，宮主早就隕落了，宮裡的禁制還記得他。' },
  { id: 'yaowang', mj: 10, name: '藥王洞天', elem: '木', elites: ['藥人', '洞天藥傀'], boss: '萬年藥王', uniq: ['art', 'wanyaohu'], desc: '一株藥草修成了仙，把整座洞天都種成了它的藥園。' },
  { id: 'xingdu', mj: 11, name: '星河斷渡', elem: '水', elites: ['斷渡水鬼', '星河守橋將'], boss: '斷渡擺渡人', uniq: ['art', 'baiduji'], desc: '天河在這裡斷了一截，擺渡人還在等最後一個客人。' },
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
const XJ_TASK_CD = 100;   // 差事冷卻（仙界的年，線上約 10 分鐘）
const XJ_TECH_COST = { 6: 150, 7: 400, 8: 1000 };

// ---------- 仙界遊歷事件（e.xian：只在仙界出現；凡界的事件在仙界不會出現） ----------
const xgr = () => [XIAN_GRADE[stg().major]];
const addGong = n => { const s = L(); if (s.xj) s.xj.gong += n; return n; };
EVENTS.push(
  { id: 'xj_bottle', xian: 1, title: '雲海漂瓶', text: '一個玉瓶在雲海上漂過來，瓶口封著蠟，裡面捲著一張紙。', choices: [
    { t: '打開來看', run() { return pct(.5) ? `紙上抄著半部功法，另一半是一行字：「給下一個撿到的人。」你得到${giftTech(xgr())}。` : '紙上只寫了一句：「今天天氣很好。」你看著雲海，覺得寫的人說得沒錯。'; } },
    { t: '讓它漂走', run() { return '玉瓶慢慢漂遠了。也許有人比你更需要它。'; } }] },
  { id: 'xj_star', xian: 1, title: '天河釣叟', text: '天河邊上，一個老頭拿著沒有鉤的竿子在釣星星，旁邊的魚簍裡居然真的有幾顆在發光。', choices: [
    { t: '坐下來陪他釣', run() { return pct(.4) ? `老頭把一顆星星塞給你：「拿去用。」你得到${giftArt(xgr())}。` : `一個下午過去，一顆也沒釣到。但你的心靜了許多，修為 +${fmt(addXiu(.2))}。`; } },
    { t: '問他怎麼釣的', run() { return '「用心釣。」老頭說完就收竿走了。你在原地想了很久，還是沒想明白。'; } }] },
  { id: 'xj_feast', xian: 1, title: '仙宴請柬', text: '一隻青鳥叼來一張請柬，某位真仙在雲頂開宴，請各路新晉的仙人去坐坐。', choices: [
    { t: '赴宴', run(s) { const n = addStone(stoneUnit(topPlace().lv) * 8); s.tox = Math.min(100, s.tox + 20); return `席上的仙釀太烈，你喝得頭昏腦脹，丹毒 +20。散席時主人塞給每個人一個紅包，你得到仙元石 ${n}。`; } },
    { t: '婉拒', run() { return '你回了一封客氣的信。青鳥看起來有點失望。'; } }] },
  { id: 'xj_fallen', xian: 1, title: '沒有仙籍的人', text: '坊市角落蹲著一個衣衫破舊的仙人。他說他的名字被劃掉了，卻不知為何沒有墜回凡界，只能在仙界躲躲藏藏。', choices: [
    { t: '給他一些仙元石', run(s) { const n = Math.min(s.stone, 50); s.stone -= n; return pct(.5) ? `他收下仙元石 ${n}，指點了你幾處修行上的關竅，那是他從前的本事。修為 +${fmt(addXiu(.3))}。` : `他收下仙元石 ${n}，什麼也沒說就消失在人群裡。`; } },
    { t: '報給仙官', run() { return `仙官派人把他帶走了，記了你仙功 ${addGong(15)}。你回頭看了一眼，他也正看著你。`; } }] },
  { id: 'xj_peach', xian: 1, title: '蟠桃落果', text: '一顆熟透的仙桃從雲上掉下來，正好滾到你腳邊，香得整條路都是甜味。', choices: [
    { t: '吃掉它', run() { addLife(150); return '一口下去，滿嘴生津，身上的倦意一掃而空。壽元 +150 年。'; } },
    { t: '拿去坊市賣', run() { return `識貨的掌櫃出了好價錢，仙元石 ${addStone(stoneUnit(topPlace().lv) * 10)}。`; } }] },
  { id: 'xj_crane', xian: 1, title: '送錯的信', text: '一隻仙鶴把信送到你手上，收信人卻不是你。信封上的名字，你在仙籍背面見過——已經被劃掉了。', choices: [
    { t: '替他收著', run(s) { s.flags.x_letter = 1; return '你把信收好。也許哪一天，會有人來問。'; } },
    { t: '交給仙官', run() { return `仙官看了一眼信封，沉默了很久，記了你仙功 ${addGong(10)}。「謝謝，」他說，「我會轉交的。」你不知道他要轉交給誰。`; } }] },
  { id: 'xj_jiecloud', xian: 1, title: '劫雲殘片', text: '別人渡完仙劫，留下一小團還在劈啪作響的劫雲，懶洋洋地掛在山頭。', choices: [
    { t: '引一道雷淬身', run(s) { if (pct(.6)) { s.body += .02; return '雷光從頭頂灌到腳底，你咬牙撐住了，肉身更凝實了一分（氣血、攻擊、防禦永久提升）。'; } injure(300); return '這一道雷比你想的兇，你被劈得半天爬不起來。'; } },
    { t: '繞道走', run() { return '仙劫的殘雲你也敢碰？你繞了一大圈。'; } }] },
  { id: 'xj_gamble', xian: 1, title: '仙市賭石', text: '攤子上擺著一堆灰撲撲的石頭，攤主說裡面可能藏著仙器，一塊五十仙元石。', choices: [
    { t: '挑一塊', run(s) { if (s.stone < 50) return '你摸了摸錢袋，不夠，只好走了。'; s.stone -= 50; return pct(.3) ? `刀一劃開，石頭裡亮起光來——${giftArt(xgr())}！` : '切開來，裡面還是石頭。攤主笑得很開心。'; } },
    { t: '看別人賭', run() { return '你看了一下午，切出寶貝的只有一個人，而那個人好像是攤主的親戚。'; } }] },
  { id: 'xj_patrol', xian: 1, title: '天兵查籍', text: '一隊天兵攔住你，要查你的仙籍。帶頭的翻來翻去，好像在找什麼毛病。', choices: [
    { t: '老實配合', run() { return pct(.7) ? '他們什麼也沒查到，揮手放行。' : `他們說你的仙籍「有疑點」，扣了你半天，臨走才說是看錯了。白白耽誤了修煉，修為只多了 ${fmt(addXiu(.05))}。`; } },
    { t: '塞點仙元石', run(s) { const n = Math.min(s.stone, 30); s.stone -= n; return `帶頭的收下仙元石 ${n}，咳了一聲，查都沒查就讓開了。`; } }] },
  { id: 'xj_beiying', xian: 1, title: '雲裡的碑影', text: '傍晚的雲層裡，忽然浮出一塊碑的影子，大得遮住了半邊天。路過的仙人都低著頭走，沒有人敢多看。', choices: [
    { t: '抬頭看', run() { S.meta.dao += 1; return '你看了很久。碑影上的名字一個一個熄滅、又一個一個亮起。你好像懂了什麼，又說不出來。道心 +1。'; } },
    { t: '跟著低頭走', run() { return '你低著頭走過去。可那塊碑的影子，好像一直跟在你身後。'; } }] },
  { id: 'xj_oldcave', xian: 1, title: '古仙洞府', text: '山腹裡有一座封了很久的洞府，門上的禁制已經很淡了，裡面隱約有東西在動。', choices: [
    { t: '破禁進去', run() { if (battle('洞府的守門傀儡', placeLv() + 1, 1.15)) return `你擊碎了傀儡。洞府的主人早就不在了，只留下${giftTech(xgr())}。`; return '傀儡比你想的難纏，你負傷退了出來。'; } },
    { t: '不打擾', run() { return '你在門口拜了拜。禁制閃了一下，像是在回禮。'; } }] },
  { id: 'xj_prayer', xian: 1, title: '凡間的香火', text: '修煉時，你忽然聽見很遠很遠的地方有人在喊一個名字。那是你某一世的名字，凡間居然還有人在拜你。', choices: [
    { t: '回應那一聲', run() { addLife(80); return '你把一縷仙氣送下凡間。那一頭的哭聲停了，換成了笑聲。你自己也覺得輕鬆了一些，壽元 +80 年。'; } },
    { t: '當作沒聽見', run() { return `你繼續閉關。那一聲喊得越來越遠，最後聽不見了。修為 +${fmt(addXiu(.15))}。`; } }] },
  { id: 'xj_cub', xian: 1, title: '迷路的仙獸', text: '一隻毛茸茸的小仙獸咬住你的衣角不放，看起來是跟家人走散了。', choices: [
    { t: '送牠回家', run() { if (battle('護崽的仙獸', placeLv(), 1)) return `大仙獸把你當成了壞人，打了一架才說清楚。牠們臨走前留下${giftArt(xgr(), '飾品')}。`; return '大仙獸把你揍了一頓，叼著小的走了。'; } },
    { t: '讓牠自己找', run() { return '小仙獸在原地坐了一會兒，搖搖晃晃地走了。'; } }] },
  { id: 'xj_leichi', xian: 1, title: '天雷池', text: '山頂有一池雷水，水面上滾著細細的電光。據說泡過的人，渡仙劫時會從容一些。', choices: [
    { t: '泡進去', run(s) { if (jieNext(s) && s.xiu >= stg(s).need) { s.press = Math.min(pressCap(), (s.press || 0) + .1); return '電流在經脈裡亂竄，你咬牙撐了一炷香，劫前淬鍊 +10%。'; } if (s.stage >= STAGES.length - 1) return '你泡了一炷香。上面已經沒有劫可以渡了，雷水只讓你精神一振。'; injure(120); return '你泡了一炷香，全身發麻。修為還沒到大圓滿，這池雷水對你來說只是受罪。'; } },
    { t: '看看就好', run() { return '池子裡有個人泡得滿臉通紅，對你招手。你搖搖頭走了。'; } }] },
  { id: 'xj_echo', xian: 1, min: 51, title: '歸墟回聲', text: '風從歸墟的方向吹來，裡面夾雜著很多人說話的聲音，有哭有笑，聽不清在說什麼。', choices: [
    { t: '停下來聽', run() { return `你聽了很久，聽出其中一句是：「別讓他們忘了我。」你把這句話記在心裡，修為 +${fmt(addXiu(.3))}。`; } },
    { t: '摀住耳朵', run() { return '你快步走開。那些聲音沒有追上來，只是一直在那裡。'; } }] },
);

// ---------- 主線節點 7～10（仙界） ----------
// 新人物：接引仙官、仙友晏青蘿、上古仙人，各自只在這幾段登場
const xs_ = () => S.meta.story || {};
const xsMark = id => { (S.meta.story = S.meta.story || {})[id] = 1; };   // 節點裡的小段落：只記進度，不進輪迴錄
const defy = () => { S.meta.defy = (S.meta.defy || 0) + 1; };   // 對抗的選擇，留給第二批「破天」結局
const XIAN_STORY = [
  { id: 'n7', title: '仙籍', cond: s => isXian(s) && !s.flags.xn7,   // 每一世進仙界都會先遇到
    text: '一個穿灰袍的仙官在天門後等你，手裡捧著一本厚得驚人的冊子。「新來的？名字。」他翻開冊子——你的名字已經在上面了，墨跡還沒乾。你伸手去翻背面，背面密密麻麻全是劃痕，一道疊著一道。仙官「啪」地合上冊子：「仙籍跟碑是同一塊東西。正面記活著的，背面記劃掉的。別亂翻。」',
    choices: [
      { t: '問他背面是什麼', run(s) { storyMark('n7'); s.flags.xn7 = 1; xjOpen(s); return '「背面是回收的帳。」他說完才發覺說溜了嘴，揮揮手要你走。從那天起，仙籍上的差事都歸他派給你（上方「仙籍」）。'; } },
      { t: '默默記下', run(s) { storyMark('n7'); s.flags.xn7 = 1; xjOpen(s); addItem('dujiedan'); return '你沒有多問。仙官看了你一眼，好像有點意外，塞給你一顆渡劫仙丹：「第一次渡仙劫的時候吃。」從那天起，仙籍上的差事都歸他派給你（上方「仙籍」）。'; } }] },
  { id: 'n8a', title: '釣雲的人', cond: s => isXian(s) && s.stage >= 37 && xs_().n7 && !xs_().n8a,
    text: '浮雲殘島的懸崖邊，一個女仙拿著竿子在釣雲。「雲裡有魚，你信不信？」她叫晏青蘿，比你早三百年飛升，說起話來卻像個沒長大的孩子。',
    choices: [
      { t: '陪她釣', run() { xsMark('n8a'); return `一整天什麼也沒釣到，她卻笑得很開心，說你是她在仙界交到的第一個朋友。修為 +${fmt(addXiu(.3))}。`; } },
      { t: '笑她傻', run() { xsMark('n8a'); return '「仙界的日子太長了，」她把竿子插進雲裡，「不找點傻事做，會瘋的。」'; } }] },
  { id: 'n8b', title: '第一衰', cond: s => isXian(s) && s.stage >= 41 && xs_().n8a && !xs_().n8b,
    text: '再見到晏青蘿，她的衣角沾著一點灰，怎麼拂也拂不掉。她自己先笑了：「天人五衰，第一衰。」她算過，自己還剩不到一百年。',
    choices: [
      { t: '替她找延壽的法子', run() { xsMark('n8b'); return '你跑遍了仙界的坊市和藥園，找來的延壽仙丹她一顆也沒吃：「仙丹是給還有路走的人吃的。我的路，到這裡就好。」'; } },
      { t: '陪她把剩下的日子過完', run() { xsMark('n8b'); addLife(50); return '你們把仙界能去的地方都走了一遍。她說這樣就夠了。你也覺得，這些年過得比哪一世都慢。壽元 +50 年。'; } }] },
  { id: 'n8c', title: '隕落', cond: s => isXian(s) && s.stage >= 43 && xs_().n8b && !xs_().n8,
    text: '那天天門外起了風。晏青蘿的名字，在仙籍上被一筆劃掉。她站過的地方空了，四周的仙靈之氣卻忽然濃了一截，濃到你的修為都跟著漲。仙官站在你身後，聲音很輕：「這就是回收。仙界的靈氣，就是這麼來的。」',
    choices: [
      { t: '揪住仙官的領子', run() { xsMark('n8c'); storyMark('n8'); defy(); return '「誰定的規矩？」仙官沒有掙開，只說：「比我老的人。」你鬆開手。那一截靈氣還留在你身上，燙得發疼。'; } },
      { t: '收下這份靈氣', run() { xsMark('n8c'); storyMark('n8'); return `你閉上眼，把那一截靈氣收進丹田。這是她留下的最後一點東西。修為 +${fmt(addXiu(.6))}。`; } }] },
  { id: 'n9', title: '舊檔', cond: s => isXian(s) && s.stage >= 45 && xs_().n7 && !xs_().n9,
    text: '仙官派給你一件差事：把積了上萬年的舊檔搬去焚掉。你在一堆發黃的冊子裡，看見了自己的名字——不是這一世的，是很久以前的。那一頁記著你上次成仙的年月、渡過的劫，最後一行是硃筆的批註：「隕。真靈缺一縷，不知去向。」',
    choices: [
      { t: '把那一頁撕下來收好', run() { storyMark('n9'); S.meta.n9keep = 1; return '你把那一頁折好，貼身收著。真靈缺了一縷——缺的那一縷，去哪了？'; } },
      { t: '照規矩燒掉', run() { storyMark('n9'); return '火光吞掉了那一頁。燒完之後，你才發現自己的手在抖。可那一行硃筆字，你已經記住了。'; } }] },
  { id: 'n10a', title: '誰藏了你・仙官', cond: s => isXian(s) && s.stage >= 47 && xs_().n9 && !xs_().n10a,
    text: '你去問仙官，當年那一縷真靈是不是他拿的。他看了你很久，嘆了口氣，打開自己的仙籍——裡面夾著幾十頁從舊檔撕下來的紙，都是被劃掉的名字。「我能做的，只是不讓它們被燒掉。」他說，「你要找的人，不是我。」',
    choices: [
      { t: '請他幫你查', run() { xsMark('n10a'); S.meta.n10aLife = S.meta.lives; addGong(30); return '他答應替你留意，還多記了你一筆仙功。臨走前他說：「當年劃掉你名字的，是一位很老的仙人。去問他吧——如果他還願意見你。」'; } },
      { t: '說他也是幫兇', run() { xsMark('n10a'); S.meta.n10aLife = S.meta.lives; defy(); return '「我是。」他沒有否認，「可你要找的人不是我。去問劃掉你名字的那位老仙人吧。」'; } }] },
  { id: 'n10b', title: '誰藏了你・上古仙人', cond: s => isXian(s) && s.stage >= 47 && xs_().n10a && S.meta.lives > (S.meta.n10aLife || 0) && !xs_().n10b,
    text: '你在一座沒有名字的山頂找到那位上古仙人。他老得連鬍鬚都是透明的。「你的名字，是我劃的。」他說得很平靜，「碑上容不下那麼多人，該劃就劃。可我劃完以後回頭再看——那一道劃痕底下，少了一縷東西。不是我拿的。」',
    choices: [
      { t: '問那一縷去了哪', run() { xsMark('n10b'); S.meta.n10bLife = S.meta.lives; return '「碑知道。」他閉上眼睛，「守碑的人也知道。」'; } },
      { t: '對他出手', run() { xsMark('n10b'); S.meta.n10bLife = S.meta.lives; defy(); injure(300); return '你出手了。他只抬了抬手指，你就跪在了地上。「年輕人，」他說，「恨我沒有用。去找守碑的。」'; } }] },
  { id: 'n10c', title: '誰藏了你・守碑人', cond: s => isXian(s) && s.stage >= 47 && xs_().n10b && S.meta.lives > (S.meta.n10bLife || 0) && !xs_().n10,
    text: '你翻遍了仙籍，沒有一個名字叫守碑人。仙官說，仙界從來沒有人見過他；上古仙人說，他比碑還老。那天夜裡，你又夢到那塊碑。碑前坐著一個老人，背影你很熟，熟得像在照鏡子。醒來時，你發現仙籍背面多了一行字，是你自己的筆跡：「去天上找他。」',
    choices: [
      { t: '把這行字留著', run() { xsMark('n10c'); storyMark('n10'); return '這是你留給自己的話。你還想不起來，是什麼時候寫的。（仙界篇下半部：登天之後，會再見到他。）'; } },
      { t: '劃掉它', run() { xsMark('n10c'); storyMark('n10'); return '你一筆劃掉那行字。劃痕底下，墨跡又慢慢浮了出來。（仙界篇下半部：登天之後，會再見到他。）'; } }] },
];

// ---------- 仙版雜丹：成仙以後只煉得了仙丹，凡界雜丹各有一個仙階版本（效果加倍或更強） ----------
// [凡界丹, 仙丹 id, 名字, 品階, 價格（靈石計，換算仙元石除以 100）, 說明, 額外欄位]
const XIAN_DAN = [
  ['julingdan', 'x_julingdan', '聚元丹', 6, 3e4, '接下來 10 分鐘修煉速度 +100%。'],
  ['qizhidan', 'x_qizhidan', '開明仙丹', 6, 3e4, '接下來 10 分鐘功法精進 ×3。'],
  ['kuangxue', 'x_kuangxue', '戰仙丹', 6, 2.5e4, '接下來 10 分鐘攻擊 +60%，但防禦 -10%。'],
  ['jingangdan', 'x_jingangdan', '不壞仙丹', 6, 2.5e4, '接下來 10 分鐘防禦 +80%。'],
  ['ningshendan', 'x_ningshendan', '凝元仙丹', 6, 2.5e4, '接下來 10 分鐘法力上限 +100%。'],
  ['huichundan', 'x_huichundan', '回天丹', 6, 2e4, '立刻回滿氣血和法力。'],
  ['qingxindan', 'x_qingxindan', '淨塵丹', 6, 2.5e4, '丹毒 -60%，本身沒有丹毒。', { amt: 60 }],
  ['wudao', 'x_wudao', '悟真仙丹', 6, 4e4, '主修功法立刻精進 30 分鐘的進度（主修圓滿了就平分給輔修）。', { amt: 1800 }],
  ['yinyuan', 'x_yinyuan', '牽緣仙丹', 7, 4e4, '接下來 10 分鐘奇遇頻率 ×3。'],
  ['xunbaodan', 'x_xunbaodan', '探寶仙丹', 7, 4e4, '接下來 10 分鐘掉落機率 ×3。'],
  ['xisui', 'x_xisui', '脫胎仙丹', 7, 8e4, '這一世氣血、攻擊、防禦永久 +6%，有丹毒。', { amt: .06 }],
  ['pozhang', 'x_pozhang', '破關仙丹', 7, 6e4, '下一次小境界突破必定成功。'],
  ['xingshen', 'x_xingshen', '通神丹', 8, 1e5, '下一場戰鬥，每門神通可以發動兩次。'],
  ['zhuyan', 'x_zhuyan', '還童仙丹', 8, 1.2e5, '年齡 -150 歲。', { amt: 150 }],
  ['tianjidan', 'x_tianjidan', '天機仙丹', 8, 1e5, '下一次坊市換貨，功法、法寶的第一格都保證中品以上。'],
];
for (const [src, id, name, g, base, desc, ex] of XIAN_DAN) {
  const o = ITEMS[src];
  ITEMS[id] = { ...o, name, base, desc, xian: 1, ...(ex || {}) };
  RECIPES[id] = { g, n: RECIPES[src].n + 2 };
}
const X_DAN_COMMON = XIAN_DAN.filter(x => !ITEMS[x[0]].rare).map(x => x[1]);
const X_DAN_RARE = XIAN_DAN.filter(x => ITEMS[x[0]].rare).map(x => x[1]);

// ---------- 陣法：成仙以後可以從天階再升三級（仙階下、中、上品），升到仙階的那座換成仙界的名字 ----------
const XIAN_ARR_NAME = { juling: '聚元陣', yaoyuan: '仙藥園', kuangmai: '仙礦', danshi: '仙丹室', dihuo: '天火陣', hushan: '護山大陣' };
ARRAY_GROW.push(25, 20, 15);
ARRAY_STONE.push(5e5, 1.5e6, 4.5e6);
const arrLvGrade = l => l <= 4 ? l : l + 1;   // 陣法等級對應的材料品階（5 級起是仙階 6～8）

// ---------- 仙界奇遇（第二批）＋可以重複的奇遇 ----------
// 仙界一世很長，大部分奇遇可以重複（一世最多 4 次，至少隔 400 年；給道心、永久屬性的不重複）
EVENTS.push(
  { id: 'xj_stall', xian: 1, repeat: 1, title: '雲市擺攤', text: '雲市裡空出一個攤位，旁邊的攤主說：「不用錢，擺一天試試？」', choices: [
    { t: '擺一天', run() { return `你把用不到的小東西擺出來，一天下來，賺了仙元石 ${addStone(stoneUnit(topPlace().lv) * 6)}。`; } },
    { t: '幫隔壁顧攤', run() { return `隔壁攤主去喝酒，你替他顧了一天。他回來塞給你仙元石 ${addStone(stoneUnit(topPlace().lv) * 3)}，還有一句「改天請你喝」。`; } }] },
  { id: 'xj_downward', xian: 1, repeat: 1, title: '下凡的請託', text: '一個年輕仙人求你幫忙：他在凡間的老母親快不行了，他自己下不去，想託你帶一句話。', choices: [
    { t: '替他走一趟', run() { addLife(60); return '你偷偷下了一趟凡間，把話帶到了。老太太笑著閉上了眼。回來的路上，你覺得自己也年輕了一些，壽元 +60 年。'; } },
    { t: '勸他別掛念', run() { return `「仙凡有別。」你說。他沉默了很久，最後向你道謝。你自己卻有點靜不下心，修為只長了 ${fmt(addXiu(.05))}。`; } }] },
  { id: 'xj_sword', xian: 1, repeat: 1, title: '天河漂來的劍', text: '天河上漂來一柄斷劍，劍身上還刻著半個名字，另外半個被水磨掉了。', choices: [
    { t: '撈起來', run() { return pct(.4) ? `你把劍撈上來，劍匣裡還藏著一件東西：${giftArt(xgr(), '武器')}。` : '只是一柄普通的斷劍。你把它插在岸邊，當作一座小小的墳。'; } },
    { t: '讓它漂走', run() { return '劍順著天河漂遠了，不知道要漂到哪裡去。'; } }] },
  { id: 'xj_child', xian: 1, repeat: 1, title: '迷路的仙童', text: '一個扎著雙髻的仙童蹲在路邊哭，說他師父讓他去採仙草，他找不到路了。', choices: [
    { t: '帶他去採', run() { addMat(matGrade(), 'herb', 2); return '你陪他採了一籃仙草，他分了你兩份，還說長大要拜你當師父。'; } },
    { t: '送他回去', run() { return `他師父是一位脾氣很好的老仙，留你喝了一壺茶，記了你仙功 ${addGong(8)}。`; } }] },
  { id: 'xj_chess', xian: 1, repeat: 1, title: '仙棋殘局', text: '松樹下擺著一盤沒下完的棋，兩邊的棋手都不見了，棋子上落滿了松針。', choices: [
    { t: '坐下來推演', run() { return `你對著殘局想了一整天，竟從裡面悟出一點東西，《${addTechXp(900)}》精進了不少。`; } },
    { t: '替他們收好', run() { return '你把棋子一顆顆收進棋盒。走的時候，好像聽見背後有人說了聲謝謝。'; } }] },
  { id: 'xj_watch', xian: 1, repeat: 1, title: '觀人渡劫', text: '遠處的山頭上，有人在渡仙劫。劫雲壓得很低，看得你心頭髮緊。', choices: [
    { t: '在旁邊看完', run(s) { if (jieNext(s) && s.xiu >= stg(s).need) { s.press = Math.min(pressCap(), (s.press || 0) + .05); return '你把每一道雷都看在眼裡，心裡對自己那一劫多了幾分底，劫前淬鍊 +5%。'; } return s.stage >= STAGES.length - 1 ? '你看完了整場仙劫。他撐過去了。你想起自己頭頂那扇還沒打開的門。' : `你看完了整場仙劫。他撐過去了，你也跟著鬆了一口氣，修為 +${fmt(addXiu(.15))}。`; } },
    { t: '遠遠避開', run() { return '劫雲的事，還是少沾為妙。你繞了一大圈。'; } }] },
  { id: 'xj_cellar', xian: 1, repeat: 1, title: '仙酒窖', text: '你在一座廢棄的仙府底下，找到一個酒窖，裡面還有幾罈沒開封的仙釀。', choices: [
    { t: '開一罈嚐嚐', run(s) { s.tox = Math.min(100, s.tox + 15); return `酒勁很足，你醉了三天三夜，醒來修為 +${fmt(addXiu(.25))}，丹毒 +15。`; } },
    { t: '搬去賣', run() { return `酒鋪掌櫃眼睛都亮了，仙元石 ${addStone(stoneUnit(topPlace().lv) * 8)}。`; } }] },
  { id: 'xj_oldfriend', xian: 1, title: '凡間的舊識', text: '仙界的路上，你遇見一個面熟的人。想了很久才想起來：他是你某一世在凡間認識的修士，原來他也飛升了。', choices: [
    { t: '敘敘舊', run() { addLife(100); return '你們聊了很久，聊到凡間的那些年，他說：「那時候真好。」你也這麼覺得。壽元 +100 年。'; } },
    { t: '點頭致意', run() { return '你們點了點頭，各自走了。仙界很大，也許不會再見。'; } }] },
);
for (const e of EVENTS) if (['xj_bottle', 'xj_star', 'xj_feast', 'xj_fallen', 'xj_peach', 'xj_gamble', 'xj_patrol', 'xj_oldcave', 'xj_prayer', 'xj_cub', 'xj_leichi', 'xj_echo'].includes(e.id)) e.repeat = 1;

// ---------- 從仙人開始：三條修行路線各一門專屬仙階下品仙術（不上坊市、不掉落） ----------
SKILLS.xs_fa = K('接引仙光', 6, '無', 'dmg', 6, 4, { sch: 'fa', brk: .2, xs: 1 });
SKILLS.xs_ti = K('仙軀擎嶽', 6, '無', 'multi', 1.15, 5, { hits: 4, sch: 'ti', xs: 1 });
SKILLS.xs_hun = K('照神仙念', 6, '無', 'dmg', 5.2, 5, { stun: .35, sch: 'hun', xs: 1 });
// ---------- 大道至簡：成仙後一身術法反璞歸真，按修行路線化成一招（仙界唯一的仙術，自動施展，熟練度跟著境界） ----------
SKILLS.yi_fa = K('一法通玄', 6, '無', 'dmg', 8, 2, { brk: .3, sch: 'fa', only: 'fa', yi: 1 });
SKILLS.yi_ti = K('一力破萬法', 6, '無', 'dmg', 8, 2, { pierce: 1, sch: 'ti', only: 'ti', yi: 1 });
SKILLS.yi_hun = K('一念鎮仙', 6, '無', 'dmg', 7, 3, { pierce: 1, stun: 1, sch: 'hun', only: 'hun', yi: 1 });
// 兼修合成一招：兼具各路的特點（法修破防、體修穿透、魂修暈眩），耗主路的資源
SKILLS.yi_fati = K('拳出法隨', 6, '無', 'dmg', 9, 2, { brk: .3, pierce: 1, only: 'combo', yi: 1 });
SKILLS.yi_fahun = K('念起法生', 6, '無', 'dmg', 8.5, 3, { brk: .3, pierce: 1, stun: 1, only: 'combo', yi: 1 });
SKILLS.yi_tihun = K('神軀同鑄', 6, '無', 'dmg', 8.5, 3, { pierce: 1, stun: 1, only: 'combo', yi: 1 });
SKILLS.yi_san = K('三元歸一', 6, '無', 'dmg', 10, 3, { brk: .3, pierce: 1, stun: 1, only: 'combo', yi: 1 });
for (const id of ['yi_fati', 'yi_fahun', 'yi_tihun', 'yi_san']) Object.defineProperty(SKILLS[id], 'sch', { get: () => { try { return myPaths(L())[0] || 'fa'; } catch (e) { return 'fa'; } }, enumerable: true });

// ---------- 仙界坊市只賣仙階：多補一批靈寶、仙術，免得人仙時貨架很快就空 ----------
// 仙術：照天階的輔助、範圍型術法放大
for (const [kid, ...names] of [
  ['hunyi', '仙元護體', '無相金光', '太初仙罩'],
  ['buxiu', '金闕仙罡', '庚金仙甲訣', '萬劫金身'],
  ['shengsheng', '春風化雨', '一葉回春', '萬木回春'],
  ['wanliu', '弱水回瀾', '天河洗身', '滄浪仙泉'],
  ['honglian', '紅蓮仙火', '業火焚心', '九霄真火'],
  ['budong', '后土仙障', '九州山壁', '崑崙不動'],
  ['leilao', '紫霄雷網', '九霄雷陣', '雷霆萬鈞'],
  ['bingyu', '廣寒霜落', '太陰冰雨', '北冥雪暴'],
  ['wuying', '巽風仙蹤', '太虛無影', '九天風遁'],
]) {
  const k = SKILLS[kid];
  XG.forEach((g, i) => { SKILLS[`x${g}_${kid}`] = { ...k, name: names[i], grade: g, pow: Math.round(k.pow * XK[g] * 100) / 100, boss: undefined }; });
}
// 靈寶：六種新的天階等級範本（每部位兩種），再照品階放大
for (const [ai, [slot, tpl, ...names]] of [
  ['武器', { atk: .55, spd: 8, crit: .1 }, '追星仙刃', '流雲仙劍', '破曉仙鋒'],
  ['武器', { atk: .5, lifesteal: .08, critDmg: .4 }, '飲霞仙鉞', '噬虹仙戟', '斷嶽仙刀'],
  ['護甲', { hp: .5, regen: .03, def: .3 }, '青蓮仙衣', '紫綬仙袍', '玄黃仙甲'],
  ['護甲', { def: .5, dodge: .06, spd: 4 }, '凌虛仙衣', '雲錦羽甲', '九天流光甲'],
  ['飾品', { stone: .5, drop: .4, evRate: .15 }, '招財玉蟾', '聚寶仙盆', '萬寶如意'],
  ['飾品', { techXp: .4, rate: .3, mp: .2 }, '悟道玉簡', '清心仙鈴', '太初玉牒'],
].entries()) {
  XG.forEach((g, i) => { ARTS[`x${g}_na${ai}`] = { name: names[i], slot, grade: g, ...xianScale(tpl, XF[g]) }; });
}

// ---------- 體修、魂修術法補充：仙界每個品階各 3 門，魂修玄階 4 門 ----------
// [下品名, 中品名, 上品名, 種類, 下品威力, 冷卻, 額外]；中品、上品威力照 XK 比例放大
for (const [i, [n6, n7, n8, kind, pow, cd, ex]] of [
  ['飲血仙拳', '吞天血掌', '萬劫血拳', 'multi', 1, 5, { hits: 5, drain: .15, sch: 'ti' }],
  ['透骨仙指', '破天一指', '寂滅一指', 'dmg', 5, 5, { pierce: 1, sch: 'ti' }],
  ['金剛仙軀', '不壞仙身', '混沌仙軀', 'shield', 3.2, 6, { reflect: .4, sch: 'ti' }],
  ['攝魂仙音', '鎮魄仙鐘', '九幽攝魂', 'dmg', 5.6, 5, { brk: .3, stun: .25, sch: 'hun' }],
  ['奪魄仙念', '噬魂仙念', '太虛奪魄', 'dmg', 5.2, 5, { drain: .3, freeze: .25, sch: 'hun' }],
  ['千念仙刺', '萬念飛刺', '億念穿心', 'multi', 1, 6, { hits: 4, stun: .15, sch: 'hun' }],
].entries()) {
  [n6, n7, n8].forEach((name, j) => { const g = XG[j]; SKILLS[`x${g}_tihun${i}`] = K(name, g, '無', kind, Math.round(pow * XK[g] / XK[6] * 100) / 100, cd, ex); });
}
Object.assign(SKILLS, {
  hun2a: K('攝心術', 2, '無', 'dmg', 2.2, 4, { stun: .3, sch: 'hun' }),
  hun2b: K('魂鎖', 2, '無', 'dmg', 2, 4, { freeze: .3, brk: .1, sch: 'hun' }),
  hun2c: K('心魔幻境', 2, '無', 'multi', .8, 5, { hits: 3, stun: .15, sch: 'hun' }),
  hun2d: K('定神護魂', 2, '無', 'shield', 1.6, 5, { sch: 'hun' }),
});

// ---------- 法修仙術補充：仙界的土、雷、冰、風原本沒有法術，每種屬性各一攻一輔 ----------
for (const [i, [elem, n6, n7, n8, kind, pow, cd, ex]] of [
  ['土', '坤元仙印', '山河仙崩', '太古坤印', 'dmg', 5.8, 5, { brk: .2 }],
  ['土', '厚德仙壁', '坤元仙甲', '萬載仙岩', 'shield', 3.2, 6, {}],
  ['雷', '雷光仙劍', '雷祖仙罰', '太霄神霆', 'dmg', 6.2, 5, {}],
  ['雷', '雷澤回元', '紫電淬身', '天雷洗髓', 'heal', 3.8, 5, {}],
  ['冰', '霜華仙刃', '寒月仙輪', '玄冰仙魄', 'dmg', 5.6, 5, { brk: .15 }],
  ['冰', '冰心仙鏡', '寒玉仙壁', '太陰仙鏡', 'shield', 3.2, 6, {}],
  ['風', '清風仙劍', '天風仙刃', '罡風滅世', 'dmg', 5.2, 4, {}],
  ['風', '風息回元', '長風仙息', '九天清風', 'heal', 3.8, 5, {}],
].entries()) {
  [n6, n7, n8].forEach((name, j) => { const g = XG[j]; SKILLS[`x${g}_fa${i}`] = K(name, g, elem, kind, Math.round(pow * XK[g] / XK[6] * 100) / 100, cd, { ...ex, sch: 'fa' }); });
}
