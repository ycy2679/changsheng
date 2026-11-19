// 無頭測試：把 6 個 js 串起來，stub 掉 DOM，回傳 vm context
const fs = require('fs'), vm = require('vm');
const dir = require('path').join(__dirname, '..', '..') + '/';
function boot() {
  const store = {};
  const ELS = {}; const el = id => ELS[id] = ELS[id] || ({ textContent: '', innerHTML: '', style: {}, classList: { toggle() {} }, firstChild: { style: {} }, dataset: {} });
  const ctx = {
    console, Math, Date, JSON, innerWidth: 1200, innerHeight: 800, matchMedia: () => ({ matches: true, addEventListener() {} }), setInterval: () => 0, addEventListener() {}, scrollTo() {},
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] },
    document: { getElementById: el, activeElement: null, title: '', body: { className: '', classList: { contains: () => false, toggle() {} }, appendChild() {} }, createElement: () => ({}), documentElement: { classList: { contains: () => false, toggle() {} } } },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  let src = ['data.js', 'gear.js', 'talents.js', 'events.js', 'events2.js', 'xian.js', 'game.js'].map(f => fs.readFileSync(dir + f, 'utf8')).join('\n;\n');
  src = src.replace(/^(const|let) /gm, 'var ');   // 讓測試碼拿得到全域
  vm.runInContext(src, ctx);
  vm.runInContext(`title=false; save=()=>{}; var RENDER_ERR = []; { const _r = render; render = () => { try { _r(); } catch (e) { const k = e.message + ' @' + (e.stack.split(String.fromCharCode(10))[1] || '').trim(); if (!RENDER_ERR.includes(k)) RENDER_ERR.push(k); } }; }`, ctx);
  return ctx;
}
module.exports = { boot, run: (ctx, code) => vm.runInContext(code, ctx) };
