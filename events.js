// 遊歷事件與人物劇情
// 事件：{ id, title, text(字串或函式), min 最低境界, repeat 可重複（否則一世一次）, cond(s), choices:[{ t, cond(s), run(s) → 結果文字 }] }
// 可用的輔助函式都在 game.js：addStone addXiu addPill addHeal addLife injure battle learnTech learnSkill
//   tryDrop randomUnowned stoneUnit placeLv pct fmt arc arcEnd

const EVENTS = [
  { id: 'cave', title: '山壁古洞', text: '山壁的藤蔓後藏著一個洞口，洞裡隱約有靈光閃動。', choices: [
    { t: '入洞探查', run() { if (pct(.6)) { const n = addStone(stoneUnit() * 5); return `洞底是一位前人坐化之處。你收殮了遺骨，得靈石 ${n}${tryDrop(.25)}。`; } injure(80); return '洞中禁制尚存，你被震傷，狼狽逃出。'; } },
    { t: '記下方位就走', run() { return '修行路長，不急在一時。'; } }] },
  { id: 'scroll', title: '殘破玉簡', text: '溪邊淤泥裡半埋著一枚玉簡，靈識探去，只剩幾段殘缺的修煉心得。', choices: [
    { t: '靜坐參悟', run() { return `你在溪邊坐了三日，修為 +${fmt(addXiu(.3))}。`; } },
    { t: '帶去坊市賣掉', run() { return `換得靈石 ${addStone(stoneUnit() * 2)}。`; } }] },
  { id: 'rogue', repeat: true, title: '散修求援', text: '一名散修渾身是血地從林中衝出：「道友救命，後頭有妖獸！」', choices: [
    { t: '出手', run() { if (battle('追來的妖獸', placeLv(), 1.1)) { return `妖獸伏誅。散修千恩萬謝，硬塞給你一顆${addPill(1)}。`; } return '你們一起負傷逃了出來。'; } },
    { t: '指給他另一條路', run() { return '他愣了愣，往你指的方向跑了。'; } }] },
  { id: 'scam', title: '路邊神丹', text: '山道邊有個老頭擺攤，吆喝著「上古神丹，吃了立地飛升」。要價不便宜。', choices: [
    { t: () => `買一顆（靈石 ${stoneUnit() * 3}）`, cond: s => s.stone >= stoneUnit() * 3, run(s) { s.stone -= stoneUnit() * 3; if (pct(.3)) return `居然是真貨！修為 +${fmt(addXiu(.6))}。`; return '是糖丸。等你回頭，攤子已經不見了。'; } },
    { t: '不理他', run() { return '老頭在背後罵你沒眼光。'; } }] },
  { id: 'spring', title: '林中靈泉', text: '密林深處有一汪冒著白霧的泉水，靈氣濃得化不開。', choices: [
    { t: '下水浸泡', run(s) { s.injury = 0; return `泉水洗過經脈，傷勢盡癒，修為 +${fmt(addXiu(.4))}。`; } },
    { t: '裝幾壺帶走', run() { return `賣給丹師，得靈石 ${addStone(stoneUnit() * 3)}。`; } }] },
  { id: 'cub', once: true, title: '雪色幼狐', text: '獵夾上困著一隻雪白的幼狐，後腿血肉模糊，一雙眼睛直直看著你。', choices: [
    { t: '替牠療傷', run(s) { s.flags.cub = 1; return '你拆了獵夾，替牠敷藥。牠舔了舔你的手指，一瘸一拐鑽進林子。'; } },
    { t: '不多管閒事', run() { return '你走遠了，身後還傳來細細的叫聲。'; } }] },
  { id: 'cub2', once: true, min: 4, cond: s => s.flags.cub, title: '狐叼靈草', text: '夜裡帳外窸窣作響。一隻長大了些的雪狐叼著一株靈草放在你面前，後腿留著一道舊疤。', choices: [
    { t: '收下', run() { return `你把靈草煉成兩顆${addPill(2)}。雪狐蹲在不遠處看了很久才走。`; } }] },
  { id: 'thunder', repeat: true, title: '雷擊古木', text: '昨夜雷暴，山頂一棵古木被劈開，焦黑的木心裡雷光流轉。', choices: [
    { t: '剖取雷擊木', run() { if (pct(.65)) return `取得一截雷擊木，賣得靈石 ${addStone(stoneUnit() * 6)}。`; injure(70); return '殘雷竄上手臂，你半身發麻。'; } },
    { t: '在樹下感悟雷意', run() { return `修為 +${fmt(addXiu(.25))}。`; } }] },
  { id: 'drought', title: '旱村求雨', text: '山下村子三個月沒下雨，村民在乾裂的田裡跪拜，求路過的仙師開恩。', choices: [
    { t: '耗費修為行雲布雨', run(s) { s.xiu = Math.floor(s.xiu * .85); s.brkBonus += .08; return '大雨下了一整夜。村民的願力纏上你的道心，下次突破成功率 +8%。'; } },
    { t: '仙凡有別', run() { return '你沒有回頭。'; } }] },
  { id: 'ambush', repeat: true, min: 3, title: '劫修攔路', text: '三個蒙面修士堵住山道：「留下靈石，饒你一命。」', choices: [
    { t: '動手', run() { if (battle('劫修', placeLv() + 1, 1)) return `你反搶了他們的儲物袋，得靈石 ${addStone(stoneUnit() * 4)}。`; return '寡不敵眾，你負傷突圍。'; } },
    { t: '交出三成靈石', run(s) { const n = Math.floor(s.stone * .3); s.stone -= n; return `失去靈石 ${n}。`; } }] },
  // 壓軸有三成五機率改成天材地寶（第一次看到時決定，一世只有一場）
  { id: 'auction', min: 5, title: '坊市拍賣', text: s => { if (s.flags.lot === undefined) s.flags.lot = tcNext() && pct(.35) ? tcNext() : ''; return `坊市今夜開拍，壓軸是${s.flags.lot ? ITEMS[s.flags.lot].name : '一卷功法'}，起拍價 ${auctionPrice()} 靈石。`; }, choices: [
    { t: '競拍', cond: s => s.stone >= auctionPrice(), run(s) { s.stone -= auctionPrice(); if (s.flags.lot) { addItem(s.flags.lot); return `你拍下了${ITEMS[s.flags.lot].name}。`; } const id = randomUnowned('tech', [2, 3]); if (!id) return '……拍到的是你早就會的功法。'; learnTech(id); return `你拍下了《${TECHS[id].name}》。`; } },
    { t: '只是看看', run() { return '壓軸被一位戴斗笠的女修拍走了。'; } }] },
  { id: 'duel', repeat: true, min: 2, title: '宗門弟子', text: '一名大宗門的年輕弟子攔下你，說要拿散修練手。', choices: [
    { t: '應戰', run(s) { if (battle('宗門弟子', s.stage + 1, 1.05)) { for (const id of s.equip) s.skills[id] += 5; return '他捂著胸口認輸。這一戰讓你的術法熟練了不少。'; } return '你輸了。他扔下一句「散修不過如此」便走了。'; } },
    { t: '不接', run() { return '他嗤笑一聲。'; } }] },
  { id: 'elder', once: true, min: 1, title: '溪邊老者', text: '溪邊一個釣魚的老人叫住你，說你的吐納「有三處不對」。', choices: [
    { t: '恭敬請教', run(s) { s.techs[s.tech] += 900; return `老人講了一個下午，你對《${TECHS[s.tech].name}》的領悟大進。回頭再看，溪邊已經沒有人。`; } },
    { t: '不以為然', run() { return '老人搖搖頭，繼續釣他的魚。'; } }] },
  { id: 'lingzhi', repeat: true, title: '妖獸守藥', text: '崖下長著一株年份極老的靈芝，旁邊盤著一頭正在打盹的妖獸。', choices: [
    { t: '搶', run() { if (battle('守藥妖獸', placeLv() + 1, 1.1)) { return `你採下靈芝，煉成兩顆${addPill(2)}。`; } return '妖獸醒了。你空手而回，還添了一身傷。'; } },
    { t: '不驚動牠', run() { return '你悄悄退開。'; } }] },
  { id: 'gamble', repeat: true, title: '賭石攤', text: '坊市角落有人賭石：原石切開，有靈髓就賺，沒有就賠。', choices: [
    { t: '押上兩成靈石', cond: s => s.stone >= 10, run(s) { const bet = Math.floor(s.stone * .2); s.stone -= bet; if (pct(.3)) { s.stone += bet * 4; return `切出一塊靈髓！賺了 ${bet * 4}。`; } return `一刀下去全是石頭，賠了 ${bet}。`; } },
    { t: '不賭', run() { return '十賭九輸。'; } }] },
  { id: 'ghost', min: 10, title: '戰場怨魂', text: '古戰場的夜霧裡，一縷怨魂纏上了你，低聲重複著一個不知是誰的名字。', choices: [
    { t: '為它超度', run(s) { s.brkBonus += .05; return '怨魂散去前朝你拜了一拜。下次突破成功率 +5%。'; } },
    { t: '煉化它的魂力', run(s) { const g = addXiu(.5); s.brkBonus -= .1; return `修為 +${fmt(g)}，但心魔暗生，下次突破成功率 -10%。`; } }] },
  { id: 'meteor', once: true, min: 15, title: '天墜星石', text: '一道流光墜入秘境深處，落點星輝沖天，有什麼東西守在那裡。', choices: [
    { t: '追上去', run() { if (!battle('星紋蛟', placeLv() + 2, 1.1)) return '星紋蛟太強，你重傷而退。'; const id = randomUnowned('tech', [3]); if (id) { learnTech(id); return `你斬了星紋蛟，在星石裡得到一卷《${TECHS[id].name}》。`; } return `星石賣得靈石 ${addStone(stoneUnit() * 10)}。`; } },
    { t: '不去湊熱鬧', run() { return '那一夜，秘境裡死了不少人。'; } }] },
  { id: 'teahouse', title: '茶館說書', text: () => S.meta.history.length ? '鎮上茶館的說書人正講到「某位前輩修士」的往事，你越聽越覺得耳熟。' : '鎮上茶館的說書人正講著上古修士斬蛟的故事。', choices: [
    { t: '聽完再走', run() { const h = S.meta.history[S.meta.history.length - 1]; if (h) return `說的竟是你的前世：一個修到${h.stageName}、${h.age} 歲坐化的修士。你心有所感，修為 +${fmt(addXiu(.2))}。`; return `修為 +${fmt(addXiu(.1))}。`; } }] },
  { id: 'temple', title: '破廟避雨', text: '暴雨中你躲進一座破廟，供桌上的神像早已看不出是誰。', choices: [
    { t: '打坐到雨停', run() { return `雨聲裡心境格外清明，修為 +${fmt(addXiu(.15))}。`; } },
    { t: '替神像擦去塵土', run() { addLife(3); return '你擦得很仔細。離開時覺得身子輕了些，壽元 +3。'; } }] },
  { id: 'mirror', min: 15, title: '心魔鏡', text: '秘境深處立著一面古鏡，鏡中的你神情陌生，正對著你笑。', choices: [
    { t: '直視它', run() { if (pct(.5 + S.meta.dao * .01)) return `你看穿了鏡中幻象，修為 +${fmt(addXiu(.8))}。`; injure(150); return '你被鏡中的自己拖進幻境，好不容易才掙脫。'; } },
    { t: '繞開', run() { return '有些東西，還是不看為好。'; } }] },
];

