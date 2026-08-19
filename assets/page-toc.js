/* KYE Study Notes — shared floating "on this page" TOC widget.
   Builds its list from whatever navigation the page already has,
   in priority order, so it stays organized instead of dumping every
   heading it can find:
     1. an existing nav.toc / .toc block with #anchor links (most pages)
     2. a plain <nav>/.sidebar with #anchor links (webhook, linux-permissions)
     3. data-target="#id" buttons (jwt-study's JS-driven sidebar)
     4. fallback: top-level h1/h2[id] headings in document order
   Skips itself entirely on pages with fewer than two sections, or
   pages that use a multi-page tab switcher instead of scroll nav
   (docker-container-study's .navbar .nav-tab). */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function cleanText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.new, .sub, .badge').forEach(function (x) { x.remove(); });
    var parts = [];
    clone.childNodes.forEach(function (n) { parts.push(n.textContent); });
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function dedupe(entries) {
    var seen = {};
    return entries.filter(function (e) {
      if (!e.id || !e.text || seen[e.id]) return false;
      seen[e.id] = true;
      return true;
    });
  }

  function fromExistingToc() {
    var toc = document.querySelector('nav.toc, .toc');
    if (!toc) return null;
    var links = toc.querySelectorAll('a[href^="#"]');
    if (links.length < 2) return null;
    return dedupe(Array.from(links).map(function (a) {
      return { id: a.getAttribute('href').slice(1), text: cleanText(a) };
    }));
  }

  function fromNavLinks() {
    var links = document.querySelectorAll('nav a[href^="#"], .sidebar a[href^="#"]');
    if (links.length < 2) return null;
    var filtered = Array.from(links).filter(function (a) {
      return !a.closest('.kye-topbar, .kye-toc');
    });
    return dedupe(filtered.map(function (a) {
      return { id: a.getAttribute('href').slice(1), text: cleanText(a) };
    }));
  }

  function fromDataTargets() {
    var btns = document.querySelectorAll('[data-target^="#"]');
    if (btns.length < 2) return null;
    return dedupe(Array.from(btns).map(function (b) {
      return { id: b.getAttribute('data-target').slice(1), text: cleanText(b) };
    }));
  }

  function fromHeadings() {
    if (document.querySelector('.navbar .nav-tab')) return null; // multi-page tab switcher, not scroll nav
    var scope = document.querySelector('.page.active') || document.querySelector('main') || document.body;

    var direct = scope.querySelectorAll('h1[id], h2[id]');
    var entries = dedupe(Array.from(direct)
      .filter(function (h) { return !h.closest('.kye-topbar, .kye-toc, nav, footer'); })
      .map(function (h) { return { id: h.id, text: cleanText(h) }; }));
    if (entries.length >= 2) return entries;

    var wrapped = scope.querySelectorAll('[id]');
    entries = dedupe(Array.from(wrapped)
      .filter(function (el) { return !el.closest('.kye-topbar, .kye-toc, nav, footer'); })
      .map(function (el) {
        var heading = el.querySelector('h1,h2,h3');
        return heading ? { id: el.id, text: cleanText(heading) } : null;
      })
      .filter(Boolean));
    return entries.length >= 2 ? entries : null;
  }

  function findEntries() {
    return fromExistingToc() || fromNavLinks() || fromDataTargets() || fromHeadings() || [];
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
