// 長生閒記：第二批遊歷事件、四位新人物、他們的前世羈絆
// 每個事件都是不同的情境，不做換名字的重複事件。沒標 repeat 的一世只發生一次。

// 小工具：給一件沒拿過的法寶／功法／術法，回傳文字（拿不到就給靈石）
function giftArt(grades) { const id = randomUnowned('art', grades); if (id) { gainArt(id); return `「${ARTS[id].name}」`; } return `靈石 ${addStone(stoneUnit() * 6)}`; }
function giftTech(grades) { const id = randomUnowned('tech', grades); if (id) { learnTech(id); return `《${TECHS[id].name}》`; } return `靈石 ${addStone(stoneUnit() * 6)}`; }
function giftSkill(grades) { const id = randomUnowned('skill', grades); if (id) { learnSkill(id); return `《${SKILLS[id].name}》`; } return `靈石 ${addStone(stoneUnit() * 6)}`; }

EVENTS.push(
  // ---------- 練氣期 ----------
  { id: 'rustsword', title: '河床鏽劍', text: '乾涸的河床上插著一柄鏽劍，劍脊上刻著一個看不清的名字。', choices: [
    { t: '拔出來磨一磨', run() { return `鏽層底下竟是好鋼。你得到${giftArt([1])}。`; } },
    { t: '讓它留在原地', run(s) { s.brkBonus += .03; return '你朝劍拜了一拜。不知哪來的一縷劍意落進心裡，下次突破成功率 +3%。'; } }] },
  { id: 'beggar', min: 1, title: '討麵的老道', text: '麵攤前蹲著一個邋遢老道，眼巴巴地看著你碗裡的麵。', choices: [
    { t: '請他吃一碗', run() { if (pct(.35)) return `老道吃完一抹嘴，扔給你一本破冊子：${giftTech([1, 2])}。`; return '他吃完就走，連聲謝都沒說。'; } },
    { t: '自己吃完', run() { return '老道嘆了口氣，換到下一個攤子。'; } }] },
  { id: 'wedding', title: '村裡的喜事', text: '山腳村子張燈結彩，新郎官硬拉著你這個「仙長」去喝喜酒。', choices: [
    { t: '喝一杯', run() { addLife(2); return '一整晚的鑼鼓聲裡，你難得想起自己也曾是凡人。壽元 +2。'; } },
    { t: '留下一份賀禮', run(s) { const n = Math.min(s.stone, stoneUnit() * 2); s.stone -= n; s.brkBonus += .04; return `你留下靈石 ${n}。新娘子給你磕了個頭，下次突破成功率 +4%。`; } }] },
  { id: 'glowshroom', title: '發光的菇', text: '腐木上長著一圈幽藍發光的菇，聞起來有股甜味。', choices: [
    { t: '摘一朵嚐嚐', run(s) { if (pct(.5)) return `一股清涼直衝天靈，修為 +${fmt(addXiu(.4))}。`; s.tox = Math.min(100, s.tox + 30); injure(60); return '你吐了一下午，丹毒 +30。'; } },
    { t: '採去賣給藥鋪', run() { return `換得靈石 ${addStone(stoneUnit() * 2)}。`; } }] },
  { id: 'bridge', min: 2, title: '斷橋', text: '山洪沖斷了木橋，對岸一群放學的孩子哭著回不了家。', choices: [
    { t: '以法力架一座橋', run(s) { s.xiu = Math.floor(s.xiu * .9); s.brkBonus += .05; return '你撐了半個時辰，孩子們一個個跑過來。修為耗了一成，下次突破成功率 +5%。'; } },
    { t: '把他們一個個帶過去', run() { return '孩子們叫你「飛飛哥哥」。你沒有糾正。'; } }] },
  { id: 'graverobber', min: 3, title: '盜墓賊分贓', text: '荒墳邊，三個盜墓賊正為一件陪葬品吵得面紅耳赤。', choices: [
    { t: '黑吃黑', run() { if (battle('盜墓賊', placeLv() + 1, 1)) return `贓物歸你：靈石 ${addStone(stoneUnit() * 4)}${tryDrop(.5)}。`; return '這幾個人比想像中能打，你負傷離開。'; } },
    { t: '把墳填回去', run() { addLife(3); return '你替無名的墓主重新立了碑。壽元 +3。'; } }] },
  { id: 'recruit', min: 2, title: '小宗門收徒', text: '鎮上貼著告示：清溪門招收外門弟子，三日後山門考核。', choices: [
    { t: '去考考看', run() { if (battle('考核的師兄', placeLv() + 1, 1)) return `你過了考核。雖然沒留下，執事還是送了你${giftTech([1, 2])}。`; return '你在第一關就被打下擂台。'; } },
    { t: '散修自在', run() { return '你把告示撕下來包了燒餅。'; } }] },
  { id: 'pickpocket', min: 1, title: '儲物袋被割了', text: '在坊市擠了一圈，回過神來，你的儲物袋被割了一道口子。', choices: [
    { t: '追', run(s) { if (pct(.55)) return `你在巷子口逮住那小賊，還多搜出靈石 ${addStone(stoneUnit() * 2)}。`; const n = Math.floor(s.stone * .1); s.stone -= n; return `跟丟了，少了靈石 ${n}。`; } },
    { t: '認栽', run(s) { const n = Math.floor(s.stone * .1); s.stone -= n; return `少了靈石 ${n}，就當買個教訓。`; } }] },
  { id: 'lanterns', title: '燈會猜謎', text: '凡人城裡的上元燈會，攤主說猜中十道燈謎就送鎮店之寶。', choices: [
    { t: '猜', run() { if (pct(.5)) return `你一口氣猜中十道。鎮店之寶是${giftArt([1])}。`; return '第七道你怎麼也想不出來。'; } },
    { t: '只看燈', run() { return `滿城燈火映在河裡。你站了很久，修為 +${fmt(addXiu(.15))}。`; } }] },
  { id: 'ascetic', min: 4, title: '苦行僧', text: '路邊坐著一個苦行僧，聽說已經不吃不喝坐了三年。', choices: [
    { t: '陪他坐一天', run() { return `一整天，你什麼都沒想。對《${addTechXp(600)}》的領悟更深了。`; } },
    { t: '放下一壺水', run(s) { s.brkBonus += .03; return '僧人沒有睜眼，嘴角卻動了一下。下次突破成功率 +3%。'; } }] },
  { id: 'veinfight', min: 5, title: '兩派爭靈脈', text: '兩個小宗門為一條新發現的靈脈打得不可開交，誰也顧不上你。', choices: [
    { t: '幫弱的一方', run() { if (battle('強勢宗門弟子', placeLv() + 1, 1.05)) return `弱的那派分你一成靈脈收成：靈石 ${addStone(stoneUnit() * 6)}。`; return '你被兩派一起打了出來。'; } },
    { t: '趁亂挖一塊', run() { if (pct(.6)) return `挖到一塊靈髓，賣得靈石 ${addStone(stoneUnit() * 5)}。`; injure(90); return '被發現了，挨了好幾記法術。'; } }] },
  { id: 'chess', min: 6, title: '山中殘局', text: '松下石桌擺著一盤殘局，對面的老人說：「解得開，送你一樣東西。」', choices: [
    { t: '坐下來解', run(s) { if (pct(.5)) return `你落下最後一子，老人大笑，送你${giftTech([2])}。`; const n = Math.floor(s.stone * .05); s.stone -= n; return `輸了。按規矩留下靈石 ${n}。`; } },
    { t: '站著看他自己下', run() { return `看了一夜，你對《${addTechXp(300)}》有了新的想法。`; } }] },
  { id: 'mirrorlake', min: 6, title: '鏡湖', text: '湖面平得像鏡子。倒影裡的你沒有修仙，在某個小鎮開了間鋪子，兒孫滿堂。', choices: [
    { t: '看下去', run() { return `你看著那個自己老去、閉眼。回過神來心境澄明，修為 +${fmt(addXiu(.3))}。`; } },
    { t: '丟顆石子', run() { return '倒影碎了。你沒再回頭看。'; } }] },
  { id: 'boneflute', min: 8, title: '骨笛', text: '你在獸冢撿到一支骨笛，試吹了一聲，四周的林子安靜得可怕。', choices: [
    { t: '再吹一聲', run() { if (battle('被笛聲引來的獸群', placeLv() + 1, 1.1)) return `獸群被你殺退，剝下的獸材賣得靈石 ${addStone(stoneUnit() * 5)}。`; return '獸群太多，你邊打邊逃。'; } },
    { t: '收起來拿去賣', run() { return `識貨的人出了靈石 ${addStone(stoneUnit() * 3)}。`; } }] },
  // ---------- 築基、金丹期 ----------
  { id: 'debate', min: 9, title: '論道大會', text: '城中舉辦論道大會，各家修士輪流上台講自己的道。', choices: [
    { t: '上台講你的道', run(s) { if (pct(.4 + S.meta.dao * .01)) { s.brkBonus += .06; return `台下一片叫好，你自己也講通了幾處關竅。下次突破成功率 +6%，還收到靈石 ${addStone(stoneUnit() * 4)}。`; } return '講到一半卡住了，台下有人在笑。'; } },
    { t: '在台下聽', run() { return `聽了一整天，你對《${addTechXp(900)}》的理解又深了一層。`; } }] },
  { id: 'searstorm', min: 9, title: '渡船遇風暴', text: '渡海的大船遇上風暴，桅杆斷了，滿船凡人哭喊成一片。', choices: [
    { t: '鎮住風浪', run(s) { s.xiu = Math.floor(s.xiu * .85); addLife(8); return '你撐了一夜。上岸後滿船的人給你立了長生牌位，壽元 +8。'; } },
    { t: '只護住自己', run() { return '船沉了一半。你上岸時沒有人看你。'; } }] },
  { id: 'curseddoll', min: 10, title: '詛咒人偶', text: '古戰場的焦土下埋著一個木偶，眼眶裡有兩點紅光。', choices: [
    { t: '燒掉', run() { return '木偶燒了三天三夜才化成灰，耳邊一直有人在哭。'; } },
    { t: '研究它', run() { if (pct(.4)) return `木偶體內藏著一卷秘法：${giftSkill([3])}。`; injure(150); return '紅光一閃，你被詛咒反噬，大病一場。'; } }] },
  { id: 'refugees', min: 9, title: '逃難的人', text: '邊境打仗，一隊逃難的百姓攔住你，求你帶他們翻過山。', choices: [
    { t: '帶他們過山', run(s) { const n = Math.min(s.stone, stoneUnit() * 3); s.stone -= n; addLife(6); return `一路花了靈石 ${n} 買乾糧。到了山那邊，老人家們跪了一地。壽元 +6。`; } },
    { t: '指條路', run() { return '他們朝你指的方向去了。你不知道他們有沒有到。'; } }] },
  { id: 'furnace', min: 10, title: '丹爐要炸', text: '路邊一個年輕丹師的丹爐劇烈震動，他手忙腳亂地喊：「誰來幫忙控火！」', choices: [
    { t: '幫他控火', run() { if (pct(.6)) return `一爐丹保住了。他分你一顆${addPill(1)}。`; injure(100); return '丹爐還是炸了，你們兩個灰頭土臉。'; } },
    { t: '退開三丈', run() { return '轟的一聲。你遠遠看著他頂著一頭焦髮爬起來。'; } }] },
  { id: 'wanted', repeat: true, min: 9, title: '懸賞榜', text: '坊市的懸賞榜上貼著一張新榜：通緝一名屠了半座鎮的邪修。', choices: [
    { t: '揭榜', run() { if (battle('通緝邪修', placeLv() + 2, 1.1)) return `你提著邪修的首級回來，領到賞金靈石 ${addStone(stoneUnit() * 10)}。`; return '你差點成了他的第二百個受害者。'; } },
    { t: '不攬這事', run() { return '榜還貼著，賞金又漲了。'; } }] },
  { id: 'trial', min: 12, title: '傳承試煉', text: '你誤入一座前人洞府，石門上刻著：「過我三關，傳我衣缽。」', choices: [
    { t: '闖關', run() { if (battle('守關傀儡', L().stage + 2, 1.15)) return `三關盡破，石室裡供著${giftTech([3])}。`; return '第三關的傀儡把你扔出了洞府。'; } },
    { t: '不貪', run() { return '你退了出去，石門在身後緩緩合上。'; } }] },
  { id: 'heartdemon', min: 14, title: '心魔現形', text: '夜裡打坐，對面不知何時坐了另一個你，正在數你這輩子做錯的事。', choices: [
    { t: '斬了它', run(s) { if (pct(.55)) { s.brkBonus += .08; return '劍光過處，心境一片清明。下次突破成功率 +8%。'; } injure(150); return '你斬下去，痛的卻是自己。'; } },
    { t: '聽它說完', run() { return `你聽到天亮。它說完就散了，修為 +${fmt(addXiu(.3))}。`; } }] },
  { id: 'oldfriendson', min: 12, title: '故人之子', text: '一個少年拿著一塊舊玉佩找上門，說他父親年輕時受過你的恩惠，臨終前要他來報答。', choices: [
    { t: '指點他修行', run() { return `教人也是教自己。你對《${addTechXp(800)}》的領悟更深了。`; } },
    { t: '給他一筆盤纏', run(s) { const n = Math.min(s.stone, stoneUnit() * 3); s.stone -= n; s.brkBonus += .04; return `你給了他靈石 ${n}。少年鄭重地磕了三個頭，下次突破成功率 +4%。`; } }] },
  { id: 'icecave', min: 13, title: '萬年冰窟', text: '雪山深處有個冰窟，冰層裡封著一株還在開花的雪蓮。', choices: [
    { t: '鑿出雪蓮', run() { return `雪蓮入藥，你得到${addXiuPill(2)} 兩顆。`; } },
    { t: '在冰窟裡閉關', run() { return `寒氣淬鍊經脈，修為 +${fmt(addXiu(.45))}。`; } }] },
  { id: 'puppettroupe', min: 11, title: '傀儡戲班', text: '一個戲班演著傀儡戲，台上的木偶動作太過靈活，眼睛裡好像有淚。', choices: [
    { t: '揭穿傀儡師', run() { if (battle('傀儡師', placeLv() + 1, 1.1)) return `木偶裡封的是活人的魂，你把他們都放了。傀儡師身上搜出${giftArt([2, 3])}。`; return '傀儡師操著十幾具木偶圍攻你，你只能先撤。'; } },
    { t: '看完這場戲', run() { return '戲很好看。散場時，你覺得有個木偶朝你眨了眨眼。'; } }] },
  { id: 'emperor', min: 15, title: '皇帝求長生', text: '凡間皇帝派人尋到你，捧著半個國庫，只求一顆長生不老的丹藥。', choices: [
    { t: '給他一顆延壽丹', cond: () => count('yanshou') > 0, run(s) { s.items.yanshou--; return `皇帝多活了十五年。國庫裡的靈石都歸你：${addStone(stoneUnit() * 20)}。`; } },
    { t: '告訴他長生的代價', run(s) { s.brkBonus += .05; return '你講了很久。皇帝沉默半晌，讓人送你出宮。下次突破成功率 +5%。'; } }] },
  { id: 'phoenixfeather', min: 16, title: '天降火羽', text: '一根燃燒的羽毛從雲端飄落，落地處草木成灰，羽毛卻一點都沒有變小。', choices: [
    { t: '伸手去接', run(s) { if (s.root.elems.includes('火') || pct(.3)) return `火羽化作一道火紋烙進掌心，你學會了${giftSkill([3, 4])}。`; injure(200); return '你的手燒得只剩骨頭，養了好久才長回來。'; } },
    { t: '等它燒完', run() { return `羽毛燒了七天才熄。灰燼裡有一塊火晶，賣得靈石 ${addStone(stoneUnit() * 6)}。`; } }] },
  // ---------- 元嬰、化神期 ----------
  { id: 'disciple', min: 18, title: '洞府外跪著的人', text: '一個少女在你洞府外跪了三天三夜，說非你不拜。', choices: [
    { t: '收下她', run(s) { s.flags.disciple = 1; return '你收了第一個徒弟。她什麼都學得很快，就是話太多。'; } },
    { t: '讓她走', run() { return '第四天早上，她不見了，門口留著一籃野果。'; } }] },
  { id: 'disciple2', min: 21, cond: s => s.flags.disciple, title: '徒弟回來了', text: '當年那個話多的小徒弟已經獨當一面，帶著一身風霜回來看你。', choices: [
    { t: '「長大了。」', run() { return `她帶回了一路上攢下的東西：靈石 ${addStone(stoneUnit() * 10)}，還有${addXiuPill(2)} 兩顆。`; } }] },
  { id: 'elderseat', min: 18, title: '客卿長老', text: '一個大宗門派人來請你去當客卿長老，條件優渥。', choices: [
    { t: '答應', run() { return `宗門先給了一筆供奉：靈石 ${addStone(stoneUnit() * 12)}。`; } },
    { t: '婉拒', run(s) { s.brkBonus += .08; return '你說你還有自己的路要走。來人肅然起敬。下次突破成功率 +8%。'; } }] },
  { id: 'starwatch', min: 18, title: '觀星台', text: '廢棄的觀星台上，星盤還在轉，刻度停在一個你看不懂的位置。', choices: [
    { t: '推演天機', run() { return `你推演了七天，頭髮白了幾根，對《${addTechXp(1500)}》卻豁然開朗。`; } },
    { t: '把星盤撥回原位', run() { addLife(10); return '星盤停下的那一刻，你覺得有什麼東西被修正了。壽元 +10。'; } }] },
  { id: 'bloodrain', min: 20, title: '血雨', text: '城裡下了一場血雨，第二天家家戶戶都少了一個人。', choices: [
    { t: '查下去', run() { if (battle('血魔', L().stage + 2, 1.2)) return `你在城底找到血魔的巢穴，斬了它。巢裡有${giftTech([3, 4])}。`; return '血魔太強，你負傷而逃。那座城後來空了。'; } },
    { t: '離開這座城', run() { return '你走的時候，雨又開始下了。'; } }] },
  // ---------- 煉虛期以上 ----------
  { id: 'voidwhale', min: 21, title: '虛空巨鯨', text: '一頭比山還大的鯨魚游過虛空，背上長著整片森林。', choices: [
    { t: '登上鯨背', run() { addLife(50); return `你在鯨背上住了三年，對《${addTechXp(1800)}》的領悟大進。下來時，壽元還多了 50 年。`; } },
    { t: '目送牠遠去', run() { return '鯨歌在虛空裡響了很久很久。'; } }] },
  { id: 'skyeye', min: 22, title: '天穹裂痕', text: '天上裂開一道細縫。你很確定，縫的另一邊有東西在看你。', choices: [
    { t: '看回去', run() { if (pct(.5)) { S.meta.dao += 2; return '你們對視了很久。它先移開了視線。道心 +2。'; } injure(300); return '你七竅流血，昏迷了好些天。'; } },
    { t: '閉上眼', run() { return '等你睜眼，裂縫已經合上了。'; } }] },
  { id: 'smalltribulation', min: 24, title: '小天劫', text: '你的修為驚動了天道，頭頂聚起一團不該在這個境界出現的劫雲。', choices: [
    { t: '硬抗', run(s) { if (pct(.6)) { s.body += .05; return `雷劫淬體，你的肉身更強了，修為 +${fmt(addXiu(.5))}。`; } injure(300); return '你被劈得只剩一口氣。'; } },
    { t: '遁入地底', run() { return '劫雲找不到你，悻悻地散了。'; } }] },
  { id: 'timestream', min: 27, title: '時光亂流', text: '你誤入一段時光亂流，四周的一切都在倒著走。', choices: [
    { t: '順著走', run() { addLife(100); return '你出來時年輕了一截，壽元 +100。'; } },
    { t: '逆著走', run(s) { s.lifeBonus -= 50; return `你看見了過去的自己，也付出了代價。修為 +${fmt(addXiu(.8))}，壽元 -50。`; } }] },
  { id: 'godbone', min: 26, title: '古神骸骨', text: '上古神戰遺址裡，一具山一樣大的骸骨，心口還凝著一滴金色的血。', choices: [
    { t: '煉化那滴神血', run(s) { s.body += .1; s.tox = Math.min(100, s.tox + 50); return '神血入體，你的骨頭響了一整夜。肉身永久變強，丹毒 +50。'; } },
    { t: '把祂葬了', run(s) { s.brkBonus += .1; return '你花了一個月堆起一座墳。下次突破成功率 +10%。'; } }] },
  { id: 'karma', min: 25, title: '因果找上門', text: '一頭年輕的妖獸攔住你。你很久以前斬過的妖，是牠的母親。', choices: [
    { t: '了結這段因果', run() { if (battle('尋仇的妖獸', L().stage + 1, 1.2)) return '你贏了，卻沒有下殺手。牠走的時候回頭看了你一眼。'; return '牠比你想的強。你帶著傷離開了。'; } },
    { t: '讓牠走', run(s) { s.brkBonus += .08; return '你轉身離開。心裡有根刺被拔掉了，下次突破成功率 +8%。'; } }] },
  { id: 'immortalshell', min: 29, title: '仙人遺蛻', text: '雲海深處漂著一具盤坐的遺蛻，衣袍完好，臉上帶著笑。', choices: [
    { t: '在祂身邊參悟', run() { return `你坐了一百年。起身時，對《${addTechXp(3000)}》已經沒有不懂的地方。`; } },
    { t: '替祂合上眼', run() { addLife(80); return '指尖觸到祂眼皮的瞬間，遺蛻化成光散了。有一縷落進你身體裡，壽元 +80。'; } }] },
);

