/* =========================================================
 * 《西行陕西》陕西介绍页 shaanxi.js
 * 依赖：data.js
 * 地图策略：配置高德 key 后自动加载真实地图；
 *          未配置时降级为"南北三带"分区示意（可点击）。
 * ========================================================= */

/* ---------- 陕西经纬度范围（示意投影用） ---------- */
const MAP_BOUNDS = { latMax: 39.6, latMin: 31.7, lngMin: 106.0, lngMax: 111.2 };

function project(lng, lat, w, h) {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
  return { x, y };
}

/* ---------- 渲染三大区域卡片 ---------- */
function renderRegions() {
  const box = document.getElementById('region-cards');
  box.innerHTML = REGIONS.map(r => `
    <div class="region-card" style="background:linear-gradient(135deg, ${r.color}, ${r.color}CC);">
      <h3>${r.name}</h3>
      <p>${r.desc}</p>
      <div class="chips">${r.sights.map(n => `<span>${n}</span>`).join('')}</div>
    </div>`).join('');
}

/* ---------- 渲染全部景点卡片 ---------- */
function renderAllSights() {
  const box = document.getElementById('all-sights');
  box.innerHTML = '';
  SIGHTS.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'sight-card';
    card.innerHTML = `
      <div class="head">
        <div class="nm">${s.name}</div>
        <div class="rg">${s.region} · ${s.city} · ${s.tags.join(' / ')}</div>
      </div>
      <div class="body">
        <div class="intro">${s.intro}</div>
        <div class="meta">
          <span>🎓 ${s.studentDiscount ? '学生半价' : '以景区政策为准'}</span>
          <span>⏱ ${s.days.join('/')} 天</span>
        </div>
      </div>`;
    card.addEventListener('click', () => openModal(s));
    box.appendChild(card);
  });
}

