/* =========================================================
 * 《西行陕西》首页逻辑 main.js
 * 依赖：data.js, engine.js
 * ========================================================= */

/* ---------- 状态 ---------- */
const state = {
  campus: 'xingqing',
  date: todayStr(),
  prefs: [],
  budget: 'comfort'
};

function todayStr() {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${t.getFullYear()}-${m}-${d}`;
}

/* ---------- 初始化 ---------- */
function init() {
  const dateInput = document.getElementById('date-input');
  dateInput.value = state.date;
  dateInput.min = '2026-01-01';
  dateInput.max = '2027-12-31';
  dateInput.addEventListener('change', e => { state.date = e.target.value; });

  // 校区
  document.querySelectorAll('#campus-box .campus-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#campus-box .campus-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.campus = card.dataset.campus;
    });
  });

  // 偏好
  document.querySelectorAll('#pref-box .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const p = chip.dataset.pref;
      const i = state.prefs.indexOf(p);
      if (i >= 0) { state.prefs.splice(i, 1); chip.classList.remove('on'); }
      else { state.prefs.push(p); chip.classList.add('on'); }
    });
  });

  // 预算
  document.querySelectorAll('#budget-box .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#budget-box .chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      state.budget = chip.dataset.budget;
    });
  });

  // 推荐按钮
  document.getElementById('btn-recommend').addEventListener('click', run);
  document.getElementById('m-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  run(); // 首次自动推荐
}

/* ---------- 执行推荐 ---------- */
function run() {
  const result = recommend(state.date, state.campus, state.prefs, state.budget);

  // 时间判定横幅
  const banner = document.getElementById('period-banner');
  banner.classList.remove('hidden');
  document.getElementById('period-tag').textContent = result.period.label;
  document.getElementById('period-text').textContent = periodText(result.period);

  // 结果副标题
  const campusName = CAMPUS[state.campus].name;
  const budgetName = { poor: '穷游', comfort: '舒适', luxury: '轻奢' }[state.budget];
  const prefName = state.prefs.length ? state.prefs.join('、') : '不限偏好';
  document.getElementById('result-sub').textContent =
    `从 ${campusName} 出发 · ${result.period.label} · ${prefName} · ${budgetName}档`;

  // 渲染卡片
  const grid = document.getElementById('sight-grid');
  grid.innerHTML = '';
  result.list.forEach((item, idx) => {
    grid.appendChild(sightCard(item, idx + 1));
  });
}

/* ---------- 景点卡片 ---------- */
function sightCard(item, rank) {
  const s = item.sight;
  const card = document.createElement('div');
  card.className = 'sight-card';
  card.innerHTML = `
    <span class="score">匹配度 ${(item.score * 100).toFixed(0)}%</span>
    <div class="head">
      <div class="nm">${rank}. ${s.name}</div>
      <div class="rg">${s.region} · ${s.city}</div>
    </div>
    <div class="body">
      <div class="tags">${s.tags.map(t => `<span>${t}</span>`).join('')}${s.extra ? s.extra.map(t => `<span>${t}</span>`).join('') : ''}</div>
      <div class="intro">${s.intro}</div>
      <div class="meta">
        <span>⏱ 建议 ${s.days.join('/')} 天</span>
        <span>🍁 本月适游 ★${'★'.repeat(s.seas >= 0.6 ? Math.round(s.seas * 5) : 1)}</span>
      </div>
      <div class="meta">
        <span>🎓 学生优惠：${s.studentDiscount ? '✅ 有' : '❌ 无'}</span>
        <span style="color:var(--c-primary)">点击查看攻略 →</span>
      </div>
    </div>`;
  card.addEventListener('click', () => openModal(s));
  return card;
}

/* ---------- 详情弹层 ---------- */
function openModal(s) {
  document.getElementById('m-title').textContent = `${s.name} · ${s.city}`;
  const body = document.getElementById('m-body');
  const camp = CAMPUS[state.campus];
  const transport = s.transport[state.campus] || s.transport.xingqing;

  body.innerHTML = `
    <p style="font-size:15px; color:var(--c-muted); margin-bottom:6px;">${s.intro}</p>

    <h4>基本信息</h4>
    <div class="info-grid">
      <div class="info-item"><div class="k">所属区域</div><div class="v">${s.region} · ${s.city}</div></div>
      <div class="info-item"><div class="k">建议游玩</div><div class="v">${s.days.join('/')} 天</div></div>
      <div class="info-item"><div class="k">成人门票</div><div class="v">${s.ticket.adult}</div></div>
      <div class="info-item"><div class="k">学生门票</div><div class="v stu">${s.ticket.student}</div></div>
      <div class="info-item" style="grid-column:1/-1"><div class="k">预算参考（人均 2 日）</div>
        <div class="v">🪙 穷游 ¥${s.budget.poor} ｜ 💛 舒适 ¥${s.budget.comfort} ｜ 💎 轻奢 ¥${s.budget.luxury}</div></div>
      <div class="info-item" style="grid-column:1/-1"><div class="k">从 ${camp.name} 出发</div><div class="v">${transport}</div></div>
    </div>
    ${s.ticket.note ? `<p class="text-muted mt8" style="font-size:12.5px;">⚠️ ${s.ticket.note}</p>` : ''}

    <h4>必去打卡</h4>
    <ul class="clean">${s.mustSee.map(m => `<li>${m}</li>`).join('')}</ul>

    <h4>出行提示</h4>
    <ul class="clean">${s.tips.map(t => `<li>${t}</li>`).join('')}</ul>
  `;
  document.getElementById('modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', init);