// ---------- 四位新人物（每位整個遊戲只登場一次） ----------
Object.assign(ARCS, {
  // 葉疏桐：一路追著你比劍的劍修
  ye: { name: '葉疏桐', steps: [
    { min: 3, title: '攔路比劍', text: '一個背著長劍的青衣少女攔住你：「聽說你很能打。拔劍。」', choices: [
      { t: '應戰', run(s) { const a = arc('ye'); a.aff += 2; if (battle('葉疏桐', s.stage + 1, 1)) { a.win = (a.win || 0) + 1; return '你贏了。她收劍咬著嘴唇：「下次。」轉身就走。'; } return '你輸了。她居高臨下地看著你：「就這樣？」'; } },
      { t: '不想打', run() { arc('ye').aff -= 1; return '她冷笑一聲：「孬種。」但你知道她還會來。'; } }] },
    { min: 6, title: '再戰', text: '葉疏桐又來了，劍比上次快了一倍：「這次不准留手。」', choices: [
      { t: '全力以赴', run(s) { const a = arc('ye'); a.aff += 2; if (battle('葉疏桐', s.stage + 2, 1)) { a.win = (a.win || 0) + 1; return '一招險勝。她愣了很久，忽然笑了，這是你第一次看她笑。'; } return '你盡力了，還是輸了半招。她說：「這才像話。」'; } },
      { t: '故意輸給她', run() { arc('ye').aff -= 2; return '她看出來了，劍尖抵著你的喉嚨：「你看不起我？」'; } }] },
    { min: 9, title: '劍塚', text: '葉疏桐找上你：「劍塚開了，一個人進不去。你來不來？」', choices: [
      { t: '一起闖', run(s) { const a = arc('ye'); a.aff += 3; if (battle('劍塚守靈', s.stage + 2, 1.1)) return `你們背靠背殺到劍塚最深處。她取了一柄劍，把另一件寶物推給你：${giftArt([2, 3])}。`; return '你們都負傷退了出來，她一路扶著你。'; } },
      { t: '讓她自己去', run() { arc('ye').aff -= 1; return '她一個人去了，回來時渾身是傷，沒有看你。'; } }] },
    { min: 12, title: '斷劍', text: '宗門大比上，葉疏桐被人暗算，劍斷了，經脈也廢了大半。她坐在擂台邊，一句話也不說。', choices: [
      { t: '耗盡家底替她續脈', run(s) { const a = arc('ye'); a.aff += 4; const n = Math.floor(s.stone * .5); s.stone -= n; return `你花了靈石 ${n} 買藥，守了她一個月。她醒來第一句話是：「你很煩。」`; } },
      { t: '送她幾顆療傷丹', cond: () => count('heal') >= 2, run(s) { s.items.heal -= 2; arc('ye').aff += 1; return '她收下了，沒有道謝。'; } },
      { t: '那是她自己的事', run() { arc('ye').aff -= 3; return '你走過擂台時，她叫住了你，又什麼都沒說。'; } }] },
    { min: 14, title: '最後一劍', text() { const a = arc('ye'); return a.aff >= 8 ? '葉疏桐的傷好了，劍意比以前更純。她在山頂等你：「最後一劍，我想讓你看。」' : a.aff >= 3 ? '葉疏桐在你門口插了一封戰書，墨跡很新。' : '葉疏桐提著斷劍找上門，眼神冷得像冰。'; }, choices: [
      { t: '去', run() { const a = arc('ye'); if (a.aff >= 8) { arcEnd('ye', 'zhiji'); return `那一劍劈開了半座山。她收劍說：「這一劍是你教我的。」臨別時把劍譜留給你：${giftSkill([3, 4])}。`; } if (a.aff >= 3) { arcEnd('ye', 'rival'); return '戰書上寫：「這輩子分不出勝負，下輩子接著打。」'; } arcEnd('ye', 'grudge'); injure(200); return '她一劍刺穿你的肩膀：「從今天起，我們是仇人。」'; } }] },
  ] },
  // 胡三：偷偷擺攤的老狐妖
  hu: { name: '胡三', steps: [
    { min: 1, title: '路邊小攤', text: '一個瞇瞇眼的胖掌櫃擺攤賣「仙家寶貝」，長衫底下露出一截毛茸茸的尾巴。', choices: [
      { t: '戳穿他是狐妖', run() { arc('hu').aff += 1; addHeal(2); return '胖掌櫃嚇得耳朵都冒出來了：「好漢饒命！小的胡三，這兩顆療傷丹孝敬您！」'; } },
      { t: '假裝沒看見，買一件', run(s) { arc('hu').aff += 2; const n = Math.min(s.stone, stoneUnit() * 3); s.stone -= n; return `你花了靈石 ${n}。胡三樂得尾巴亂甩，多塞給你${giftArt([1])}。`; } }] },
    { min: 4, title: '欠債的狐狸', text: '胡三被一群黃鼠狼精追著討債，一頭鑽到你身後：「恩公救我！」', choices: [
      { t: '替他出頭', run(s) { const a = arc('hu'); if (battle('黃鼠狼精', s.stage + 1, 1)) { a.aff += 3; return '黃鼠狼精們落荒而逃。胡三抱著你的腿哭：「恩公，我給您當牛做馬！」'; } a.aff += 2; return '你們一起被揍了一頓。胡三一邊揉臉一邊說：「恩公真夠義氣。」'; } },
      { t: '把他交出去', run() { arc('hu').aff -= 3; return `黃鼠狼精分了你靈石 ${addStone(stoneUnit() * 2)}。胡三被拖走時，眼神很受傷。`; } }] },
    { min: 8, title: '合夥生意', text: '胡三神秘兮兮地拉你合夥倒賣靈藥：「穩賺不賠，就差一筆本錢。」', choices: [
      { t: '入股', run(s) { const a = arc('hu'), n = Math.min(s.stone, stoneUnit() * 5); s.stone -= n; if (pct(.7)) { a.aff += 2; return `居然真的賺了。胡三分給你靈石 ${addStone(n * 3)}，還一直說「我胡三從不坑自己人」。`; } a.aff += 1; return `貨被官府沒收了，賠了靈石 ${n}。胡三愧疚得三天沒敢見你。`; } },
      { t: '不碰', run() { return '胡三嘟囔了一句「沒眼光」，自己去了。'; } }] },
    { min: 11, title: '狐狸窩', text: '一隊修士在圍剿胡三的狐狸窩。他擋在洞口，身後是一窩瑟瑟發抖的小狐狸。', choices: [
      { t: '救', run(s) { const a = arc('hu'); if (battle('圍剿的修士', s.stage + 1, 1.1)) { a.aff += 4; return '修士們退了。小狐狸們圍著你打轉，胡三背過身去擦眼睛。'; } a.aff += 3; injure(150); return '你擋了大部分的法術，胡三趁機把小狐狸都帶走了。'; } },
      { t: '不蹚渾水', run() { arc('hu').aff -= 4; return '後來你再經過那裡，狐狸窩已經空了。'; } }] },
    { min: 15, title: '老狐狸的家底', text() { const a = arc('hu'); return a.aff >= 8 ? '胡三老了，毛都白了。他把你拉到沒人的地方，從懷裡掏出一個布包。' : a.aff >= 3 ? '胡三搬家了，只在老地方留了一張紙條。' : '胡三不見了。你清點儲物袋時，發現少了一些東西。'; }, choices: [
      { t: '收下', run(s) { const a = arc('hu'); if (a.aff >= 8) { arcEnd('hu', 'friend'); return `「家傳的，別說是我給的。」布包裡是${giftArt([3, 4])}。`; } if (a.aff >= 3) { arcEnd('hu', 'debt'); return '紙條上歪歪扭扭寫著：「欠恩公一份情，記在帳上，子孫來還。」'; } arcEnd('hu', 'gone'); const n = Math.floor(s.stone * .1); s.stone -= n; return `少了靈石 ${n}。你氣得笑了出來。`; } }] },
  ] },
  // 謝無咎：被正道滅門的魔修
  xie: { name: '謝無咎', steps: [
    { min: 15, title: '血泊裡的書生', text: '你趕到時，村子已經成了廢墟。一個白衣書生站在血泊裡，對你微笑：「來晚了。」', choices: [
      { t: '出手', run(s) { const a = arc('xie'); if (battle('謝無咎', s.stage + 2, 1.1)) { a.hurt = 1; return '你一劍劃破他的白衣。他摸著傷口笑了：「有意思。我叫謝無咎，記住了。」'; } injure(200); return '他甚至沒有拔劍。「太弱了。」他踩過你身邊走了。'; } },
      { t: '先查他的來歷', run() { arc('xie').know = 1; return '你翻遍了附近的卷宗，只查到一個名字：謝無咎。'; } }] },
    { min: 18, title: '一筆交易', text: '一隻紙鶴飛進你的洞府，是謝無咎的字：「我手上有你缺的丹。放過我一次，丹就是你的。」', choices: [
      { t: '收下丹藥', run() { arc('xie').deal = 1; return `紙鶴化成三顆${addPill(3)}。你心裡有點不舒服。`; } },
      { t: '燒了紙鶴', run() { arc('xie').resolve = 1; return '紙鶴燒成灰之前，你好像聽見他在笑。'; } }] },
    { min: 21, title: '舊案', text: '你查到一樁三百年前的舊案：一個書香世家被正道以「通魔」之名滅門，只逃出一個孩子，姓謝。', choices: [
      { t: '去找他談談', run() { arc('xie').talk = 1; return '你們在一座破廟喝了一夜的酒。天亮時，他說：「你是第一個問我為什麼的人。」'; } },
      { t: '過去的事不重要', run() { arc('xie').resolve = 1; return '你把卷宗燒了。'; } }] },
    { min: 24, title: '血祭一城', text: '謝無咎要血祭一整座城來衝擊更高的境界，城裡住著十萬凡人。', choices: [
      { t: '阻止他', run(s) { const a = arc('xie'); if (battle('入魔的謝無咎', s.stage + 3, 1.3)) { a.beat = 1; return '你打碎了他的血祭大陣。他跪在城門口，半身都是血。'; } injure(300); return '你沒能阻止。那一夜，城裡的燈一盞一盞滅了。'; } },
      { t: '那不是你的事', run() { return '那一夜，城裡的燈一盞一盞滅了。'; } }] },
    { min: 26, title: '謝無咎的結局', text() { const a = arc('xie'); return !a.beat ? '謝無咎的魔功大成了。他最後一次出現在你面前，衣袍白得發亮。' : a.talk ? '謝無咎靠在城牆上，抬頭看你：「殺了我吧。還是說，你要給我一條路走？」' : '謝無咎倒在城門口，已經站不起來了。'; }, choices: [
      { t: '給他一條路', cond: () => arc('xie').beat && arc('xie').talk, run() { arcEnd('xie', 'redeemed'); return '你轉身離開。很久以後，你聽說有個白衣僧人在各地修橋鋪路。'; } },
      { t: '斬了他', cond: () => arc('xie').beat, run() { arcEnd('xie', 'slain'); return `他沒有躲。他死後，身上掉出${giftTech([4])}。`; } },
      { t: '目送他離開', cond: () => !arc('xie').beat, run() { arcEnd('xie', 'demon'); return '他朝天上指了指：「我先上去了，在上面等你。」然後消失在雲裡。'; } }] },
  ] },
  // 守碑人：虛空裡守著無字碑的老人
  bei: { name: '守碑人', steps: [
    { min: 21, title: '無字碑', text: '虛空裂隙的深處立著一塊無字碑，碑前坐著一個看不出年紀的老人，像是坐了很久很久。', choices: [
      { t: '坐下來陪他', run() { arc('bei').aff += 2; return `你們誰也沒說話。一坐就是十年，你對《${addTechXp(1200)}》多了幾分體悟。`; } },
      { t: '問他是誰', run() { arc('bei').aff += 1; return '老人頭也不抬：「守碑的。」'; } }] },
    { min: 24, title: '碑上的名字', text: () => '老人讓你看那塊碑。碑面慢慢浮現出無數名字，都是曾經飛升的人。最後幾個名字被劃掉了。' + beiNameExtra(), choices: [
      { t: '問為什麼劃掉', run() { const a = arc('bei'); a.aff += 1; a.know = (a.know || 0) + 1; return '老人說：「他們上去了，沒能過得去。」你問過得去什麼，他沒有回答。'; } },
      { t: '找自己的名字', run() { arc('bei').aff += 2; return '碑上沒有你。老人笑了：「急什麼。」'; } }] },
    { min: 27, title: '天外', text: '老人第一次主動開口：「飛升不是盡頭。天外有天，上面還有路，只是很多人走不回來。」', choices: [
      { t: '請他說下去', run() { const a = arc('bei'); a.aff += 1; a.know = (a.know || 0) + 1; return `他講了整整一年。你聽懂的不到一成，對《${addTechXp(3000)}》卻有了全新的理解。`; } },
      { t: '你還不想知道', run() { arc('bei').aff += 2; return '老人點點頭：「也對。」'; } }] },
    { min: 29, title: '換班', text: '老人說：「我守得太久了，想找個人換班。等你上去了，若有一天回得來，替我守一陣子。」', choices: [
      { t: '答應他', run() { const a = arc('bei'); a.aff += 3; a.vow = 1; return '老人看著你，眼神像在看很久以前的自己。'; } },
      { t: '不敢答應', run() { return '老人沒有勉強：「也是，這活不好幹。」'; } }] },
    { min: 31, title: '碑意', text: '你再去的時候，碑前空無一人，只有碑面上留著一縷還沒散去的碑意。', choices: [
      { t: '接下碑意', run(s) { if (arc('bei').vow) { arcEnd('bei', 'vow'); addLife(500); s.brkBonus += .1; return '碑意入體，你聽見老人的聲音：「記得你答應過的。」壽元 +500，下次突破成功率 +10%。'; } arcEnd('bei', 'left'); return `碑意化成一段感悟，你對《${addTechXp(3000)}》的領悟又深了一層。`; } }] },
  ] },
});

