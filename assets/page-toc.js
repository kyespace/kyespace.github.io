/* KYE Study Notes — shared floating "on this page" TOC widget.
   Scans the page for heading-bearing [id] elements and builds a
   click-to-expand panel. Skips itself if the page has fewer than
   two sections worth linking to. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function findEntries() {
    var container = document.querySelector('main') || document.body;
    var nodes = container.querySelectorAll('[id]');
    var seen = {};
    var entries = [];
    nodes.forEach(function (el) {
      if (!el.id || seen[el.id]) return;
      if (el.closest('.kye-topbar, .kye-toc, nav, footer')) return;
      var heading = /^H[1-4]$/.test(el.tagName) ? el : el.querySelector('h1,h2,h3,h4');
      if (!heading) return;
      var text = heading.textContent.replace(/\s+/g, ' ').trim();
      if (!text || text.length > 90) return;
      seen[el.id] = true;
      entries.push({ id: el.id, text: text });
    });
    return entries;
  }

  function headerOffset() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--kye-header-h');
    var n = parseInt(v, 10);
    return isNaN(n) ? 56 : n;
  }

  function build(entries) {
    var wrap = document.createElement('div');
    wrap.className = 'kye-toc';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kye-toc-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', '목차 열기');
    btn.innerHTML = '<span class="kye-toc-icon">📑</span><span class="kye-toc-label">목차</span>';

    var panel = document.createElement('div');
    panel.className = 'kye-toc-panel';
    panel.hidden = true;

    var head = document.createElement('div');
    head.className = 'kye-toc-panel-head';
    var headLabel = document.createElement('span');
    headLabel.textContent = '이 페이지의 목차';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kye-toc-close';
    closeBtn.setAttribute('aria-label', '목차 닫기');
    closeBtn.textContent = '×';
    head.appendChild(headLabel);
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var list = document.createElement('div');
    list.className = 'kye-toc-list';
    entries.forEach(function (e) {
      var a = document.createElement('a');
      a.href = '#' + e.id;
      a.textContent = e.text;
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var target = document.getElementById(e.id);
        if (target) {
          var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() - 12;
          window.scrollTo({ top: top, behavior: 'smooth' });
          history.pushState(null, '', '#' + e.id);
        }
        close();
      });
      list.appendChild(a);
    });
    panel.appendChild(list);

    function onDocClick(ev) {
      if (!wrap.contains(ev.target)) close();
    }
    function onKeydown(ev) {
      if (ev.key === 'Escape') close();
    }
    function open() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', '목차 닫기');
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onKeydown);
    }
    function close() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', '목차 열기');
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKeydown);
    }
    btn.addEventListener('click', function () {
      if (panel.hidden) open(); else close();
    });
    closeBtn.addEventListener('click', close);

    wrap.appendChild(panel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  ready(function () {
    var entries = findEntries();
    if (entries.length < 2) return;
    build(entries);
  });
})();
