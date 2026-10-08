/* =========================================================
 * 《西行陕西》主题切换 theme.js
 * 支持：浅色 / 深色，记忆用户选择（localStorage）
 * 默认跟随系统 prefers-color-scheme
 * ========================================================= */
(function () {
  const KEY = 'xingxi-theme';
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function label(theme) {
    return theme === 'dark' ? '☀️ 浅色' : '🌙 深色';
  }

  function toggle() {
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = label(next);
  }

  // 启动时应用已保存或系统偏好
  (function init() {
    let t = null;
    try { t = localStorage.getItem(KEY); } catch (e) {}
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    apply(t);
    document.addEventListener('DOMContentLoaded', function () {
      const btn = document.querySelector('.theme-toggle');
      if (btn) {
        btn.textContent = label(current());
        btn.addEventListener('click', toggle);
      }
    });
  })();
})();