MEMORIES.push(
  { id: 'ye_z', bond: 'ye', end: 'zhiji', min: 4, title: '刻著名字的劍', text: '練劍時，一道劍光從天外落下，插在你面前。劍身上刻著兩個字：疏桐。', choices: [
    { t: '拔起那柄劍', run() { return `劍在你手裡輕輕震了一下，像是認出了你。你得到${giftArt([2, 3])}，劍柄上纏著一卷劍譜：${giftSkill([2, 3])}。`; } }] },
  { id: 'ye_r', bond: 'ye', end: 'rival', min: 6, title: '上輩子的戰書', text: '一個青衣女劍修攔住你，手裡捏著一封發黃的戰書：「上輩子沒分出勝負。拔劍。」', choices: [
    { t: '應戰', run(s) { if (battle('葉疏桐', s.stage + 2, 1.1)) return `這一次你贏了。她收劍時終於笑了：「認了。」臨走前教了你一招：${giftSkill([2, 3])}。`; return '又輸了半招。她說：「下輩子再來。」語氣卻很高興。'; } }] },
  { id: 'ye_g', bond: 'ye', end: 'grudge', min: 8, title: '斷劍尋仇', text: '一個提著斷劍的女人找上門，你從沒見過她，她卻說：「這把劍斷的時候，你在旁邊看著。」', choices: [
    { t: '迎戰', run(s) { if (battle('葉疏桐', s.stage + 3, 1.2)) return '她敗了，把斷劍插在你面前：「兩清了。」'; injure(250); return '她的劍比上輩子更快了。'; } }] },
  { id: 'hu_f', bond: 'hu', end: 'friend', min: 2, title: '小狐狸的攤子', text: '一個新開的小攤，掌櫃是個瞇瞇眼的狐狸少年。他看見你，愣了一下，翻出一本發黃的畫像冊對了半天。', choices: [
    { t: '「怎麼了？」', run() { return `「爺爺說，看見這張臉的客人要打一折！」少年硬塞給你${giftArt([2])}，還有靈石 ${addStone(stoneUnit() * 8)}。`; } }] },
  { id: 'hu_d', bond: 'hu', end: 'debt', min: 3, title: '還債的狐狸', text: '一個狐狸少年捧著一張發黃的欠條來找你：「我爺爺欠您一份情，讓我們家世世代代記著。」', choices: [
    { t: '收下這份情', run() { return `少年留下靈石 ${addStone(stoneUnit() * 10)}，還有兩顆${addXiuPill(2)}。`; } }] },
  { id: 'xie_r', bond: 'xie', end: 'redeemed', min: 10, title: '雲遊僧', text: '山道上遇見一個白衣雲遊僧，他替你指了一條近路，眼神熟悉得讓你心頭一震。', choices: [
    { t: '「我們見過嗎？」', run() { return `僧人笑而不答，只送你一句偈語。你參悟了很久，對《${addTechXp(2000)}》的理解更深了，還學會了${giftSkill([3])}。`; } }] },
  { id: 'xie_s', bond: 'xie', end: 'slain', min: 12, title: '劍中殘魂', text: '你撿到一柄白玉劍，劍裡附著一縷殘魂，對你說：「上輩子你殺了我。這輩子，換我來試試。」', choices: [
    { t: '鎮壓殘魂', run(s) { if (battle('謝無咎殘魂', s.stage + 2, 1.2)) return `殘魂散去，你得到那柄劍：${giftArt([3, 4])}。`; injure(200); return '殘魂帶著劍消失了，你受了不輕的傷。'; } }] },
  { id: 'xie_d', bond: 'xie', end: 'demon', min: 16, title: '天上來的信', text: '一隻燃著黑火的紙鶴落在你掌心，上面只有一行字：「我在上面等你。——謝」', choices: [
    { t: '收起來', run(s) { s.brkBonus += .1; return '你把信收進懷裡。這輩子你修得格外拚命。下次突破成功率 +10%。'; } }] },
  { id: 'bei_v', bond: 'bei', end: 'vow', min: 20, title: '碑前的燈', text: '虛空裡那塊無字碑還在。碑前多了一盞燈，燈下壓著一張字條：「你答應過的。」', choices: [
    { t: '點亮那盞燈', run() { S.meta.dao += 3; addLife(200); return '燈亮的時候，碑上浮現出你的名字，還沒被劃掉。道心 +3，壽元 +200。'; } }] },
  { id: 'bei_l', bond: 'bei', end: 'left', min: 20, title: '多出來的名字', text: '你又來到那塊無字碑前。碑上多了一個名字，是那個老人的，已經被劃掉了。', choices: [
    { t: '在碑前坐一會兒', run() { return `你坐了很久。起身時，對《${addTechXp(2500)}》多了一些說不清的領悟。`; } }] },
);

