const fs = require('fs');
const pat = new RegExp(process.argv[2] || '^r120b?_.*\\.json$');
for (const f of fs.readdirSync('.').filter(x => pat.test(x)).sort()) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8')), m = j.majors, lives = {};
  for (const k in m) { const [l, n] = k.split(':'); (lives[l] = lives[l] || {})[n] = +m[k]; }
  const segs = Object.entries(lives).filter(([, v]) => v['人仙'] !== undefined).map(([l, v]) => `L${l}:人仙${v['人仙']}→玄仙${v['玄仙'] ?? '-'}`).join(' ');
  console.log(f.padEnd(20), j.now.padEnd(22), segs, '| 死', j.deaths.filter(d => d[0] === 'death' || d[4] === 'FAIL').map(d => d.slice(1).join('/')).join(';'), '| err', j.errs.length + j.bad.length);
}
