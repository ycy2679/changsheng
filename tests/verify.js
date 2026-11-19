// 長生閒記一鍵驗證：node tests/verify.js            快速（約幾分鐘）
//                     node tests/verify.js --bots     再加機器人長跑（單修、雙修、三修、新手，看節奏）
// 每項測試在 fixtures 資料夾裡跑（測試存檔都放那裡），輸出裡出現 fail 規則就算失敗；最後列出結果，有失敗就 exit 1
const { spawnSync } = require('child_process'), path = require('path'), fs = require('fs'), os = require('os');
const DIR = __dirname, FIX = path.join(DIR, 'fixtures'), BOTS = process.argv.includes('--bots');

// 語法檢查：遊戲檔案有一個語法錯誤整頁就載不起來
const GAME = ['data.js', 'gear.js', 'talents.js', 'events.js', 'events2.js', 'xian.js', 'game.js'];

// [名稱, 檔案, 參數, 失敗規則（輸出符合就算失敗）, 說明]
const TESTS = [
  ['畫面', 'render.js', ['strong', 'fa', '30'], [/"RENDER_ERR": \[\s*"/, /"BAD": \{\s*"/], '機器人跑 30 小時，每 5 分鐘把所有分頁畫一次'],
  ['點擊', 'clicks.js', [], [/"CLICK_ERR": \{\s*"/, /"BAD": \{\s*"/, /"RENDER_ERR": \[\s*"/], '畫面上每個按鈕都點一次'],
  ['事件', 'events.js', [], [/錯誤 [1-9]/, /怪字 [1-9]/], '所有事件、人物劇情、主線的每個選項'],
  ['舊存檔', 'oldsaves.js', [], [/"errs":\["/, /Error/], '用新版讀舊存檔'],
  ['煉器重複', 'forge.js', [], [/"allSold":false/, /Error/], '重複煉出的法寶直接賣掉'],
  ['經濟', 'economy.js', [], [/bad [1-9]/, /Error/], '每個物品的賣價不能高於坊市買價（凡、仙各幾個境界）'],
  ['離線與存檔', 'offline.js', [], [/ERR/, /diff=\["/, /Error/], '離線 1/8/24 小時、存檔匯出再匯入不變'],
  ['悟道樹全滿', 'talents.js', [], [/errs=\["/, /sus=\["/, /Error/], '天賦全點滿、化身全開，凡仙各跑 3 小時並掃畫面怪字'],
  ['從仙人開始', 'xianstart.js', [], [/ERR/, /x25 .* [+]*-/, /Error/], '單修、雙修、三修從仙人開始；連續轉世 25 次（回歸）'],
  ['壞存檔修復', 'repairsave.js', [], [/ERR/, /xj=false/, /xshen=undefined/, /Error/], '主修指向不存在的根本仙法時讀檔自動修復'],
];
if (BOTS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-pace-'));
  for (const [preset, p, h] of [['strong', 'fa', 40], ['strong', 'ti', 40], ['strong', 'hun', 40], ['strong', "fa','ti", 40], ['strong', "hun','fa','ti", 40], ['new', 'fa', 70]])
    TESTS.push(['節奏 ' + preset + ' ' + p.replace(/','/g, '+'), 'pace.js', [preset, p, String(h), path.join(tmp, `${preset}_${p.replace(/\W/g, '')}.json`)], [/"errs": \[\s*"/, /"bad": \[\s*"/], '機器人長跑，看飛升後到玄仙的時間']);
  TESTS.push(['節奏彙整', 'pacesum.js', ['.*\\.json$'], [], '各路線到玄仙的時間', tmp]);
}

const res = [];
const t0 = Date.now();
for (const f of GAME) {
  const r = spawnSync(process.execPath, ['--check', path.join(DIR, '..', f)], { encoding: 'utf8' });
  if (r.status !== 0) res.push(['語法 ' + f, false, r.stderr.split('\n').slice(0, 4).join(' ')]);
}
if (!res.length) res.push(['語法檢查', true, GAME.length + ' 個檔案']);
for (const [name, file, args, fails, desc, cwd] of TESTS) {
  const t = Date.now(); process.stdout.write(`… ${name}（${desc}）`);
  const r = spawnSync(process.execPath, [path.join(DIR, file), ...args], { cwd: cwd || FIX, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 20 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const hit = fails.find(re => re.test(out));
  const ok = r.status === 0 && !hit;
  const sec = Math.round((Date.now() - t) / 1000);
  process.stdout.write(`\r${ok ? '✓' : '✗'} ${name} ${sec}s${' '.repeat(30)}\n`);
  if (!ok || name === '節奏彙整') console.log(out.split('\n').filter(Boolean).slice(-15).map(l => '    ' + l.slice(0, 300)).join('\n'));
  res.push([name, ok, hit ? '符合失敗規則 ' + hit : r.status !== 0 ? 'exit ' + r.status : '']);
}
const bad = res.filter(x => !x[1]);
console.log(`\n${bad.length ? '✗ 有 ' + bad.length + ' 項失敗' : '✓ 全部通過'}（${res.length} 項，${Math.round((Date.now() - t0) / 1000)} 秒）`);
for (const [n, ok, why] of bad) console.log(`  ✗ ${n}：${why}`);
process.exit(bad.length ? 1 : 0);
