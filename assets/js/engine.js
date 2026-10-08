/* =========================================================
 * 《西行陕西》时间引擎 + 推荐算法 engine.js
 * 依赖：data.js
 * ========================================================= */

/* ---------- 工具函数 ---------- */
function d(dateStr) { return new Date(dateStr + 'T00:00:00'); }
function inRange(dateStr, start, end) {
  return d(dateStr) >= d(start) && d(dateStr) <= d(end);
}

/* ---------- 时间引擎：根据日期推断可用时长 ---------- */
function inferPeriod(dateStr) {
  const dt = d(dateStr);
  const month = dt.getMonth() + 1;
  const week = dt.getDay(); // 0=周日

  // 1) 寒暑假（西交校历）
  for (const year of Object.keys(XJTU_CALENDAR)) {
    const cal = XJTU_CALENDAR[year];
    if (inRange(dateStr, cal.winter.start, cal.winter.end)) {
      return { type: 'vacation', label: '寒假中', days: 6, tip: '寒假大好时光，适合错峰深度游（注意保暖）' };
    }
    if (inRange(dateStr, cal.summer.start, cal.summer.end)) {
      return { type: 'vacation', label: '暑假中', days: 7, tip: '暑假超长假期，陕北/陕南长线随便安排' };
    }
  }

  // 2) 法定节假日
  for (const h of HOLIDAYS) {
    if (inRange(dateStr, h.start, h.end)) {
      const tip = h.days >= 5 ? '长假出行高峰，热门景点务必提前预约' : '小长假，2-3日游刚刚好';
      return { type: 'holiday', label: h.name, days: h.days, tip: `${h.name}${h.days}天，${tip}` };
    }
  }

  // 3) 周末（周五晚也算入周末）
  if (week === 6 || week === 0) {
    return { type: 'weekend', label: '周末', days: 2, tip: '周末 1-2 日游最合适，关中周边说走就走' };
  }
  if (week === 5) {
    return { type: 'weekend', label: '周五', days: 2, tip: '周五傍晚出发，周末两日游完美衔接' };
  }

  // 4) 普通工作日
  return { type: 'weekday', label: '工作日', days: 1, tip: '工作日建议市内半日/一日游（城墙、兵马俑、陕博）' };
}

/* ---------- 预算档位匹配 ---------- */
const BUDGET_TIERS = { poor: 0, comfort: 1, luxury: 2 };

function budgetScore(sight, tier) {
  const want = BUDGET_TIERS[tier];
  // 用三个档位的相对位置估算景点消费档次
  const avg = (sight.budget.poor + sight.budget.comfort + sight.budget.luxury) / 3;
  let sightTier;
  if (avg < 300) sightTier = 0;
  else if (avg < 650) sightTier = 1;
  else sightTier = 2;
  return Math.max(0, 1 - Math.abs(want - sightTier) * 0.5);
}

/* ---------- 推荐算法 ---------- */
function recommend(dateStr, campus, prefs, budgetTier) {
  const period = inferPeriod(dateStr);
  const month = d(dateStr).getMonth() + 1;

  const scored = SIGHTS.map(s => {
    // 1) 时长适配（40%）：可用天数 >= 景点建议最小天数，且不超过最大天数太多
    const minD = Math.min(...s.days);
    const maxD = Math.max(...s.days);
    let dayFit;
    if (period.days >= minD && period.days <= maxD + 1) dayFit = 1;
    else if (period.days >= minD) dayFit = 0.8;   // 时间富余也可去
    else dayFit = 0.3;                            // 时间不足
    // 1 天行程给 1 日景点更高分
    if (period.days === 1 && s.days.includes(1)) dayFit = 1;

    // 2) 偏好匹配（30%）
    let prefHit = 0;
    for (const p of prefs) {
      if (s.tags.includes(p)) prefHit += 1;
    }
    const prefScore = prefs.length ? prefHit / prefs.length : 0.6;

    // 3) 预算匹配（20%）
    const budScore = budgetScore(s, budgetTier);

    // 4) 季节指数（10%）
    const seas = (s.monthScore[month] || 2) / 5;

    const total = dayFit * 0.40 + prefScore * 0.30 + budScore * 0.20 + seas * 0.10;
    return { sight: s, score: total, dayFit, prefScore, budScore, seas };
  });

  scored.sort((a, b) => b.score - a.score);
  return { period, month, list: scored };
}

/* ---------- 时间判定文案 ---------- */
function periodText(p) {
  return `${p.label} · 可安排 ${p.days} 天 · ${p.tip}`;
}
