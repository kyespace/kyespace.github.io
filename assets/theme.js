/* KYE Study Notes — shared theme toggle wiring.
   Pairs with the inline no-flash snippet in each page's <head>, which sets
   documentElement[data-theme] before first paint. This file just wires the
   toggle button and persists the choice. */
(function () {
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyIcon(btn, theme) {
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('kye-theme', theme); } catch (e) {}
    applyIcon(document.querySelector('.kye-theme-toggle'), theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.kye-theme-toggle');
    applyIcon(btn, currentTheme());
    if (btn) {
      btn.addEventListener('click', function () {
        setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    }
  });
})();