Object.assign(ARC_END_LABEL, {
  zhiji: '她成了你的劍道知己', rival: '她約你下輩子再比', grudge: '她斷劍立誓與你為敵',
  friend: '他把家傳寶貝塞給你', debt: '他留下一張欠條，說子孫來還', gone: '他捲了你的靈石跑了',
  redeemed: '你給了回頭的他一條路', slain: '你斬了他', demon: '他魔功大成，說在上面等你',
  vow: '你答應替他守碑', left: '你沒有接下那塊碑',
});

// 天材地寶現世：給下一個大境界要用的天材地寶。每個大境界都有一次機會（free：不受一世 4 次、隔 40 年的限制）
EVENTS.push(
  { id: 'tiancai', free: true, title: '天材地寶現世', cond: s => !!tcNext() && !s.flags['tc_' + stg().major], text: () => `遠處靈光沖天，是${ITEMS[tcNext()].name}出世了。四周已經聚了不少修士，還有一頭守著它的妖獸。`, choices: [
    { t: '跟妖獸搶', run() { if (battle('守寶妖獸', placeLv() + 2, 1.25)) return `你斬了妖獸，搶在眾人之前收起${addTc()}。`; return '妖獸太凶，你負傷退走，寶物被別人撿了便宜。'; } },
    { t: () => `出價收購（靈石 ${tcBuyPrice()}）`, cond: s => s.stone >= tcBuyPrice(), run(s) { s.stone -= tcBuyPrice(); return `搶到手的修士開價不低，你還是買下了${addTc()}。`; } },
    { t: '看看就好', run() { return '寶物最後落到一位大宗門弟子手裡。'; } }] },
);

// 五行之精：靈根補得進去才會出現（可重複，一世最多 4 次、隔 40 年）
EVENTS.push(
  { id: 'wuxingjing', repeat: true, min: 2, title: '地脈凝精', cond: s => !!essenceNext(s), text: '一處山谷的地脈五行失衡，石縫裡凝出一團精氣，靈光忽明忽暗。旁邊坐著一個看守地脈的老修士。', choices: [
    { t: '深入地脈取精', run() { if (pct(.6)) return `你頂著亂竄的地氣取出了${addEssence()}。`; injure(100); return '地氣反噬，你被震傷，精氣也散了。'; } },
    { t: () => `跟老修士換（靈石 ${fmt(ESSENCE_PRICE * .6)}）`, cond: s => s.stone >= ESSENCE_PRICE * .6, run(s) { s.stone -= ESSENCE_PRICE * .6; return `老修士收下靈石，替你取出了${addEssence()}。`; } },
    { t: '不碰地脈', run() { return '老修士朝你點了點頭。'; } }] },
);

