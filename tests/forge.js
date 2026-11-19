const { boot, run } = require('./lib/h5.js'); const fs = require('fs');
for (const f of ['oldA.json', 'asc_small.json']) { const c = boot(); let j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.S) j = j.S;
  run(c, `localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(j))}); load(); title = false;`);
  console.log(f, run(c, `(() => { const s = L(), g = isXian(s) ? 6 : 2, slot = '飾品'; const pool = forgePool(slot, g, s); for (const id of pool) s.arts[id] = 9; s.forge = 99999;
    const st0 = s.stone, res = []; const chance = forgeChance; forgeChance = () => 1;
    for (let i = 0; i < 5; i++) { forgeDone({ slot, g }, s); res.push(cur(s.log[0].text)); }
    forgeChance = chance; return JSON.stringify({ gain: s.stone - st0, sample: res[0], allSold: res.every(r => /直接賣了/.test(r)) }); })()`)); }
