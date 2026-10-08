// 快速验证《西行陕西》引擎逻辑（临时测试文件）
const fs = require('fs');
const path = require('path');

function read(f) { return fs.readFileSync(path.join(__dirname, f), 'utf8'); }

// data + engine + 测试代码 合并到同一个 eval 作用域
const code = read('assets/js/data.js') + '\n' + read('assets/js/engine.js') + '\n' + `
// ===== 测试 =====
const cases = [
  { desc: '周末（2026-10-10 周六）', date: '2026-10-10', prefs: ['自然山水'], budget: 'comfort' },
  { desc: '国庆尾声（2026-10-05）', date: '2026-10-05', prefs: ['人文历史', '美食之旅'], budget: 'poor' },
  { desc: '工作日（2026-10-14 周三）', date: '2026-10-14', prefs: [], budget: 'comfort' },
  { desc: '寒假（2026-02-01）', date: '2026-02-01', prefs: ['自然山水'], budget: 'luxury' },
  { desc: '暑假（2026-08-10）', date: '2026-08-10', prefs: ['自然山水'], budget: 'poor' }
];
let failed = 0;
for (const c of cases) {
  const r = recommend(c.date, 'xingqing', c.prefs, c.budget);
  const top3 = r.list.slice(0, 3).map(i => i.sight.name + '(' + (i.score*100).toFixed(0) + '%)').join(' | ');
  console.log('\\n【' + c.desc + '】');
  console.log('  时间判定: ' + periodText(r.period));
  console.log('  Top3: ' + top3);
  if (!r.period || !r.list || r.list.length === 0) { failed++; console.log('  ❌ 结果异常'); }
}
for (const s of SIGHTS) {
  if (!s.transport.xingqing || !s.transport.innovation) { console.log('❌ ' + s.name + ' 缺少校区交通字段'); failed++; }
  for (const k of ['id','name','region','tags','days','ticket','budget','mustSee','tips','intro','monthScore']) {
    if (s[k] === undefined || s[k] === null) { console.log('❌ ' + s.name + ' 缺少字段 ' + k); failed++; }
  }
}
console.log('\\n共 ' + SIGHTS.length + ' 个景点，测试' + (failed === 0 ? '全部通过 ✅' : '发现 ' + failed + ' 处问题 ❌'));
process.exit(failed ? 1 : 0);
`;
eval(code);