// ---------- 第三批遊歷事件：補中後期（築基～渡劫），每個大境界至少 10 個 ----------
// x 開頭的 id；min 是小境界編號：築基 9、金丹 12、元嬰 15、化神 18、煉虛 21、合體 24、大乘 27、渡劫 30
const pay = n => Math.max(0, Math.min(L().stone, Math.round(n)));   // 付得起多少就付多少
EVENTS.push(
  // ---------- 築基 ----------
  { id: 'x_lingtian', min: 9, title: '租靈田', text: '一個駝背的老修士說他年紀大了，想把半畝靈田租出去，租金只要一點靈石。', choices: [
    { t: '租下來種一季', run(s) { s.stone -= pay(stoneUnit() * 3); return `你照著老人教的法子種了一季靈穀，吃下去修為 +${fmt(addXiu(.3))}。`; } },
    { t: '婉拒', run() { return '老人點點頭，又去問下一個路人。'; } }] },
  { id: 'x_shoumu', min: 9, title: '守墳的啞巴', text: '荒山上一座沒有碑的墳，旁邊坐著一個啞巴少年，看樣子守了很多年。', choices: [
    { t: '幫他把墳修好', run(s) { s.brkBonus += .03; return '少年一句話也說不出，只是朝你磕了三個頭。你心裡平靜了許多，下次突破成功率 +3%。'; } },
    { t: '比手畫腳問墳裡是誰', run() { return `少年從墳後挖出一個油布包，塞進你手裡。裡面是${giftTech([2])}。`; } }] },
  { id: 'x_yaoshi', min: 9, title: '藥市爭草', text: '兩個藥商為了一株三百年的靈草吵得面紅耳赤，硬要你來評理。', choices: [
    { t: '判給先看到的那個', run() { return `贏的人塞了一袋靈石給你，靈石 ${addStone(stoneUnit() * 3)}。`; } },
    { t: '自己出錢買下', run(s) { s.stone -= pay(stoneUnit() * 4); return `兩人都閉了嘴。你把靈草煉成兩顆${addPill(2)}。`; } }] },
  { id: 'x_lieyao', repeat: true, min: 9, title: '獵妖令', text: '坊市貼出獵妖令：有妖獸在附近傷人，賞金不少。', choices: [
    { t: '揭令', run() { if (battle('傷人的妖獸', placeLv() + 1, 1.05)) return `你帶回妖獸的頭顱，領到賞金靈石 ${addStone(stoneUnit() * 5)}。`; return '妖獸比告示上寫的凶得多，你負傷而回。'; } },
    { t: '不管', run() { return '幾天後，告示被撕了。'; } }] },

  // ---------- 金丹 ----------
  { id: 'x_jiedanyan', min: 12, title: '結丹宴', text: '一位舊識結丹成功，大擺宴席，派人送來請帖。', choices: [
    { t: '帶份禮去赴宴', run(s) { s.stone -= pay(stoneUnit() * 3); return `宴上有人以術法助興，你看了一夜，學會了${giftSkill([2, 3])}。`; } },
    { t: '託人送禮，人不去', run(s) { s.brkBonus += .03; return '你獨自閉關，聽著遠處的鼓樂聲，心境反而更穩了。下次突破成功率 +3%。'; } }] },
  { id: 'x_keqing', min: 12, title: '客卿之請', text: '一個中等宗門的長老親自登門，想請你當宗門客卿，每年有一筆供奉。', choices: [
    { t: '答應', run() { return `你掛了個客卿的名頭，宗門先送來一年的供奉：靈石 ${addStone(stoneUnit() * 12)}。`; } },
    { t: '婉拒，散修自在', run() { return `長老惋惜地走了。你把省下的心思放在修煉上，對《${addTechXp(1500)}》的體悟更深了。`; } }] },
  { id: 'x_danhen', min: 12, title: '金丹裂紋', text: '閉關內視時，你發現金丹表面多了一道細如髮絲的裂紋。', choices: [
    { t: '花靈石慢慢溫養', run(s) { s.stone -= pay(stoneUnit() * 6); addFound(stg().need * .3); return '你用靈石布下聚靈陣溫養了三個月，裂紋不見了，金丹反而更凝實，根基 +10%。'; } },
    { t: '硬壓下去', run(s) { injure(120); s.brkBonus += .06; return '你咬牙以法力強行彌合裂紋，痛得幾乎昏死。傷好之後，金丹堅固了不少，下次突破成功率 +6%。'; } }] },
  { id: 'x_baishi', min: 12, title: '跪在洞府外的孩子', text: '一個孩子在你洞府外跪了三天三夜，說要拜你為師。', choices: [
    { t: '收下他', run() { return `教人也是修行。你把所學從頭梳理了一遍，對《${addTechXp(1200)}》的理解更透徹了。`; } },
    { t: '指點他去別的宗門', run() { return `你寫了封薦書。孩子走前留下家傳的一卷殘譜：${giftSkill([2])}。`; } }] },
  { id: 'x_heishi', min: 12, title: '地下黑市', text: '有人引你進了一處地下黑市，攤子上擺著來路不明的功法玉簡。', choices: [
    { t: '買一卷', run(s) { s.stone -= pay(stoneUnit() * 8); return `你挑了一卷看起來最正經的：${giftTech([2, 3])}。`; } },
    { t: '轉身向執法堂舉報', run() { return `黑市被抄了，執法堂發給你一筆賞金：靈石 ${addStone(stoneUnit() * 6)}。`; } }] },
  { id: 'x_huaxing', min: 12, title: '求護法的妖狐', text: '一隻快要化形的妖狐攔住你，求你在牠化形時替牠護法，說會報答你。', choices: [
    { t: '替牠護法', run() { if (battle('趁機來搶的妖修', placeLv() + 2, 1.1)) return `妖狐化成了人形，送你一件從古墓裡叼出來的寶物：${giftArt([2, 3])}。`; return '來搶的妖修太多，你和妖狐都受了傷，化形失敗了。'; } },
    { t: '趁牠虛弱取走妖丹', run(s) { s.brkBonus -= .05; return `妖丹賣了靈石 ${addStone(stoneUnit() * 15)}。但那雙眼睛一直在你夢裡，下次突破成功率 -5%。`; } }] },
  { id: 'x_hushang', repeat: true, min: 12, title: '護送商隊', text: '一支商隊要穿過妖獸出沒的山谷，願意出高價請人護送。', choices: [
    { t: '接下這單', run() { if (battle('劫道的妖群', placeLv() + 1, 1.05)) return `商隊平安出谷，掌櫃付了靈石 ${addStone(stoneUnit() * 6)}。`; return '妖群太多，商隊折了幾車貨，你也掛了彩。'; } },
    { t: '不接', run() { return '商隊另請了別人。'; } }] },

  // ---------- 元嬰 ----------
  { id: 'x_chuqiao', min: 15, title: '元嬰出竅', text: '你第一次讓元嬰離體出竅，神遊天外，天地看起來和肉眼所見完全不同。', choices: [
    { t: '遊遍千里', run() { return `元嬰在雲間看見一處隱秘的靈脈，回來後你取了一些：靈石 ${addStone(stoneUnit() * 8)}，修為 +${fmt(addXiu(.2))}。`; } },
    { t: '只在洞府附近轉一圈', run(s) { s.brkBonus += .04; return '你謹慎地收回元嬰，對元神的掌控更熟練了。下次突破成功率 +4%。'; } }] },
  { id: 'x_duoshe', min: 15, title: '奪舍的殘魂', text: '一縷不知活了多久的殘魂趁你打坐時鑽進識海，想要奪舍。', choices: [
    { t: '在識海裡跟它拚了', run() { if (battle('奪舍的殘魂', L().stage + 2, 1.1)) return `你把殘魂煉化了，它的記憶碎片裡有一門術法：${giftSkill([3])}。`; injure(200); return '殘魂沒能得逞，但你的識海被攪得一團亂，很久才恢復。'; } },
    { t: '用丹藥穩住心神，慢慢磨', run() { injure(90); return `你花了一個月才把它磨滅，對《${addTechXp(2000)}》的修煉卻因此精進了。`; } }] },
  { id: 'x_guwang', min: 15, title: '古王墓', text: '凡間一座古王墓塌了一角，裡面隱隱有修士陪葬的法寶光芒。', choices: [
    { t: '下去看看', run() { if (Math.random() < .7) return `墓裡機關早已失效，你取走了${giftArt([3])}。`; injure(150); return '墓道裡還有沒散的禁制，你被打了出來。'; } },
    { t: '不擾亡者', run(s) { s.brkBonus += .03; return '你替古王把塌口封了回去。下次突破成功率 +3%。'; } }] },
  { id: 'x_lunjian', min: 15, title: '論劍台', text: '幾位元嬰修士在山巔論劍，看見你，邀你上台過幾招。', choices: [
    { t: '上台', run(s) { if (battle('論劍的元嬰修士', s.stage + 1, 1.05)) { for (const id of s.equip) s.skills[id] += 20; return '你贏了一場，台下一片喝彩。出招中的術法熟練度各 +20。'; } return '你輸了，但輸得心服口服。'; } },
    { t: '在台下看', run() { return `你看了三天，對《${addTechXp(1500)}》多了幾分體悟。`; } }] },
  { id: 'x_linglin', min: 15, title: '百年靈霖', text: '天上下起了一場帶著靈氣的雨，據說百年才有一次。', choices: [
    { t: '在雨中打坐', run() { return `雨水洗過經脈，修為 +${fmt(addXiu(.5))}。`; } },
    { t: '收集雨水煉丹', run() { return `你接了滿滿幾缸，煉出三顆${addXiuPill(3)}。`; } }] },
  { id: 'x_jiuchou', min: 15, title: '舊仇', text: '一個早年被你壞了好事的修士，如今也修到元嬰，帶著人找上門來。', choices: [
    { t: '一戰了結', run(s) { if (battle('尋仇的元嬰修士', s.stage + 1, 1.1)) return `你打退了他，他的儲物袋裡有靈石 ${addStone(stoneUnit() * 8)}。`; return '你負傷退走，這筆帳只能以後再算。'; } },
    { t: '賠一筆靈石了事', run(s) { const n = pay(s.stone * .2); s.stone -= n; return `你賠了靈石 ${n}，對方冷哼一聲走了。`; } }] },

  // ---------- 化神 ----------
  { id: 'x_fazesui', min: 18, title: '法則碎片', text: '天邊裂開一道縫，掉下一縷閃著微光的東西，是天地法則的碎片。', choices: [
    { t: '坐下來參悟', run() { return `你在裂縫下坐了三年，對《${addTechXp(4000)}》的領悟大進。`; } },
    { t: '封進玉瓶賣掉', run() { return `識貨的老怪出了高價：靈石 ${addStone(stoneUnit() * 15)}。`; } }] },
  { id: 'x_shenshi', min: 18, title: '神識交鋒', text: '兩位化神修士正以神識隔空交鋒，餘波把方圓百里的鳥獸都震暈了，你也被捲了進去。', choices: [
    { t: '強行介入', run(s) { if (battle('化神修士的神識', s.stage + 2, 1.1)) return `兩人都停了手，其中一個認你做了朋友，送你${giftSkill([3, 4])}。`; injure(180); return '你的神識被震傷了，頭痛了好幾天。'; } },
    { t: '封閉神識，退開', run() { return `你退到百里之外，旁觀了整場交鋒，修為 +${fmt(addXiu(.25))}。`; } }] },
  { id: 'x_zuohua', min: 18, title: '坐化洞府', text: '一位化神前輩坐化在洞府裡，屍身不腐，膝上放著一個儲物戒。', choices: [
    { t: '取走遺物', run() { return `你向前輩拜了三拜，取走了儲物戒。裡面有${giftArt([3, 4])}。`; } },
    { t: '替他安葬', run(s) { s.brkBonus += .05; return '你把前輩葬在洞府後的山坡上。下次突破成功率 +5%。'; } }] },
  { id: 'x_xinmojie', min: 18, title: '心魔具象', text: '化神之後，心魔不再只是念頭，它化成了一個跟你長得一模一樣的人，坐在你對面。', choices: [
    { t: '拔劍斬了它', run(s) { if (battle('你的心魔', s.stage, 1.2)) { s.brkBonus += .08; return '心魔消散了，你從未覺得自己如此清醒。下次突破成功率 +8%。'; } injure(240); return '它比你想的更了解你，你敗了，元氣大傷。'; } },
    { t: '跟它好好談一談', run() { addFound(stg().need * .3); return '你們談了很久。最後它點點頭，慢慢融回你的影子裡。根基 +10%。'; } }] },
  { id: 'x_wannianyao', min: 18, title: '萬年靈藥', text: '一株萬年靈藥即將成熟，四周已經圍了十幾個修士，誰也不肯先動手。', choices: [
    { t: '搶', run() { if (battle('爭奪靈藥的修士', placeLv() + 2, 1.15)) { addLife(60); return '你搶在眾人之前摘下靈藥服了，壽元 +60。'; } return '你被幾個人聯手打退了。'; } },
    { t: '退出', run() { return '後來聽說，那株靈藥被搶的人都沒活過三天。'; } }] },
  { id: 'x_xingtu', min: 18, title: '殘破星圖', text: '你在一家舊貨攤上翻到半張星圖，上面標著一處沒人知道的地方。', choices: [
    { t: '照著星圖去找', run() { const e = addEssence(); return e ? `星圖指向一處地脈交會之地，你在那裡取到一團${e}。` : `星圖指向一處荒廢的洞府，你找到靈石 ${addStone(stoneUnit() * 12)}。`; } },
    { t: '轉手賣掉', run() { return `有人一眼就看上了，出價靈石 ${addStone(stoneUnit() * 6)}。`; } }] },
  { id: 'x_luanliu', repeat: true, min: 18, title: '虛空亂流', text: '前方的空間扭曲了，一道虛空亂流擋住去路，裡面偶爾閃過寶光。', choices: [
    { t: '穿過去', run() { if (Math.random() < .6) return `你穿過亂流，順手撈到靈石 ${addStone(stoneUnit() * 8)}${tryDrop(.3)}。`; injure(150); return '亂流把你甩出百里，摔得不輕。'; } },
    { t: '繞路', run() { return '你多走了三天。'; } }] },

  // ---------- 煉虛 ----------
  { id: 'x_xumi', min: 21, title: '芥子', text: '你在虛空裡撿到一粒芥子，裡面竟是一方小天地。', choices: [
    { t: '煉化它', run() { return `芥子裡藏著前人留下的東西：${giftArt([3, 4])}。`; } },
    { t: '放它回虛空', run(s) { s.brkBonus += .04; return '芥子飄遠了，像一顆星星。你忽然懂了一點什麼，下次突破成功率 +4%。'; } }] },
  { id: 'x_xushou', min: 21, title: '裂縫裡的手', text: '一道空間裂縫裡伸出一隻蒼白的手，五指張開，像是在求救。', choices: [
    { t: '把他拉出來', run() { if (battle('裂縫裡的東西', L().stage + 2, 1.1)) return `拉出來的不是人，是一頭虛空獸。你斬了牠，牠的晶核賣得靈石 ${addStone(stoneUnit() * 15)}。`; injure(200); return '那隻手的力氣大得嚇人，你差點被拖進去。'; } },
    { t: '封住裂縫', run() { return `你用法力把裂縫封死了。手縮回去之前，掌心攤開，掉出一枚玉簡：${giftTech([3])}。`; } }] },
  { id: 'x_xuyu', min: 21, title: '虛空魚群', text: '一群透明的魚在虛空中游過，每一條身上都帶著一點星光。', choices: [
    { t: '撈幾條', run() { return `虛空魚入藥極好，你煉成兩顆${addPill(2)}。`; } },
    { t: '跟著魚群走', run() { return `魚群帶你到了一處靈氣濃郁的虛空島，你在那裡修煉了一陣，修為 +${fmt(addXiu(.4))}。`; } }] },
  { id: 'x_tongdao', min: 21, title: '同道之邀', text: '一位煉虛同道邀你一起深入虛空，說找到了一座上古遺府，但一個人進不去。', choices: [
    { t: '同去', run() { if (battle('遺府的守護傀儡', L().stage + 2, 1.15)) return `你們破開了遺府，平分了寶物。你分到${giftArt([4])}。`; return '傀儡太強，你們狼狽地退了出來。'; } },
    { t: '婉拒', run() { return '後來他一個人去了，再也沒回來。'; } }] },
  { id: 'x_jiuyou', min: 21, title: '九幽之門', text: '虛空深處有一扇半開的門，門縫裡吹出的風冷得刺骨。', choices: [
    { t: '往裡看一眼', run(s) { injure(150); s.brkBonus += .06; return '門裡是無盡的黑暗，你只看了一眼就退了出來，渾身發抖。但看過最深的黑，心境反而更穩了，下次突破成功率 +6%。'; } },
    { t: '把門關上', run() { return `門很重。關上之後，門環上掉下一塊冰冷的鐵牌，牌上刻著一門術法：${giftSkill([3, 4])}。`; } }] },
  { id: 'x_shiying', min: 21, title: '時光殘影', text: '虛空某處的時間是凝固的，你看見一位古修士保持著出劍的姿勢，一動也不動。', choices: [
    { t: '看他的劍招', run() { return `你看了很久，總算看懂了那一劍。學會了${giftSkill([4])}。`; } },
    { t: '輕輕繞過', run() { return `你沒有驚動他。走遠之後回頭看，那個身影已經不見了。修為 +${fmt(addXiu(.3))}。`; } }] },
  { id: 'x_yuren', min: 21, title: '虛空漁人', text: '一個戴斗笠的老人坐在虛空中垂釣，魚線伸進看不見的地方。', choices: [
    { t: '坐下陪他釣', run() { return `你們釣了三個月，什麼也沒釣到。臨走時老人說：「你急什麼。」你對《${addTechXp(3000)}》的心境卻沉了下來。`; } },
    { t: '問他在釣什麼', run() { return '老人笑了：「釣一個名字。」你還想再問，他和魚竿都不見了。'; } }] },

  // ---------- 合體 ----------
  { id: 'x_faxiang', min: 24, title: '法相合一', text: '你的法相與肉身第一次真正合而為一，舉手之間，風雲都跟著動了。', choices: [
    { t: '試著引動天地之力', run() { return `山河為之一震。你對《${addTechXp(4000)}》的掌握更進一步。`; } },
    { t: '收斂氣息', run(s) { s.brkBonus += .05; return '你壓住了那股力量，不讓它驚動任何人。下次突破成功率 +5%。'; } }] },
  { id: 'x_shenyi', min: 24, title: '神遺之地', text: '一塊大陸大小的古神屍骨漂在虛空中，骨縫裡長滿了靈草。', choices: [
    { t: '採藥', run() { return `你採了一大包靈草，煉成三顆${addPill(3)}。`; } },
    { t: '在骨上修煉', run() { return `古神殘留的力量灌進你的身體，修為 +${fmt(addXiu(.5))}。`; } }] },
  { id: 'x_wenxin', min: 24, title: '天道問心', text: '冥冥之中有一個聲音問你：「你修道，是為了什麼？」', choices: [
    { t: '「為了長生。」', run() { addLife(80); return '聲音沉默了一會兒：「也好。」壽元 +80。'; } },
    { t: '「為了找回一個名字。」', run(s) { s.brkBonus += .08; return '聲音沒有再說話。但你覺得，有什麼東西記住了你的回答。下次突破成功率 +8%。'; } }] },
  { id: 'x_laoguai', min: 24, title: '老怪的棋局', text: '一個活了不知多少年的老怪擺了一盤棋，說贏了他就送你一樣東西。', choices: [
    { t: '坐下來下棋', run() { if (Math.random() < .5) return `你贏了。老怪大笑著拿出${giftTech([4])}。`; return `你輸了。老怪也不惱，說你下得不錯，送了你靈石 ${addStone(stoneUnit() * 10)}。`; } },
    { t: '不下', run() { return '老怪嘆氣：「這年頭，連個陪我下棋的人都沒有。」'; } }] },
  { id: 'x_wanjun', min: 24, title: '萬軍之戰', text: '兩大勢力在星海邊決戰，戰場上法寶亂飛，死傷無數。', choices: [
    { t: '加入弱的一方', run(s) { if (battle('敵方大將', s.stage + 2, 1.2)) return `你斬了敵方大將，戰局逆轉。弱方送你${giftArt([4])}作為謝禮。`; injure(240); return '你被三位合體修士圍攻，重傷退走。'; } },
    { t: '遠遠看著', run() { return `你在戰場邊撿到不少遺落的靈石：${addStone(stoneUnit() * 12)}。`; } }] },
  { id: 'x_tianhuo', min: 24, title: '天火之山', text: '一座山燒了一萬年還沒燒完，火焰的顏色是從沒見過的白。', choices: [
    { t: '取一縷天火淬體', run(s) { injure(180); s.body += .05; return '天火燒過全身，痛不欲生。傷好之後，你的肉身強了一截：氣血、攻擊、防禦永久 +5%。'; } },
    { t: '借火煉丹', run() { return `你借天火煉了一爐丹，出爐兩顆${addPill(2)}。`; } }] },
  { id: 'x_fengyin', min: 24, title: '封印鬆動', text: '一座上古封印鬆動了，裡面的東西正在往外擠。附近的人都逃光了。', choices: [
    { t: '把封印補好', run(s) { if (battle('封印裡的東西', s.stage + 2, 1.2)) { s.brkBonus += .06; return '你把那東西打了回去，重新封好。下次突破成功率 +6%。'; } injure(240); return '你沒能壓住它，只好也逃了。'; } },
    { t: '跟著大家逃', run() { return '你回頭看了一眼，封印的光芒還在。'; } }] },

  // ---------- 大乘 ----------
  { id: 'x_chuandao', min: 27, title: '開壇傳道', text: '有人請你開壇講道。消息傳出去，來了上萬個修士。', choices: [
    { t: '講三天三夜', run() { return `講到最後，你自己也有了新的體悟，對《${addTechXp(5000)}》的理解更上一層。`; } },
    { t: '只講一句話', run(s) { s.brkBonus += .05; return '你說完那句話就走了。有人說那是廢話，有人說那是大道。下次突破成功率 +5%。'; } }] },
  { id: 'x_guren', min: 27, title: '故人之墓', text: '你在一座小鎮外看到一座墓，墓碑上的名字，是你年少時認識的一個凡人。', choices: [
    { t: '上一炷香', run() { addFound(stg().need * .3); return '你在墓前坐了一整天，想起很多早就忘了的事。根基 +10%。'; } },
    { t: '找他的後人', run() { return `他的曾孫是個小鎮郎中，聽說你是祖父的朋友，硬塞給你一包家傳的藥材。你煉成兩顆${addPill(2)}。`; } }] },
  { id: 'x_fanren', min: 27, title: '凡人問道', text: '一個砍柴的凡人攔住你，問：「仙人，修道真的能長生嗎？」', choices: [
    { t: '「能。」', run() { return '他高高興興地走了。你看著他的背影，想起自己也曾經這樣問過。'; } },
    { t: '「我也還在找答案。」', run(s) { s.brkBonus += .05; return '他愣了一下，然後笑了：「那仙人也跟我們差不多嘛。」你也笑了。下次突破成功率 +5%。'; } }] },
  { id: 'x_ganying', min: 27, title: '飛升感應', text: '你感應到了天上的某種東西，像是一扇門在很遠的地方輕輕開了一條縫。', choices: [
    { t: '凝神去感應', run() { return `你看見門縫裡有光，光裡有字，但看不清。修為 +${fmt(addXiu(.5))}。`; } },
    { t: '還不是時候', run(s) { s.brkBonus += .04; return '你收回了心神。門會等你的。下次突破成功率 +4%。'; } }] },
  { id: 'x_jieling', min: 27, title: '劫靈', text: '上一次渡劫失敗的修士，殘留在天地間的劫靈纏上了你。', choices: [
    { t: '超度它', run(s) { if (battle('劫靈', s.stage + 1, 1.2)) { s.brkBonus += .06; return '劫靈散去前，把它渡劫時的經驗留給了你。下次突破成功率 +6%。'; } injure(240); return '劫靈太強，你只能先避開。'; } },
    { t: '避開它', run() { return '你繞了遠路。它在後面跟了很久，最後才散去。'; } }] },
  { id: 'x_huixiang', min: 27, title: '回鄉', text: '你回到出生的那個地方。小鎮早就不在了，原地長成了一片樹林。', choices: [
    { t: '在林子裡住幾天', run() { return `你在樹下打坐，聽了幾天鳥叫，修為 +${fmt(addXiu(.4))}。`; } },
    { t: '種下一棵樹就走', run() { addLife(50); return '你種下一棵樹，在樹下埋了一顆靈種。等它長大，這裡會是一片靈林。壽元 +50。'; } }] },
  { id: 'x_dixin', min: 27, title: '地心之火', text: '大地深處有一團燃燒了億萬年的火，是天地最初的熱。', choices: [
    { t: '下去取火', run() { if (Math.random() < .6) return `你取到一縷地心火，用它重煉法寶，得到${giftArt([4])}。`; injure(240); return '下到一半，你就被熱浪逼了回來。'; } },
    { t: '在火邊悟道', run() { return `你在火邊坐了十年，對《${addTechXp(5000)}》的領悟又深了一層。`; } }] },
  { id: 'x_daxiu', repeat: true, min: 27, title: '大修士的試探', text: '一位不知名的大修士遠遠放出氣息試探你，像是在掂量你的斤兩。', choices: [
    { t: '回敬他', run(s) { if (battle('不知名的大修士', s.stage + 1, 1.1)) return `對方收回氣息，丟過來一個儲物袋：靈石 ${addStone(stoneUnit() * 10)}。`; return '你落了下風，對方哼了一聲就走了。'; } },
    { t: '收斂氣息', run() { return '對方似乎失了興趣，走了。'; } }] },

  // ---------- 渡劫 ----------
  { id: 'x_jieyun', min: 30, title: '劫雲初現', text: '你頭頂的天空開始聚起雲，每天都比前一天更厚一點。那是屬於你的劫雲。', choices: [
    { t: '抬頭看著它', run(s) { s.brkBonus += .05; return '你天天抬頭看，慢慢地就不怕了。'; } },
    { t: '加緊修煉', run() { return `你不再看天，只是修煉。修為 +${fmt(addXiu(.4))}。`; } }] },
  { id: 'x_jiuxin', min: 30, title: '九重心魔', text: '渡劫前最後的心魔來了，一共九重，每一重都是你這一生最後悔的事。', choices: [
    { t: '一重一重走過去', run(s) { if (battle('九重心魔', s.stage, 1.25)) { addFound(stg().need * .3); return '你走完了九重。最後一重裡，你看見一塊碑。根基 +10%。'; } injure(240); return '你在第七重停下了，醒來時滿臉是淚。'; } },
    { t: '閉上眼睛', run() { return '你不看，它們就慢慢散了。但你知道它們還在。'; } }] },
  { id: 'x_huiyi', min: 30, title: '一生回望', text: '某個傍晚，你忽然把這一生從頭到尾想了一遍，從那個凡人小鎮開始。', choices: [
    { t: '想到天亮', run() { return `你想起了每一個人的名字。對《${addTechXp(5000)}》的體悟，在那一夜圓滿了許多。`; } },
    { t: '不想了', run() { return '過去的就過去了。你起身繼續修煉。'; } }] },
  { id: 'x_zuihou', min: 30, title: '最後的對手', text: '一位同樣修到渡劫的老對手找上門，說想在渡劫前跟你再打一次。', choices: [
    { t: '奉陪', run(s) { if (battle('老對手', s.stage + 1, 1.15)) return `你贏了。他大笑著說：「這下可以安心渡劫了。」臨走時把他的法寶送給你：${giftArt([4])}。`; return '你輸了半招。他說：「下輩子再來。」'; } },
    { t: '各自渡劫吧', run() { return '他點點頭，轉身走了。你們都知道，這可能是最後一面。'; } }] },
  { id: 'x_jiaotuo', min: 30, title: '交託傳承', text: '你開始想，如果渡劫失敗，你這一身所學該留給誰。', choices: [
    { t: '寫一卷心得留下', run() { return `你寫了三個月。寫完才發現，自己又多懂了一些。對《${addTechXp(4000)}》的體悟更深了。`; } },
    { t: '不留了', run(s) { s.brkBonus += .05; return '你決定不給自己留退路。下次突破成功率 +5%。'; } }] },
  { id: 'x_leichi', min: 30, title: '雷池', text: '一處上古雷池，池水裡全是雷，渡劫前在裡面泡一泡，據說能先嘗嘗天雷的滋味。', choices: [
    { t: '跳進去', run(s) { injure(180); s.body += .05; return '你在雷池裡泡了七天，出來時渾身焦黑。但肉身強了一截：氣血、攻擊、防禦永久 +5%。'; } },
    { t: '只泡腳', run() { return '雷電從腳底竄上來，麻得你直跳。旁邊的老修士笑得前仰後合。'; } }] },
  { id: 'x_yuluo', min: 30, title: '人間雨落', text: '你在人間的屋簷下躲雨，聽著雨聲，忽然很想再當一回凡人。', choices: [
    { t: '在凡間住一陣子', run() { addLife(40); return '你在鎮上開了間小茶館，住了半年。那半年過得很慢。壽元 +40。'; } },
    { t: '雨停就走', run() { return `雨停了，你回到洞府，修為 +${fmt(addXiu(.3))}。`; } }] },
  { id: 'x_beiying', min: 30, title: '碑影', text: '渡劫前夕，你又夢到了那塊碑。這一次，你站在碑前，伸手就能碰到。', choices: [
    { t: '伸手去摸', run(s) { s.brkBonus += .06; return '碑是涼的。你的手指停在一個被劃掉的名字上，怎麼也拿不開。下次突破成功率 +6%。'; } },
    { t: '轉身離開', run() { return '你走了幾步，聽見身後有人嘆氣。回頭，什麼都沒有。'; } }] },
  { id: 'x_jieshou', min: 30, title: '渡劫的見證者', text: '一位正在渡劫的修士被天雷劈得半死，看見你，求你幫他擋最後一道雷。', choices: [
    { t: '替他擋', run(s) { if (battle('天雷', s.stage + 1, 1.2)) return `你擋下了那道雷。他飛升前把一身寶物都留給了你：${giftArt([4])}，還有靈石 ${addStone(stoneUnit() * 15)}。`; injure(300); return '雷太強，你們兩個都被劈飛了。他沒能飛升。'; } },
    { t: '天劫不能插手', run() { return '你看著他被最後一道雷吞沒。那一夜你沒有睡。'; } }] },
  { id: 'x_jieqian', repeat: true, min: 30, title: '劫前試煉', text: '你找了一處荒山，引來一點點天雷，想先試試自己的斤兩。', choices: [
    { t: '硬接', run(s) { if (battle('引來的天雷', s.stage, 1.1)) return `你接住了。散落的雷晶賣得靈石 ${addStone(stoneUnit() * 10)}。`; return '你被劈得滿身焦黑，看來還得再練。'; } },
    { t: '算了', run() { return '還是別招惹天雷比較好。'; } }] },
);

