// 經濟套利掃描：每個物品的賣價不能高於買價（凡界、仙界各幾個境界）
const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
for (const [f, adds] of [['oldA.json', [0, 6, 12, 20, 30]], ['asc_small.json', [0, 9, 18, 27, 35]]]) {
  const c = boot(); let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.S) j = j.S;
  run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false;`);
  console.log(f, run(c, `(() => { const s = L(), base = s.stage, bad = [], n = { checked: 0 };
    for (const a of ${JSON.stringify(adds)}) { s.stage = Math.min(STAGES.length - 1, base + a); if (!isXian(s) && s.stage > MORTAL_TOP) continue;
      for (const id in ITEMS) { const it = ITEMS[id]; let buy, sell; try { buy = itemPrice(id); sell = sellItemPrice(id); } catch (e) { bad.push(stg(s).name + ' ' + id + ' ERR ' + e.message); continue; }
        if (!isFinite(buy) || !isFinite(sell)) { bad.push(stg(s).name + ' ' + it.name + ' NaN ' + buy + '/' + sell); continue; }
        n.checked++;
        // 只在坊市會賣的才算套利：材料、丹藥（修為丹只賣當前境界那顆）
        const sold = it.kind === 'mat' ? it.grade <= matGrade(s) : it.kind === 'xiu' ? id === XIU_PILLS[stg(s).major] : ['heal', 'mp'].includes(it.kind) || (!!it.xian === isXian(s) && ['dan', 'body', 'tech', 'xlife', 'life'].includes(it.kind));
        const realBuy = it.kind === 'mat' ? herbPrice(it.grade) : buy;
        if (sold && sell > realBuy) bad.push(stg(s).name + ' ' + it.name + '(' + it.kind + ') 賣' + sell + ' > 買' + realBuy);
      } }
    return 'checked ' + n.checked + ' bad ' + bad.length + (bad.length ? ': ' + bad.slice(0, 15).join(' ; ') : ''); })()`));
}