// 人物劇情：一步一步解鎖，aff 是好感，最後一步決定結局；結局會帶到下一世
const ARCS = {
  su: { name: '蘇棠', steps: [
    { min: 0, title: '竹林采藥女', text: '青竹林裡，一個背著藥簍的少女被青鱗蛇逼到樹下，手裡只有一把采藥鋤。', choices: [
      { t: '出手相救', run() { const a = arc('su'); if (battle('青鱗蛇', 1, 1)) { a.aff += 2; addHeal(2); return '你斬了蛇。少女說她叫蘇棠，在山腳采藥，硬塞給你兩顆自己搓的療傷丹。'; } a.aff += 3; return '你被蛇咬傷，反倒是她把你拖回山腳的茅屋，守了你一夜。她說她叫蘇棠。'; } },
      { t: '與我無關', run() { arcEnd('su', 'ignored'); return '你走開了。後來你再沒見過她。'; } }] },
    { min: 3, title: '藥廬試丹', text: '蘇棠在山腳開了間小藥廬，托人捎話：她配了一爐新丹，想找個修士試藥。', choices: [
      { t: '替她試藥', run() { const a = arc('su'); if (pct(.7)) { a.aff += 2; return `藥性溫和，竟有助突破。她說這叫${addPill(2)}，把剩下兩顆都塞給了你。`; } a.aff += 3; injure(60); return '你腹痛了一整天。她紅著眼眶守在榻邊，一直道歉。'; } },
      { t: '留些靈石給她買藥材', run(s) { arc('su').aff += 1; const n = Math.min(s.stone, stoneUnit() * 3); s.stone -= n; return `你留下靈石 ${n}。她說這筆帳她記著。`; } }] },
    { min: 7, title: '一絲靈根', text: '路過的宗門執事替蘇棠測了靈根：一絲微弱的木靈根，宗門不收。她問你，能不能教她修行。', choices: [
      { t: '傾囊相授', run() { const a = arc('su'); a.aff += 3; a.taught = 1; return '你每隔幾日就去藥廬講一回吐納。她學得很慢，但從不偷懶。'; } },
      { t: '勸她安心做個凡人', run() { arc('su').aff -= 1; return '她笑著說好，可那天藥廬早早就關了門。'; } }] },
    { min: 10, title: '黑風寨', text: '黑風寨的匪修看上了藥廬的地，限蘇棠三日內搬走。她沒有告訴你，是你從別人口中聽說的。', choices: [
      { t: '上山找寨主', run() { const a = arc('su'); if (battle('黑風寨主', 12, 1.15)) { a.aff += 3; return `你挑了黑風寨，得靈石 ${addStone(stoneUnit(12) * 4)}。從此再沒人敢去藥廬鬧事。`; } a.aff += 1; return '你敗了。她拿出全部積蓄打發了匪修，然後替你包紮了一整晚。'; } },
      { t: '替她出錢了事', run(s) { arc('su').aff += 1; const n = Math.min(s.stone, stoneUnit(12) * 3); s.stone -= n; return `你付了靈石 ${n}。匪修走了，她卻說：「下次別這樣。」`; } }] },
    { min: 13, title: '最後一爐丹', text() { const a = arc('su'); if (a.taught && a.aff >= 8) return '多年後再去藥廬，蘇棠已經築基了，容顏還是當年的樣子。她煉了一爐丹，說是專門為你煉的。'; if (a.aff >= 5) return '多年後再去藥廬，蘇棠已經白髮蒼蒼。她顫著手把最後一爐丹交給你：「我是凡人，等不到你了。」'; return '藥廬換了主人。新主人說，原來那位姑娘早就嫁人搬走了，只留下一封給你的信。'; }, choices: [
      { t: '收下', run() { const a = arc('su'); if (a.taught && a.aff >= 8) { addLife(60); arcEnd('su', 'cultivated'); return '長青丹入腹，壽元 +60。她說：「這一次，換我等你。」'; } if (a.aff >= 5) { arcEnd('su', 'mortal'); return `你得到${addPill(3)} 3 顆。那年冬天，她走了。`; } arcEnd('su', 'faded'); return `信裡只有「保重」兩個字，還夾著靈石 ${addStone(stoneUnit() * 3)}。`; } }] },
  ] },
  mu: { name: '慕容緋', steps: [
    { min: 6, title: '山洞裡的魔女', text: '黑風嶺的山洞裡縮著一個紅衣少女，衣襟繡著魔門紋樣，傷得很重。洞外傳來正道修士搜山的呼喊。', choices: [
      { t: '把她藏起來', run() { arc('mu').aff += 3; return '你擋在洞口，騙走了追兵。她咬著牙說：「我叫慕容緋，這條命算我欠你的。」'; } },
      { t: '把她交出去', run() { const n = addStone(stoneUnit() * 8); arcEnd('mu', 'betrayed'); return `正道修士賞了你靈石 ${n}。被押走時，她回頭看了你一眼。`; } }] },
    { min: 9, title: '欠你一條命', text: '慕容緋傷好了，臨走前扔給你一卷血色秘籍：「魔門身法，你們正道不屑學吧？」', choices: [
      { t: '收下', run() { arc('mu').aff += 1; learnSkill('xueying'); return '你學會了血影步。她哼了一聲，嘴角卻翹了起來。'; } },
      { t: '婉拒', run() { arc('mu').aff += 2; learnSkill('xueying'); return '她氣得跺腳，把秘籍往地上一摔就走了。你撿起來，學會了血影步。'; } }] },
    { min: 12, title: '將軍墓', text: '古戰場深處的將軍墓裡，你又撞見了慕容緋。墓底只有兩件寶物：一卷功法，一顆定魂珠。', choices: [
      { t: '讓她先挑', run() { arc('mu').aff += 3; learnTech('jiuyao'); return '她挑了定魂珠，又把功法塞給你：「看什麼看，我用不上。」你得到《九曜焚天訣》。'; } },
      { t: '兩樣都要', run() { arc('mu').aff -= 3; learnTech('jiuyao'); return `你帶走功法，又把定魂珠賣得靈石 ${addStone(stoneUnit() * 5)}。她什麼也沒說。`; } }] },
    { min: 15, title: '誅魔大陣', text: '正道十大門派聯手布下誅魔大陣，陣中央困著的人是慕容緋。', choices: [
      { t: '破陣救她', run() { const a = arc('mu'); if (battle('守陣長老', 17, 1.1)) { a.aff += 4; return '你斬了守陣長老，抱著她殺出重圍。她靠在你肩上，第一次沒有嘴硬。'; } a.aff += 3; return '你沒能破陣，重傷倒地。最後是她捏碎定魂珠，把你一起帶了出去。'; } },
      { t: '袖手旁觀', run() { arcEnd('mu', 'abandoned'); return '大陣運轉了七天七夜。後來有人說她逃了，也有人說她死了。'; } }] },
    { min: 17, title: '魔門之主', text() { return arc('mu').aff >= 9 ? '魔門易主，新任門主是個紅衣女子。某天醒來，你發現枕邊多了一卷金色經書。' : '你收到一封沒有署名的信，字跡張揚：「我回魔門了。別來找我。」'; }, choices: [
      { t: '收下', run() { if (arc('mu').aff >= 9) { learnTech('hunyuan'); arcEnd('mu', 'together'); return '是天階功法《混元歸一經》。扉頁寫著：「欠你的，還你。剩下的，下輩子再算。」'; } arcEnd('mu', 'parted'); return `信封裡夾著靈石 ${addStone(stoneUnit() * 6)}。`; } }] },
  ] },
};