// ---------- 練氣事件的第二個版本：前世遇過的，這一世換成另一個情境或後續 ----------
const EVENT_ALTS = {
  cave: { title: '山壁古洞・故地', text: '又是那面山壁。藤蔓後的洞口還在，洞口地上卻多了一行新刻的字：「後來者，留步。」', choices: [
    { t: '照樣進去', run() { if (Math.random() < .5) return `洞底的遺骨不見了，原地放著一個包袱，像是專門留給誰的。裡面有靈石 ${addStone(stoneUnit() * 6)}${tryDrop(.4)}。`; injure(80); return '洞裡的禁制比上次更凶了。'; } },
    { t: '在字旁邊也刻一行', run(s) { s.brkBonus += .03; return '你刻下「來過」兩個字。不知道為什麼，心裡踏實了很多。下次突破成功率 +3%。'; } }] },
  scroll: { title: '殘破玉簡・另一半', text: '溪邊淤泥裡又露出一角玉簡，你一看就認出來——是上輩子那枚殘簡的另一半。', choices: [
    { t: '把兩半拼起來參悟', run() { return `前後兩半合在一起，竟是一篇完整的心法，修為 +${fmt(addXiu(.45))}。`; } },
    { t: '拿去賣', run() { return `識貨的人出了雙倍價錢：靈石 ${addStone(stoneUnit() * 4)}。`; } }] },
  rogue: { title: '散修之徒', text: '一個年輕散修攔住你，問你是不是在某片林子裡救過一個被妖獸追的人。「那是我師父。他說，下輩子見到你也要報恩。」', choices: [
    { t: '「我不記得了。」', run() { return `年輕人笑了笑，還是把師父留下的東西塞給你：${addPill(1)}，還有靈石 ${addStone(stoneUnit() * 3)}。`; } },
    { t: '問他師父後來怎樣了', run() { return `「築基了，活到一百多歲，走得很安詳。」你點點頭，對《${addTechXp(600)}》的體悟忽然清晰了一些。`; } }] },
  scam: { title: '路邊神丹・老頭的兒子', text: '山道邊還是那個攤子，只是擺攤的換成了一個中年人，長得跟賣假丹的老頭一模一樣。', choices: [
    { t: '問他父親去哪了', run() { return `「走了。臨走說，有個客人不信他，結果那客人是對的。」他送你一顆真的${addXiuPill(1)}，說是賠罪。`; } },
    { t: '不理他', run() { return '他在背後喊：「這次是真貨！」你沒有回頭。'; } }] },
  spring: { title: '林中靈泉・乾涸', text: '你憑著前世的記憶找到那汪靈泉，泉眼卻已經乾了，只剩一圈白色的泉華。', choices: [
    { t: '往下挖', run() { const e = addEssence(); return e ? `挖到三尺深，泉脈的源頭凝成了一團${e}。` : `挖到三尺深，挖出一塊泉髓，修為 +${fmt(addXiu(.4))}。`; } },
    { t: '在泉邊打坐', run() { return `泉雖然乾了，地脈的靈氣還在。修為 +${fmt(addXiu(.3))}。`; } }] },
  drought: { title: '旱村・祠堂', text: '那個旱村如今成了富庶的大鎮，鎮口祠堂裡供著一尊仙師像。村民說是很久以前替他們求過雨的人。', choices: [
    { t: '進去看看', run(s) { s.brkBonus += .05; return '泥像的臉被香火燻得看不清。你站在像前，好像有什麼願力輕輕落在你身上。下次突破成功率 +5%。'; } },
    { t: '不進去', run() { return `你在鎮上吃了碗麵。老闆聽你說是過路的修士，堅持不收錢，還塞給你靈石 ${addStone(stoneUnit() * 2)}。`; } }] },
  elder: { title: '溪邊老者・空竿', text: '溪邊那根釣竿還插在石縫裡，人卻不見了。竿上綁著一張字條：「三處不對，改了沒有？」', choices: [
    { t: '照字條上說的改', run(s) { return `你把吐納的三處毛病一一改過，對《${addTechXp(1200)}》的修煉順暢了許多。`; } },
    { t: '把釣竿帶走', run() { return `釣竿竟然是一件法寶：${giftArt([1, 2])}。`; } }] },
  temple: { title: '破廟・神像', text: '你又躲進那座破廟避雨。供桌上的神像換了一張臉——看起來有點像你。', choices: [
    { t: '仔細看', run() { return `越看越像。你在像前打坐到雨停，心裡有種說不出的感覺。修為 +${fmt(addXiu(.25))}。`; } },
    { t: '把神像轉過去', run() { return '轉過去之後，神像背面刻著一個名字，被人用刀劃掉了。'; } }] },
  rustsword: { title: '河床鏽劍・劍主', text: '乾涸的河床上，一個少女正在找什麼。她說她家祖傳的劍，很久以前被人撿走了。', choices: [
    { t: '「我撿過一把。」', run() { return `她不要劍，只要劍柄上的穗子。拿到之後，她把一卷劍譜塞給你：${giftSkill([1, 2])}。`; } },
    { t: '幫她一起找', run() { return `你們找了一整天，劍沒找到，倒挖出一袋舊靈石：${addStone(stoneUnit() * 4)}。`; } }] },
  gamble: { title: '賭石攤・攤主', text: '賭石攤還在，攤主換成了個年輕人。他一眼認出你：「我爹說過，有個人從來不上當。」', choices: [
    { t: '「賭一把。」', cond: s => s.stone >= 10, run(s) { const bet = Math.floor(s.stone * .2); s.stone -= bet; if (Math.random() < .45) { s.stone += bet * 3; return `切出一塊靈髓。年輕人苦笑：「爹沒說錯。」你賺了 ${bet * 3}。`; } return `一刀下去，什麼都沒有。年輕人鬆了口氣。你賠了 ${bet}。`; } },
    { t: '「不賭。」', run() { return '年輕人點點頭：「爹也這麼說過。」'; } }] },
};