/* ---------- 详情弹层（复用样式） ---------- */
function openModal(s) {
  document.getElementById('m-title').textContent = `${s.name} · ${s.city}`;
  document.getElementById('m-body').innerHTML = `
    <p style="font-size:15px; color:var(--c-muted); margin-bottom:6px;">${s.intro}</p>
    <h4>基本信息</h4>
    <div class="info-grid">
      <div class="info-item"><div class="k">所属区域</div><div class="v">${s.region} · ${s.city}</div></div>
      <div class="info-item"><div class="k">建议游玩</div><div class="v">${s.days.join('/')} 天</div></div>
      <div class="info-item"><div class="k">成人门票</div><div class="v">${s.ticket.adult}</div></div>
      <div class="info-item"><div class="k">学生门票</div><div class="v stu">${s.ticket.student}</div></div>
      <div class="info-item" style="grid-column:1/-1"><div class="k">预算参考（人均 2 日）</div>
        <div class="v">🪙 穷游 ¥${s.budget.poor} ｜ 💛 舒适 ¥${s.budget.comfort} ｜ 💎 轻奢 ¥${s.budget.luxury}</div></div>
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

/* ---------- 降级：南北三带示意地图 ---------- */
function renderBands() {
  const bands = document.getElementById('bands');
  const W = bands.clientWidth || 900;
  const H = 420;

  // 三带高度按纬度比例
  const ySb = ((MAP_BOUNDS.latMax - 35.6) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * (H - 40);
  const ySn = ((MAP_BOUNDS.latMax - 34.0) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * (H - 40);
  const bandStyle = (top, height, color, name, sub) => `
    <div class="band" style="position:absolute; left:0; right:0; top:${top}px; height:${height}px; background:linear-gradient(135deg, ${color}E6, ${color}AA);">
      <div class="band-name">${name}</div>
      <div class="band-sub">${sub}</div>
    </div>`;

  bands.innerHTML = [
    bandStyle(10, ySb - 10, '#92400E', '陕北 · 黄土高原', '延安 榆林 ｜ 丹霞·黄河·红色圣地'),
    bandStyle(ySb, ySn - ySb, '#B45309', '关中 · 八百里秦川', '西安 咸阳 宝鸡 渭南 ｜ 周秦汉唐·古迹云集'),
    bandStyle(ySn, H - 40 - ySn, '#15803D', '陕南 · 秦巴山水', '汉中 安康 商洛 ｜ 汉江·秦岭·江南水乡')
  ].join('');

  // 景点标记
  SIGHTS.forEach(s => {
    const { x, y } = project(s.lng, s.lat, W - 40, H - 40);
    const m = document.createElement('div');
    m.className = 'marker';
    m.style.left = (x + 20) + 'px';
    m.style.top = (y + 10) + 'px';
    m.innerHTML = `<span class="marker-label">${s.name}</span>`;
    m.title = s.name;
    m.addEventListener('click', () => openModal(s));
    bands.appendChild(m);
  });

  // 校区标记
  for (const key of ['xingqing', 'innovation']) {
    const c = CAMPUS[key];
    const { x, y } = project(c.lng, c.lat, W - 40, H - 40);
    const m = document.createElement('div');
    m.className = 'marker';
    m.style.left = (x + 20) + 'px';
    m.style.top = (y + 10) + 'px';
    m.style.background = '#FDE68A';
    m.style.borderColor = '#B91C1C';
    m.innerHTML = `<span class="marker-label">🏫 ${c.name}</span>`;
    bands.appendChild(m);
  }
}

/* ---------- 高德地图（JS API 2.0 官方加载方式） ---------- */
function initAmap() {
  return new Promise((resolve, reject) => {
    if (!AMAP_CONFIG.key) { reject(new Error('未配置高德 Key')); return; }

    // ⚠️ JS API 2.0：安全密钥必须在加载脚本【之前】通过全局配置声明，否则地图鉴权失败
    if (AMAP_CONFIG.securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode: AMAP_CONFIG.securityJsCode };
    }

    // 超时保护：15 秒没加载成功就提示
    const timer = setTimeout(() => reject(new Error('地图加载超时（网络或鉴权问题）')), 15000);

    window._AMapLoaded = () => {
      clearTimeout(timer);
      const map = new AMap.Map('map-container', {
        zoom: 6,
        center: [108.9, 35.2],
        viewMode: '2D',
        resizeEnable: true,
        mapStyle: 'amap://styles/normal'
      });
      SIGHTS.forEach(s => {
        const mk = new AMap.Marker({ position: [s.lng, s.lat], title: s.name });
        mk.on('click', () => openModal(s));
        map.add(mk);
      });
      [CAMPUS.xingqing, CAMPUS.innovation].forEach(c => {
        const mk = new AMap.Marker({
          position: [c.lng, c.lat], title: '🏫 ' + c.name,
          label: { content: '🏫 ' + c.name, direction: 'top', offset: new AMap.Pixel(-30, -4) }
        });
        map.add(mk);
      });
      resolve(map);
    };
    window._AMapError = (e) => {
      clearTimeout(timer);
      reject(new Error((e && e.errorMsg) || '地图鉴权失败'));
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_CONFIG.key}&callback=window._AMapLoaded&errorCallback=window._AMapError`;
    document.head.appendChild(script);
  });
}

/* 地图加载失败时的友好提示 */
function showMapError(err) {
  const tip = document.getElementById('map-tip');
  if (!tip) return;
  tip.innerHTML = `⚠️ 地图加载失败：${(err && err.message) || '未知错误'}
    <br>常见原因与解决：<br>
    ① 必须用 http:// 地址访问（如 http://localhost:8000/shaanxi.html），不能直接双击打开<br>
    ② 高德 Key 的「域名白名单」需包含当前访问域名（localhost、127.0.0.1）<br>
    ③ 安全密钥 securityJsCode 需与 Key 匹配，且加载前已全局声明`;
}

/* ---------- 启动 ---------- */
function boot() {
  renderRegions();
  renderAllSights();

  document.getElementById('m-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  if (AMAP_CONFIG.key) {
    initAmap().then(() => {
      document.getElementById('map-fallback').classList.add('hidden');
      document.getElementById('map-container').classList.remove('hidden');
    }).catch(err => {
      showMapError(err);
      renderBands();
    });
  } else {
    document.getElementById('map-tip').textContent =
      '💡 在 assets/js/data.js 中配置 AMAP_CONFIG.key 后，将自动切换为高德真实地图';
    renderBands();
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', boot);
