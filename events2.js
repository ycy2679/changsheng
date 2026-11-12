// 長生閒記：第二批遊歷事件、四位新人物、他們的前世羈絆
// 每個事件都是不同的情境，不做換名字的重複事件。沒標 repeat 的一世只發生一次。

// 小工具：給一件沒拿過的法寶／功法／武技，回傳文字（拿不到就給靈石）
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
    { min: 24, title: '碑上的名字', text: '老人讓你看那塊碑。碑面慢慢浮現出無數名字，都是曾經飛升的人。最後幾個名字被劃掉了。', choices: [
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