// ---------- 第三批人物：沈清禾（金丹）、殷九娘（化神）、陸知微（合體）、顧長歌（大乘） ----------
// 跟其他人物一樣，整個遊戲只登場一次；結局在之後某一世以前世羈絆找上你
Object.assign(ARCS, {
  // 沈清禾：玄霄宗內門弟子，被宗門當成棋子
  shen: { name: '沈清禾', steps: [
    { min: 12, title: '迷路的內門弟子', text: '一個穿玄霄宗內門服飾的少女在山裡迷了路，劍上沾著血，卻說是師門派她來「處理一點小事」。', choices: [
      { t: '送她回山門', run() { arc('shen').aff += 2; return '一路上她話很少。到了山門口，她回頭說：「我叫沈清禾。今天的事，別跟人說。」'; } },
      { t: '問她處理了什麼', run() { const a = arc('shen'); a.aff += 1; a.know = 1; return '她沉默了很久：「一個不肯把靈脈讓給宗門的散修。」說完就走了。'; } }] },
    { min: 13, title: '宗門的命令', text() { return arc('shen').aff >= 2 ? '沈清禾找到你，臉色很差：「宗門要我去殺一個人。那人沒做錯什麼。你說，我該不該去？」' : '玄霄宗的人到處在找一個叫沈清禾的弟子，說她違抗師命，私自下山。'; }, choices: [
      { t: '「不該做的事，就別做。」', run() { const a = arc('shen'); a.aff += 2; a.defy = 1; return '她看了你很久，把宗門令牌捏碎了。'; } },
      { t: '「宗門養你，你就該聽話。」', run() { const a = arc('shen'); a.obey = 1; return '她點點頭，眼裡的光暗了下去。'; } }] },
    { min: 14, title: '追兵', text() { return arc('shen').defy ? '玄霄宗派了長老追殺沈清禾。她躲進你的洞府，渾身是傷。' : '沈清禾成了玄霄宗最鋒利的那把劍。她帶著人經過你的洞府，像沒看見你一樣。'; }, choices: [
      { t: '替她擋下追兵', cond: () => !!arc('shen').defy, run(s) { const a = arc('shen'); if (battle('玄霄宗長老', s.stage + 2, 1.15)) { a.aff += 3; a.saved = 1; return '你打退了長老。沈清禾靠在洞壁上，第一次笑了。'; } injure(240); a.aff += 2; return '你沒能打贏，但拖住了時間，她逃了。'; } },
      { t: '叫住她', cond: () => !arc('shen').defy, run() { const a = arc('shen'); a.aff += 1; return '她停下腳步，沒有回頭：「我已經回不去了。」'; } },
      { t: '不插手', run() { return '你關上了洞府的門。'; } }] },
    { min: 16, title: '清禾', text() { const a = arc('shen'); return a.saved ? '很多年後，沈清禾在一座小山上開了自己的宗門，只收無家可歸的孩子。她寫信邀你去看看。' : a.defy ? '你聽說沈清禾逃出了玄霄宗，從此下落不明。有人說在海外見過她。' : '沈清禾當上了玄霄宗的長老。她來見你一面，穿著你第一次見她時那種顏色的衣服。'; }, choices: [
      { t: '去看她', run() { const a = arc('shen'); if (a.saved) { arcEnd('shen', 'founded'); return `她的宗門很小，孩子們都叫她師父。臨走時她把當年那把劍送給你：${giftArt([3])}。`; } if (a.defy) { arcEnd('shen', 'free'); return '你沒找到她。但海邊的礁石上刻著一行字：「我自由了。」'; } arcEnd('shen', 'elder'); return '她說：「我現在也在下命令了。」你不知道該說什麼。'; } }] },
  ] },
  // 殷九娘：開黑市、賣情報、也賣毒，亦正亦邪
  yin: { name: '殷九娘', steps: [
    { min: 18, title: '黑市老闆娘', text: '一間只在半夜開門的鋪子，老闆娘倚在櫃檯上抽著煙斗：「我叫殷九娘。這裡什麼都賣，消息、毒藥、人命。你想買什麼？」', choices: [
      { t: '買一條消息', run(s) { s.stone = Math.max(0, s.stone - stoneUnit() * 5); arc('yin').aff += 2; return `她說了一處靈脈的位置。你去了，果然有：靈石 ${addStone(stoneUnit() * 10)}。`; } },
      { t: '「我什麼都不買。」', run() { arc('yin').aff += 1; return '她笑了：「難得。你這種人最貴。」'; } }] },
    { min: 19, title: '一份名單', text: '殷九娘遞給你一份名單：「這上面的人都該死。幫我殺一個，我欠你一個人情。」', choices: [
      { t: '先查查這個人', run() { const a = arc('yin'); a.aff += 2; a.check = 1; return '你查了。那人確實罪有應得——但殷九娘要他死，是因為他擋了她的財路。'; } },
      { t: '直接動手', run(s) { const a = arc('yin'); if (battle('名單上的人', s.stage + 1, 1.1)) { a.kill = 1; a.aff += 1; return '人死了。殷九娘送來一大袋靈石，什麼也沒問。'; } injure(180); return '那人比你想的強，你負傷退走。'; } },
      { t: '拒絕', run() { arc('yin').refuse = 1; return '她收回名單：「好人活不長的。」'; } }] },
    { min: 20, title: '九娘的毒', text: '殷九娘中了毒——她自己配的毒，被仇家下回了她身上。她躺在鋪子裡，臉色發青，卻還在笑。', choices: [
      { t: '替她找解藥', run() { const a = arc('yin'); if (battle('藏著解藥的仇家', L().stage + 2, 1.15)) { a.aff += 3; a.cured = 1; return '你搶回了解藥。她醒來後盯著你看了很久：「你圖什麼？」'; } injure(240); return '你沒拿到解藥。她自己硬撐了過來，只是瞎了一隻眼。'; } },
      { t: '「這是你自找的。」', run() { arc('yin').leave = 1; return '她閉上眼睛：「對，是我自找的。」'; } }] },
    { min: 22, title: '收攤', text() { const a = arc('yin'); return a.cured && a.aff >= 6 ? '殷九娘把鋪子關了，說要去做點正經事。她問你，願不願意當她第一個正經生意的客人。' : a.leave ? '鋪子換了主人。新老闆說，前一個老闆娘把名單上剩下的人都殺光了，然後消失了。' : '殷九娘的生意越做越大，半個修仙界的消息都經過她的手。她託人帶話給你：「你還欠我一個人情。」'; }, choices: [
      { t: '去見她', run() { const a = arc('yin'); if (a.cured && a.aff >= 6) { arcEnd('yin', 'honest'); return `她開了一間藥鋪，賣的全是真藥。第一單生意送你三顆${addPill(3)}，不收錢。`; } if (a.leave) { arcEnd('yin', 'vanish'); return '你沒找到她。只在鋪子的櫃檯底下，找到一個刻著你名字的煙斗。'; } arcEnd('yin', 'queen'); return `她坐在高樓上，身邊全是人。她只說了一句：「人情先欠著。」然後扔給你靈石 ${addStone(stoneUnit() * 15)}。`; } }] },
  ] },
  // 陸知微：一輩子在研究那塊碑的學者，不是守碑人
  lu: { name: '陸知微', steps: [
    { min: 24, title: '抄碑的人', text: '虛空邊緣，一個書生模樣的修士正對著一片空無一物的地方抄寫。他說他在抄一塊碑，只是碑還沒出現。', choices: [
      { t: '問他抄的是什麼', run() { arc('lu').aff += 2; return '「名字。」他頭也不抬，「我叫陸知微，抄了三千年，抄到一半的時候，發現有人在劃名字。」'; } },
      { t: '覺得他瘋了，走開', run() { arc('lu').aff += 1; return '他在背後說：「你身上有碑的味道。」'; } }] },
    { min: 25, title: '劃名字的人', text: '陸知微攤開一卷長得看不到頭的抄本：「被劃掉的名字，每一個都對應一個隕落的仙人。可有些名字，被劃掉之後又出現了。」', choices: [
      { t: '幫他整理', run() { const a = arc('lu'); a.aff += 2; a.help = 1; return `你們整理了十年。你在抄本裡看到一個名字反覆出現又被劃掉，心頭一緊。對《${addTechXp(4000)}》的體悟卻因此深了。`; } },
      { t: '「這跟我有什麼關係？」', run() { arc('lu').cold = 1; return '他看了你一眼：「你自己心裡清楚。」'; } }] },
    { min: 26, title: '碑的另一面', text: '陸知微說，他找到了碑在仙界的倒影。只要有人守住這一頭，他就能過去看一眼。', choices: [
      { t: '替他守著', run(s) { const a = arc('lu'); if (battle('從裂縫裡湧出的虛空獸', s.stage + 1, 1.15)) { a.aff += 3; a.saw = 1; return '他回來時臉色蒼白，只說了一句：「上面也有人在等你。」'; } injure(240); a.aff += 1; return '你沒守住，裂縫關上了。他嘆了口氣：「下次吧。」'; } },
      { t: '勸他別去', run() { arc('lu').stay = 1; return '他沉默了很久，收起了抄本。'; } }] },
    { min: 27, title: '抄本', text() { const a = arc('lu'); return a.saw ? '陸知微要去仙界了——不是飛升，是偷渡。他把抄本託付給你。' : '陸知微老了。他把三千年的抄本攤在你面前，說他想不通的事，也許你想得通。'; }, choices: [
      { t: '收下抄本', run(s) { const a = arc('lu'); if (a.saw) { arcEnd('lu', 'crossed'); s.brkBonus += .1; return '他走了，再也沒有回來。抄本最後一頁是你的名字，旁邊寫著：「別被劃掉。」下次突破成功率 +10%。'; } arcEnd('lu', 'scholar'); return `你翻遍抄本，找到他留給你的一句話：「名字不是被劃掉的，是被藏起來的。」對《${addTechXp(5000)}》的領悟大進。`; } }] },
  ] },
  // 顧長歌：活了很久的大乘女修，在某一個前世教過你
  gu: { name: '顧長歌', steps: [
    { min: 27, title: '認得你的人', text: '一位白髮如雪的大乘女修在路上攔住你，看了很久：「你這一世，長這個樣子啊。」', choices: [
      { t: '「我們見過？」', run() { arc('gu').aff += 2; return '「很多世以前，你是我師父。」她說，「那時候我叫顧長歌，現在也是。」'; } },
      { t: '戒備地退開', run() { arc('gu').aff += 1; return '她笑了：「上一世你也是這樣。」'; } }] },
    { min: 28, title: '師父的劍', text: '顧長歌拿出一柄舊劍：「這是你當年的劍。你走的時候，什麼都沒帶。」', choices: [
      { t: '握住劍', run() { const a = arc('gu'); a.aff += 2; a.sword = 1; return `劍在你手裡輕輕震了一下。你想不起任何事，眼眶卻熱了。你得到${giftArt([4])}。`; } },
      { t: '「那不是我。」', run() { arc('gu').deny = 1; return '她收回了劍：「也是。人總會變的。」'; } }] },
    { min: 29, title: '渡劫之前', text: '顧長歌說她要渡劫了。三千年前你沒撐過去的那道雷，她想替你撐一次。', choices: [
      { t: '替她護法', run(s) { const a = arc('gu'); if (battle('劫雷的餘波', s.stage + 1, 1.2)) { a.aff += 3; a.guard = 1; return '你擋下了劫雷的餘波。她渡過了前八道。'; } injure(300); a.aff += 2; return '你被餘波震傷了，但她說，有你在旁邊就夠了。'; } },
      { t: '「我們一起撐。」', run() { arc('gu').aff += 2; return '她搖頭：「你的劫，要你自己渡。」'; } }] },
    { min: 30, title: '長歌', text() { const a = arc('gu'); return a.guard && a.aff >= 7 ? '第九道雷落下時，顧長歌回頭看你，笑了。然後她飛升了。' : '第九道雷落下時，你沒看清。等雷光散去，原地只剩一片燒焦的地。'; }, choices: [
      { t: '抬頭', run(s) { const a = arc('gu'); if (a.guard && a.aff >= 7) { arcEnd('gu', 'ascended'); s.brkBonus += .1; return '天上落下一片衣角，上面寫著：「師父，我在上面等你。」下次突破成功率 +10%。'; } if (a.deny) { arcEnd('gu', 'stranger'); return '你站了很久。你始終沒想起她是誰。'; } arcEnd('gu', 'fallen'); addLife(100); return '你在焦土裡找到她留下的一顆丹，服下之後壽元 +100。那是她三千年攢下的。'; } }] },
  ] },
});
Object.assign(ARC_END_LABEL, {
  founded: '她開了自己的宗門', free: '她逃出宗門，從此自由', elder: '她成了玄霄宗的長老',
  honest: '她收了黑市，開了間真藥鋪', vanish: '她殺光名單上的人後消失了', queen: '她成了修仙界的消息女王',
  crossed: '他偷渡去了仙界', scholar: '他把抄本留給了你',
  ascended: '她替你撐過了那道雷，先飛升了', fallen: '她倒在了第九道雷下', stranger: '你始終沒想起她',
});
MEMORIES.push(
  { id: 'shen_f', bond: 'shen', end: 'founded', min: 9, title: '小宗門', text: '路過一座小山，山門上掛著一塊舊匾。守門的孩子聽說你的名字，愣了一下，跑進去捧出一個布包：「祖師說，等這個名字的人來了，就把這個交給他。」', choices: [
    { t: '打開布包', run() { return `布包裡是一卷手抄的劍訣：${giftSkill([2, 3])}，還有一張字條：「謝謝你當年沒讓我去。」`; } }] },
  { id: 'shen_e', bond: 'shen', end: 'elder', min: 12, title: '玄霄宗的長老', text: '一位玄霄宗長老來招攬你，開出的條件好得出奇。她說，宗門一位已故的太上長老留過話：要對這個名字的人好一點。', choices: [
    { t: '收下見面禮', run() { return `見面禮是靈石 ${addStone(stoneUnit() * 10)}。你總覺得那位太上長老，有點像某個人。`; } }] },
  { id: 'yin_h', bond: 'yin', end: 'honest', min: 6, title: '九娘藥鋪', text: '一間老藥鋪掛著「九娘」的招牌，掌櫃是個年輕姑娘，聽說你的名字，從櫃檯底下拿出一個舊煙斗。「曾祖母說，有人來就送他。」', choices: [
    { t: '收下', run() { return `煙斗裡塞著一張藥方，你照方煉了三顆${addPill(3)}。`; } }] },
  { id: 'yin_q', bond: 'yin', end: 'queen', min: 15, title: '欠著的人情', text: '一個面具人攔住你：「我們主人說，你前世欠她一個人情。今生她不要了，算她欠你的。」', choices: [
    { t: '「什麼人情？」', run() { return `面具人沒有回答，留下一份情報走了。照著情報，你找到靈石 ${addStone(stoneUnit() * 15)}${tryDrop(.5)}。`; } }] },
  { id: 'lu_s', bond: 'lu', end: 'scholar', min: 18, title: '抄本殘頁', text: '你在一家舊書鋪翻到一頁發黃的紙，上面密密麻麻抄滿了名字，有些被劃掉了。最後一行的字跡你很熟悉。', choices: [
    { t: '讀到最後', run(s) { s.brkBonus += .08; return '最後一行寫著：「名字不是被劃掉的，是被藏起來的。」下次突破成功率 +8%。'; } }] },
  { id: 'gu_a', bond: 'gu', end: 'ascended', min: 12, title: '天上的衣角', text: '一陣風從天上吹下來一片衣角，落在你手心。上面寫著兩個字：「師父」。', choices: [
    { t: '收好', run() { addLife(50); return '衣角化成一縷仙氣，沒入你的眉心。壽元 +50。'; } }] },
  { id: 'gu_f', bond: 'gu', end: 'fallen', min: 15, title: '焦土上的花', text: '一片燒焦的地上開滿了白花，當地人說，很久以前有個女修在這裡渡劫失敗。你站在花裡，忽然很想哭。', choices: [
    { t: '在花裡坐一會兒', run() { return `你坐了一整天，修為 +${fmt(addXiu(.4))}。離開時，你不知道自己為什麼要說「對不起」。`; } }] },
);
