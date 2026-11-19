// 模擬壞掉的存檔：主修指向不存在的根本仙法、沒有 custom、沒有 xj、沒有 xshen
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
const c = boot(); let j = JSON.parse(fs.readFileSync('asc_small.json', 'utf8')); if (j.S) j = j.S;
j.life.tech = 'xptGONE'; j.life.techs.xptGONE = 999; delete j.life.custom; delete j.life.xj; delete j.life.xshen; delete j.life.xpFrom; j.life.techs.x6_huo4 = 10;
run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))});`);
console.log(run(c, `(() => { try { load(); title = false; render(); for (let i = 0; i < 60; i++) tick(1); tab = 'cult'; cultTab = 'gong'; render(); const s = L(); return 'ok tech=' + TECHS[s.tech].name + ' xpath=' + TECHS[s.tech].xpath + ' xj=' + !!s.xj + ' xshen=' + JSON.stringify(s.xshen) + ' xpFrom=' + s.xpFrom; } catch (e) { return 'ERR ' + e.message; } })()`));