// 前世羈絆：上一世的結局，會在之後的某一世找上你（每種結局只發生一次）
const MEMORIES = [
  { id: 'su_c', bond: 'su', end: 'cultivated', min: 1, title: '藥廬故人', text: '青竹林邊有間藥廬。白衣女修抬頭看見你，手裡的藥碾停了很久。', choices: [
    { t: '「我們見過嗎？」', run() { addLife(30); addHeal(3); learnSkill('huichun'); return '「見過。」她笑了，眼眶卻紅了，「你上輩子替我試了好多次藥。」她教你回春術，又塞給你一顆長青丹，壽元 +30。'; } }] },
  { id: 'su_m', bond: 'su', end: 'mortal', min: 1, title: '竹林老墳', text: '青竹林邊有座老墳，碑上刻著「藥廬蘇棠」。墳前埋著一只陶罐，罐上寫著：「給下輩子的你」。', choices: [
    { t: '打開陶罐', run() { return `裡面是三顆封得好好的${addPill(3)}，和一張字條：「這次早點來。」`; } }] },
  { id: 'mu_t', bond: 'mu', end: 'together', min: 4, title: '紅衣來訪', text: '黑風嶺上，一隊魔門弟子見到你，竟齊齊跪下。山道盡頭，紅衣女子負手而立。', choices: [
    { t: '「……慕容緋？」', run() { S.meta.dao += 3; return `「讓我好找。」她說上輩子的帳還沒算完，留下靈石 ${addStone(stoneUnit() * 10)}，又替你理順經脈，道心 +3。`; } }] },
  { id: 'mu_b', bond: 'mu', end: 'betrayed', min: 8, title: '血債', text: '一個紅衣女子攔在路上。你從沒見過她，她卻盯著你說：「找了你兩輩子。」', choices: [
    { t: '迎戰', run(s) { if (battle('慕容緋', s.stage + 3, 1.2)) return '她敗了，卻笑了：「下輩子，我還會來。」'; const n = Math.floor(s.stone * .5); s.stone -= n; return `你被打得爬不起來。她拿走靈石 ${n}，說這是利息。`; } }] },
  { id: 'mu_a', bond: 'mu', end: 'abandoned', min: 8, title: '陣外的人', text: '深夜，有人坐在你的窗沿上。紅衣，左臉一道陣紋燒出的疤。「那天，你就站在陣外。」', choices: [
    { t: '沉默', run() { injure(200); return '她看了你很久，然後一掌震亂了你的經脈。「這一掌，抵那七天七夜。」'; } }] },
];
const ARC_END_LABEL = { cultivated: '她築基了，說換她等你', mortal: '她以凡人之身老去', faded: '她嫁人搬走了', ignored: '你沒有救她', betrayed: '你把她交給了正道', abandoned: '你看著她被困陣中', together: '她成了魔門之主，說下輩子再算', parted: '她回了魔門' };
